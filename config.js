require("dotenv").config();
const { ActivityType } = require('discord.js');

module.exports = {
  port: 3000,
  token: process.env.TOKEN,
  clientID: process.env.CLIENT_ID,
  ownerID: process.env.OWNER_ID.split(", "),
  hasteServer: 'https://haste.lumidex.id',
  supportServer: 'https://discord.gg/b2hw59zVTx',
  prefix: ["lumi", "lumi ", "ldx", "ldx ", `<@${process.env.CLIENT_ID}>`],
  activity: { 
    name: 'ldxhelp', 
    type: ActivityType.Listening 
  },
  reportTo: {
    guild: process.env.REPORT_TO_GUILD_ID,
    channel: process.env.REPORT_TO_CHANNEL_ID,
  },
  errorTo: {
    guild: process.env.ERROR_TO_GUILD_ID,
    channel: process.env.ERROR_TO_CHANNEL_ID,
  }
};
