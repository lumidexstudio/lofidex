require('dotenv').config();
const fs = require("node:fs");
const path = require("node:path");
const walk = require("./lib/walk");
const toBoolean = require('./lib/toBoolean');
const config = require("../config");
const { ensureBinary } = require("./lib/audio/nativeMixer");
const SimpleJsonDb = require("./lib/SimpleJsonDb");

const { Client, GatewayIntentBits, Collection } = require("discord.js");

const express = require("express");
const app = express();

let ffmpeg = require('fluent-ffmpeg');
if(toBoolean(process.env.USE_STATIC_FFMPEG)) {
  console.log("Using ffmpeg static!")
  ffmpeg.setFfmpegPath(require('ffmpeg-ffprobe-static').ffmpegPath);
}

if (!fs.existsSync("temp")) {
  fs.mkdirSync("temp");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
});

client.config = config;
client.slash = new Collection();
client.prefixes = new Collection();
client.cooldowns = new Collection();
client.db = new SimpleJsonDb(path.join(process.cwd(), "temp/quickdb.json"));
client.ffmpeg = ffmpeg;

// collector purposes
client.nowplaying = new Collection();
client.addAmbient = new Collection();
client.removeAmbient = new Collection();
client.volume = new Collection();
client.mixerSessions = new Map();

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

function startHttpServer() {
  if (toBoolean(process.env.DISABLE_HTTP_SERVER)) {
    console.log("HTTP server disabled by configuration.");
    return;
  }

  const host = process.env.HOST ?? "127.0.0.1";
  const server = app.listen(client.config.port, host, () => {
    console.log(`Server listen on ${host}:${client.config.port}`);
  });

  server.on("error", (error) => {
    console.error(`HTTP server disabled: ${error.code ?? error.message}`);
  });
}

async function bootstrap() {
  try {
    console.log("Preparing native audio mixer...");
    ensureBinary();
    console.log("Native audio mixer ready.");

    startHttpServer();
    await client.login(client.config.token);
    client.user.setActivity(config.activity);
  } catch (error) {
    console.error("Startup failed:", error.message);
    process.exit(1);
  }
}

bootstrap();
