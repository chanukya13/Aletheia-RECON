/* global require, process */
/* eslint-disable @typescript-eslint/no-require-imports -- Node --require preloader blocks networking before any replay module loads. */
// Fail closed in a fresh replay process; neither provider access nor local sockets are needed.
let attempts = 0;
const deny = () => {
  attempts++;
  throw new Error("OFFLINE_REPLAY_NETWORK_FORBIDDEN");
};
globalThis.fetch = deny;
for (const name of ["node:http", "node:https"]) {
  const mod = require(name);
  mod.request = deny;
  mod.get = deny;
}
const net = require("node:net");
net.connect = deny;
net.createConnection = deny;
process.on("exit", () => {
  if (attempts) process.exitCode = 1;
});
