const { AudioPlayerStatus } = require('@discordjs/voice');
const { getVoiceConnection } = require('@discordjs/voice');
const { errorEmbed, successEmbed } = require('../../../lib/embed');

module.exports = {
    name: "resume",
    description: "resume the current paused song!",
    cooldown: 1,
    category: "lofi",
    async execute(message) {
        let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
        if(!isplaying) return message.replyWithoutMention({ embeds: [errorEmbed('The bot is not playing music right now.')] });

        let getdb = await message.client.db.get(`vc.${message.guild.id}`);
        if(getdb.master !== message.member.user.id) return message.replyWithoutMention({ embeds: [errorEmbed('Only the DJ can control using this command.')] })
        if(getdb.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });
        
        let player = getVoiceConnection(message.guild.id).state.subscription.player;
        player.unpause();
        message.replyWithoutMention({ embeds: [successEmbed('Resumed!')] });
    }
}