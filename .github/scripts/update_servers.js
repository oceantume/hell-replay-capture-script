const fs = require("fs");

const [,, serversPath, steamServersPath] = process.argv

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

// use utc midnight timestamp so that we don't commit changes to lastseen as frequently
const now = new Date();
const utcMidnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0);
const today = Math.floor(utcMidnight / 1000);

const servers = data.response.servers.map((x) => ({
  addr: x.addr.split(":")[0],
  port: Number(x.gameport),
  lastseen: today,
}));

console.log("found " + servers.length + " servers with the API");

const serverAddresses = new Set(servers.map(serverToKey));
const appendedServers = existingServers.filter(
  (x) =>
    !serverAddresses.has(serverToKey(x)) && today - x.lastseen < threshold
);

servers.push(...appendedServers);

// sort by key, which is "ip:port"
servers.sort((a, b) => serverToKey(a).localeCompare(serverToKey(b)));

console.log("writing " + servers.length + " active servers");

writeServers(servers);
