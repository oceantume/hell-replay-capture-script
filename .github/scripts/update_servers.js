const fs = require("fs");

const [, , serversPath, steamServersPath] = process.argv;

// remove servers we haven't seen for a week
const threshold = 60 * 60 * 24 * 7;

function loadServers() {
  if (!fs.existsSync(serversPath)) return [];
  return JSON.parse(fs.readFileSync(serversPath, { encoding: "utf8" }));
}

function writeServers(obj) {
  const output = JSON.stringify(obj, null, 2);
  fs.writeFileSync(serversPath, output, { encoding: "utf8" });
}

function serverToKey(server) {
  return server.addr + ":" + server.port;
}

const existingServers = loadServers();

console.log("loaded " + existingServers.length + " existing servers");

const data = JSON.parse(
  fs.readFileSync(steamServersPath, { encoding: "utf8" })
);

const now = Math.floor(Date.now() / 1000);
const servers = data.response.servers.map((x) => ({
  addr: x.addr.split(":")[0],
  port: Number(x.gameport),
}));

console.log("found " + servers.length + " servers with the API");

const steamSet = new Set(servers.map(serverToKey));
const newlyRemovedServers = existingServers
  .filter((x) => !steamSet.has(serverToKey(x)) && x.removed == null)
  .map((x) => ({ ...x, removed: now }));
const unexpiredServers = existingServers.filter(
  (x) =>
    !steamSet.has(serverToKey(x)) &&
    x.removed != null &&
    now - x.removed < threshold
);

servers.push(...newlyRemovedServers, ...unexpiredServers);

// sort by key, which is "ip:port"
servers.sort((a, b) => serverToKey(a).localeCompare(serverToKey(b)));

console.log("writing " + servers.length + " recently active servers");

writeServers(servers);
