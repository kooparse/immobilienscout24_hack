import { spawn, ChildProcess } from "child_process";

var lastProcess: ChildProcess;

setInterval(() => {
  lastProcess.kill();
  lastProcess = spawn("node", ["./dist/flat_finder.js"], { stdio: "inherit" });
}, 1000 * 60 * 15);

console.log("STARTING...");

// But start with a process right away.
lastProcess = spawn("node", ["./dist/flat_finder.js"], { stdio: "inherit" });
