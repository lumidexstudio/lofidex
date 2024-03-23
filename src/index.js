const fs = require("node:fs");
const path = require("node:path");
const walk = require('./lib/walk');

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const { QuickDB } = require("quick.db");
const express = require("express");
const app = express();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.config = require("../config");
client.slash = new Collection();
client.prefixes = new Collection();
client.cooldowns = new Collection();
client.db = new QuickDB();

const slashPath = path.join(__dirname, "commands/slash");
walk(slashPath, (x) => {
  let cmd = require(x);
  client.slash.set(cmd.data.name, cmd);
});

const prefixesPath = path.join(__dirname, "commands/prefixes");
walk(prefixesPath, (x) => {
  let cmd = require(x);
  client.prefixes.set(cmd.name, cmd);
});

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

app.get("/", async (req, res) => {
  res.status(200).json({ message: "Hello World" });
});

app.listen(client.config.port, () => console.log("Server listen on port", client.config.port));
client.login(client.config.token);