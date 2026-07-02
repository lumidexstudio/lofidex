"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const lofi_1 = __importDefault(require("../../../lofi"));
module.exports = {
    name: "list",
    description: "list of all song",
    category: "lofi",
    aliases: ["songlist"],
    cooldown: 1,
    async execute(message) {
        const embed = new discord_js_1.EmbedBuilder()
            .setTitle(`List of Song available in ${message.client.user.username}`)
            .setThumbnail(message.client.user.avatarURL())
            .addFields(lofi_1.default.map((item) => {
            return {
                name: item.title,
                value: item.author,
            };
        }))
            .setTimestamp()
            .setColor("Fuchsia");
        await message.channel.send({
            embeds: [embed],
        });
    },
};
//# sourceMappingURL=list.js.map