"use strict";
const voice_1 = require("@discordjs/voice");
const embed_1 = require("../../../lib/embed");
module.exports = {
    name: "repeat",
    description: "Repeating current song",
    category: "lofi",
    async execute(message) {
        const guildData = (await message.client.db.get(`vc.${message.guild.id}`));
        if (!guildData)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("The bot is not playing music right now.")],
            });
        if (guildData.ambientOnly)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("Cannot repeat in ambient-only mode.")],
            });
        if (guildData.master !== message.member.user.id)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("Only the DJ can control using this command.")],
            });
        if (guildData.channel !== message.member.voice.channelId)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("We are not in the same voice channel!")],
            });
        const connection = (0, voice_1.getVoiceConnection)(message.guild.id);
        if (!connection)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("The bot is not playing music right now.")],
            });
        const player = connection.state.subscription.player;
        const resourceMeta = player.state.resource.metadata;
        const song = { ...resourceMeta };
        let repeat = await message.client.db.get(`vc.${message.guild.id}.repeat`);
        await message.client.db.set(`vc.${message.guild.id}.repeat.song`, song);
        await message.client.db.set(`vc.${message.guild.id}.repeat.state`, !repeat?.state);
        const repeatState = await message.client.db.get(`vc.${message.guild.id}.repeat`);
        if (repeatState?.state) {
            return message.replyWithoutMention({
                embeds: [(0, embed_1.successEmbed)("Repeating current song!")],
            });
        }
        else {
            return message.replyWithoutMention({
                embeds: [(0, embed_1.successEmbed)("Disabling Repeating current song!")],
            });
        }
    },
};
//# sourceMappingURL=repeat.js.map