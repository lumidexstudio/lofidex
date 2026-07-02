"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const voice_1 = require("@discordjs/voice");
const skip_1 = __importDefault(require("../../../lib/music/skip"));
const embed_1 = require("../../../lib/embed");
module.exports = {
    name: "skip",
    description: "Skips the currently playing song and continues to the song after it.",
    aliases: ["next"],
    cooldown: 8,
    category: "lofi",
    async execute(message) {
        const isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
        if (!isplaying)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("The bot is not playing music right now."),
                ],
            });
        const getdb = (await message.client.db.get(`vc.${message.guild.id}`));
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
        const player = connection.state.subscription.player;
        player.pause();
        const meta = player.state.resource.metadata;
        await message.replyWithoutMention({
            embeds: [
                (0, embed_1.loadingEmbed)(`Trying to skip ${meta.title} - ${meta.author}`),
            ],
        });
        await (0, skip_1.default)(message, player);
    },
};
//# sourceMappingURL=skip.js.map