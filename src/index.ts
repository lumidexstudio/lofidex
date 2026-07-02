import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import walk from "./lib/walk";
import toBoolean from "./lib/toBoolean";
import config from "./config";
import { ensureBinary } from "./lib/audio/nativeMixer";
import SimpleJsonDb from "./lib/SimpleJsonDb";

import {
  Client,
  GatewayIntentBits,
  Collection,
} from "discord.js";

import express from "express";

dotenv.config();

const app = express();

if (toBoolean(process.env.USE_STATIC_FFMPEG)) {
  console.log("Using ffmpeg static!");
  const ffmpegPath = (require("ffmpeg-ffprobe-static") as { ffmpegPath: string }).ffmpegPath;
  const ffmpeg = require("fluent-ffmpeg") as typeof import("fluent-ffmpeg") & { setFfmpegPath: (path: string) => void };
  (ffmpeg as unknown as { setFfmpegPath: (p: string) => void }).setFfmpegPath(ffmpegPath);
}

if (!fs.existsSync("temp")) {
  fs.mkdirSync("temp");
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.config = config;
client.slash = new Collection();
client.prefixes = new Collection();
client.cooldowns = new Collection();
client.db = new SimpleJsonDb(
  path.join(process.cwd(), "temp/quickdb.json")
);

client.nowplaying = new Collection();
client.addAmbient = new Collection();
client.removeAmbient = new Collection();
client.volume = new Collection();
client.mixerSessions = new Map();
client.leaveTimers = new Map();

const slashPath = path.join(__dirname, "commands/slash");
walk(slashPath, (x: string) => {
  if (x.endsWith(".map") || x.endsWith(".ts")) return;
  const cmd = require(x) as { data: { name: string } };
  client.slash.set(cmd.data.name, cmd);
});

const prefixesPath = path.join(
  __dirname,
  "commands/prefixes"
);
walk(prefixesPath, (x: string) => {
  if (x.endsWith(".map") || x.endsWith(".ts")) return;
  const cmd = require(x) as { name: string };
  client.prefixes.set(cmd.name, cmd);
});

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath) as {
    name: string;
    once?: boolean;
    execute: (...args: unknown[]) => unknown;
  };
  if (event.once) {
    client.once(event.name, (...args: unknown[]) =>
      event.execute(...args)
    );
  } else {
    client.on(event.name, (...args: unknown[]) =>
      event.execute(...args)
    );
  }
}

app.get("/", async (_req, res) => {
  res.status(200).json({ message: "Hello World" });
});

function startHttpServer(): void {
  if (toBoolean(process.env.DISABLE_HTTP_SERVER)) {
    console.log("HTTP server disabled by configuration.");
    return;
  }

  const host = process.env.HOST ?? "127.0.0.1";
  const server = app.listen(
    client.config.port,
    host,
    () => {
      console.log(
        `Server listen on ${host}:${client.config.port}`
      );
    }
  );

  server.on(
    "error",
    (error: NodeJS.ErrnoException) => {
      console.error(
        `HTTP server disabled: ${error.code ?? error.message}`
      );
    }
  );
}

async function bootstrap(): Promise<void> {
  try {
    console.log("Preparing native audio mixer...");
    ensureBinary();
    console.log("Native audio mixer ready.");

    startHttpServer();
    await client.login(client.config.token);
    client.user!.setActivity(config.activity);
  } catch (error: unknown) {
    console.error(
      "Startup failed:",
      (error as Error).message
    );
    process.exit(1);
  }
}

bootstrap();
