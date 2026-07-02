"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
dotenv_1.default.config();
const envActivityType = process.env.ACTIVITY_TYPE.toLowerCase();
const capitalizedEnvActivityType = envActivityType.charAt(0).toUpperCase() + envActivityType.slice(1);
let botPrefix = (process.env.BOT_PREFIX ?? "").split(", ");
if (!botPrefix[0]) {
    botPrefix = [
        "lumi",
        "lumi ",
        "ldx",
        "ldx ",
        `<@${process.env.BOT_CLIENT_ID}>`,
    ];
}
const config = {
    port: Number(process.env.PORT) || 3000,
    token: process.env.BOT_TOKEN,
    clientID: process.env.BOT_CLIENT_ID,
    ownerID: process.env.BOT_OWNER_ID.split(", "),
    prefix: botPrefix,
    hasteServer: process.env.HASTE_SERVER || "https://haste.lumidex.id",
    supportServer: process.env.SUPPORT_SERVER || "https://discord.gg/b2hw59zVTx",
    activity: {
        name: process.env.ACTIVITY_NAME || "ldxhelp",
        type: discord_js_1.ActivityType[capitalizedEnvActivityType] ??
            discord_js_1.ActivityType.Listening,
    },
    topgg: {
        token: process.env.TOPGG_TOKEN ?? "",
        botId: process.env.BOT_CLIENT_ID,
        voteUrl: process.env.TOPGG_VOTE_URL ||
            "https://top.gg/bot/1221004354408939640/vote",
    },
    voice: {
        emptyLeaveMs: Number(process.env.EMPTY_CHANNEL_LEAVE_MS) || 30000,
    },
    reportTo: {
        guild: process.env.REPORT_TO_GUILD_ID,
        channel: process.env.REPORT_TO_CHANNEL_ID,
    },
    errorTo: {
        guild: process.env.ERROR_TO_GUILD_ID,
        channel: process.env.ERROR_TO_CHANNEL_ID,
    },
    emoji: {
        noEntry: process.env.EMOJI_NO_ENTRY || ":no_entry:",
        check: process.env.EMOJI_CHECK || ":white_check_mark:",
        skull: process.env.EMOJI_SKULL || ":skull:",
        info: process.env.EMOJI_INFO || ":information_source:",
        hourglass: process.env.EMOJI_HOURGLASS || ":hourglass:",
        sparkles: process.env.EMOJI_SPARKLES || ":sparkles:",
    },
};
module.exports = config;
//# sourceMappingURL=config.js.map