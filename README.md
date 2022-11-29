# immobilienscout24_hack

## Instructions

1) Go to `./src/_config.ts` and follow the instructions.
2) Start the program by doing `npm start`, don't forget to `npm i` just before.

## Options

You can modify the headless boolean in `./src/flat_finder.ts` at line `15` to
change the headless property.

```js
const browser = await webkit.launch({
  headless: true,
});
```
