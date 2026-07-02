"use strict";
const voice_1 = require("@discordjs/voice");
const embed_1 = require("../../../lib/embed");
module.exports = {
    name: "resume",
    description: "Resume the song that was paused.",
    cooldown: 3,
    category: "lofi",
    async execute(message) {
        const guildData = (await message.client.db.get(`vc.${message.guild.id}`));
        if (!guildData)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("The bot is not playing music right now."),
                ],
            });
        if (guildData.master !== message.member.user.id)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("Only the DJ can control using this command."),
                ],
            });
        if (guildData.channel !==
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
        player.unpause();
        return message.replyWithoutMention({
            embeds: [(0, embed_1.successEmbed)("Resumed!")],
        });
    },
};
//# sourceMappingURL=resume.js.map