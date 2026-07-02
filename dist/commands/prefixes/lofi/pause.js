"use strict";
const voice_1 = require("@discordjs/voice");
const embed_1 = require("../../../lib/embed");
module.exports = {
    name: "pause",
    description: "Pauses the currently playing song.",
    cooldown: 3,
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
        return message.replyWithoutMention({
            embeds: [
                (0, embed_1.successEmbed)("Successfully paused the current playing song."),
            ],
        });
    },
};
//# sourceMappingURL=pause.js.map