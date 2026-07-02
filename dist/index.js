"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const walk_1 = __importDefault(require("./lib/walk"));
const toBoolean_1 = __importDefault(require("./lib/toBoolean"));
const config_1 = __importDefault(require("./config"));
const nativeMixer_1 = require("./lib/audio/nativeMixer");
const SimpleJsonDb_1 = __importDefault(require("./lib/SimpleJsonDb"));
const discord_js_1 = require("discord.js");
const express_1 = __importDefault(require("express"));
dotenv_1.default.config();
const app = (0, express_1.default)();
if ((0, toBoolean_1.default)(process.env.USE_STATIC_FFMPEG)) {
    console.log("Using ffmpeg static!");
    const ffmpegPath = require("ffmpeg-ffprobe-static").ffmpegPath;
    const ffmpeg = require("fluent-ffmpeg");
    ffmpeg.setFfmpegPath(ffmpegPath);
}
if (!node_fs_1.default.existsSync("temp")) {
    node_fs_1.default.mkdirSync("temp");
}
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildVoiceStates,
    ],
});
client.config = config_1.default;
client.slash = new discord_js_1.Collection();
client.prefixes = new discord_js_1.Collection();
client.cooldowns = new discord_js_1.Collection();
client.db = new SimpleJsonDb_1.default(node_path_1.default.join(process.cwd(), "temp/quickdb.json"));
client.nowplaying = new discord_js_1.Collection();
client.addAmbient = new discord_js_1.Collection();
client.removeAmbient = new discord_js_1.Collection();
client.volume = new discord_js_1.Collection();
client.mixerSessions = new Map();
client.leaveTimers = new Map();
const slashPath = node_path_1.default.join(__dirname, "commands/slash");
(0, walk_1.default)(slashPath, (x) => {
    if (x.endsWith(".map") || x.endsWith(".ts"))
        return;
    const cmd = require(x);
    client.slash.set(cmd.data.name, cmd);
});
const prefixesPath = node_path_1.default.join(__dirname, "commands/prefixes");
(0, walk_1.default)(prefixesPath, (x) => {
    if (x.endsWith(".map") || x.endsWith(".ts"))
        return;
    const cmd = require(x);
    client.prefixes.set(cmd.name, cmd);
});
const eventsPath = node_path_1.default.join(__dirname, "events");
const eventFiles = node_fs_1.default
    .readdirSync(eventsPath)
    .filter((file) => file.endsWith(".js") || file.endsWith(".ts"));
for (const file of eventFiles) {
    const filePath = node_path_1.default.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}
app.get("/", async (_req, res) => {
    res.status(200).json({ message: "Hello World" });
});
function startHttpServer() {
    if ((0, toBoolean_1.default)(process.env.DISABLE_HTTP_SERVER)) {
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
        (0, nativeMixer_1.ensureBinary)();
        console.log("Native audio mixer ready.");
        startHttpServer();
        await client.login(client.config.token);
        client.user.setActivity(config_1.default.activity);
    }
    catch (error) {
        console.error("Startup failed:", error.message);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map