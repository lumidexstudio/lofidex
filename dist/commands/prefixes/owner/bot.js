"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const getUsage_1 = __importDefault(require("../../../lib/getUsage"));
module.exports = {
    name: "bot",
    description: "Lihat informasi dan statistik bot.",
    cooldown: 10,
    category: "owner",
    aliases: ["uptime", "infobot"],
    async execute(message) {
        const usage = (0, getUsage_1.default)();
        const embed = new discord_js_1.EmbedBuilder()
            .setAuthor({
            name: message.client.user.username +
                "#" +
                message.client.user.discriminator,
        })
            .setThumbnail(`https://cdn.discordapp.com/avatars/${message.client.user.id}/${message.client.user.avatar}.png`)
            .setDescription(`**Uptime:** ${require("ms")(Number(message.client.uptime), { long: true })}
**Total server:** ${message.client.guilds.cache.size}
**Total pengguna:** ${Array.from(message.client.guilds.cache.values())
            .map((x) => x.memberCount ?? 0)
            .reduce((a, b) => a + b, 0)}

**Penggunaan RAM:** ${usage.memory}GB
**Penggunaan CPU:** ${usage.cpu}%`)
            .setColor(discord_js_1.Colors.Fuchsia);
        await message.replyWithoutMention({
            embeds: [embed],
        });
    },
};
//# sourceMappingURL=bot.js.map