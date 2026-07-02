"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const hastebin_1 = __importDefault(require("./hastebin"));
const embed_1 = require("./embed");
module.exports = {
    name: discord_js_1.Events.Error,
    async execute(error, message) {
        message.replyWithoutMention?.({
            embeds: [
                (0, embed_1.dieEmbed)("Oops.. There is something wrong, We're sorry for the inconvenience. This problem will be reported automatically to our support server!"),
            ],
        });
        const guild = message.client.guilds.cache.get(message.client.config.errorTo.guild);
        if (guild) {
            const channel = guild.channels.cache.get(message.client.config.errorTo.channel);
            if (channel && "send" in channel) {
                const embed = new discord_js_1.EmbedBuilder()
                    .setTitle(error.message.length > 256 ? error.message.slice(0, 253) + "..." : error.message)
                    .setThumbnail(message.author.displayAvatarURL())
                    .setDescription(error.stack && error.stack.length > 4096
                    ? await (0, hastebin_1.default)(error.stack)
                    : (0, discord_js_1.codeBlock)(`Stack Trace:\n${error.stack ?? error.message}`))
                    .setColor("Red")
                    .addFields([
                    { name: "Encountered By", value: `${message.author.username}` },
                    { name: "Origin Server", value: `${message.guild?.name} (ID ${message.guild?.id})` },
                ])
                    .setTimestamp();
                await channel.send({ embeds: [embed] });
            }
            else {
                console.error(`Channel "${message.client.config.errorTo.channel}" is not a valid text channel`);
            }
        }
        else {
            console.error(`Guild "${message.client.config.errorTo.guild}" not found`);
        }
    },
};
//# sourceMappingURL=Error.js.map