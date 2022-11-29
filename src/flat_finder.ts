import { webkit } from "@playwright/test";
import { parse } from "cookie";
import { readFile, writeFile } from "fs/promises";
import { uniq } from "lodash";
import { cookies, message, url } from "./_config";

findNewFlats();

async function findNewFlats() {
  const DATABASE_PATH = "./database.json";
  const RELOAD_INTERVAL_MS = 30_000;

  const buffer = await readFile(DATABASE_PATH);
  let database = JSON.parse(buffer as unknown as string);

  const browser = await webkit.launch({
    headless: true,
  });

  const page = await browser.newPage();
  const ctx = page.context();

  const cookie_values = parse(cookies);
  await ctx.addCookies(
    Object.entries(cookie_values).map(([name, value]) => ({
      name,
      value,
      domain: "www.immobilienscout24.de",
      path: "/",
    }))
  );

  const timeout = 1000 * 60 * 15;
  await page.goto(url, { timeout });
  await page.click('[data-testid="uc-accept-all-button"]', { timeout });

  while (true) {
    const start = new Date();

    console.log("=========== SEEKING FLATS ============\n");

    const pageContent = await page.content();
    const isRobot = pageContent?.includes("Ich bin kein Roboter") ?? false;

    if (isRobot) {
      console.log("ROBOT PAGE");
    }

    const list = await page
      .locator(
        ".result-list__listing >> .result-list-entry:not(.paywall-listing)"
      )
      .filter({ has: page.locator("button.is24-icon-heart-favorite") })
      .elementHandles();

    var results = [];
    for (let i = 0; i < list.length; i++) {
      const el = list[i];
      const content = await el.textContent();

      if (content?.includes("Frau Amber Kraus")) continue;

      const id = await el.getAttribute("data-obid");
      results.push(id);
    }

    const newIds = results.filter((id) => !database.ids.includes(id));

    if (newIds.length > 0) {
      console.log(`${newIds.length} NEW FLAT FOUND!`);
    } else {
      console.log("NO NEW FLAT.");
    }

    for (let i = 0; i < newIds.length; i++) {
      const id = newIds[i];
      database = { ids: uniq([id, ...database.ids]) };
      await writeFile(DATABASE_PATH, JSON.stringify(database));

      await page.goto(`https://www.immobilienscout24.de/expose/${id}`);
      await page.click('[data-qa="sendButton"]');

      await page.locator("#contactForm-Message").fill(message);
      await page.click('[data-qa="sendButtonBasic"]');

      await page.waitForTimeout(2000);
    }

    const end = new Date();
    const diff = end.getTime() - start.getTime();

    if (diff >= RELOAD_INTERVAL_MS) {
      await page.goto(url);
    } else {
      await page.waitForTimeout(RELOAD_INTERVAL_MS - diff);
      await page.goto(url);
    }

    console.log("RELOADING...\n\n");
  }
}
