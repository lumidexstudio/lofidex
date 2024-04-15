require("dotenv").config();
const { ActivityType } = require('discord.js');

const envActivityType = process.env.ACTIVITY_TYPE.toLowerCase();
const capitalizedEnvActivityType = envActivityType.charAt(0).toUpperCase() + envActivityType.slice(1);

let botPrefix = process.env.BOT_PREFIX;
if(botPrefix.length) {
  botPrefix = botPrefix.split(", ");
} else {
  botPrefix = ["lumi", "lumi ", "ldx", "ldx ", `<@${process.env.BOT_CLIENT_ID}>`];
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  token: process.env.BOT_TOKEN,
  clientID: process.env.BOT_CLIENT_ID,
  ownerID: process.env.BOT_OWNER_ID.split(", "),
  prefix: botPrefix,
  hasteServer: process.env.HASTE_SERVER || 'https://haste.lumidex.id',
  supportServer: process.env.SUPPORT_SERVER || 'https://discord.gg/b2hw59zVTx',
  activity: { 
    name: process.env.ACTIVITY_NAME || 'ldxhelp', 
    type: ActivityType[capitalizedEnvActivityType] ?? ActivityType.Listening 
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
    sparkles: process.env.EMOJI_SPARKLES || ":sparkles:"
  }
};
