"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const embed_1 = require("../../../lib/embed");
const stop_1 = __importDefault(require("../../../lib/music/stop"));
module.exports = {
    name: "stop",
    description: "Stops the music being played.",
    cooldown: 6,
    category: "lofi",
    async execute(message) {
        const getdb = (await message.client.db.get(`vc.${message.guild.id}`));
        if (!getdb)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("The bot is not playing music right now."),
                ],
            });
        if (getdb.master !== message.member.user.id)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("Only the DJ can control using this command."),
                ],
            });
        if (getdb.channel !==
            message.member.voice
                .channelId)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("We are not in the same voice channel!"),
                ],
            });
        const connection = (0, voice_1.getVoiceConnection)(message.guild.id);
        if (!connection)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("The bot is not playing music right now."),
                ],
            });
        await (0, stop_1.default)(connection, message);
        return message.replyWithoutMention({
            embeds: [
                (0, embed_1.successEmbed)(`Disconnected\n\nThank you for using this bot. We are aware that many issues still exist. Come join our ${(0, discord_js_1.hyperlink)((0, discord_js_1.bold)("Support Server"), message.client.config.supportServer)} to get information, updates and more.`),
            ],
        });
    },
};
//# sourceMappingURL=stop.js.map