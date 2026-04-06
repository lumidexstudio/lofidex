const { AudioPlayerStatus } = require('@discordjs/voice');
const { getVoiceConnection } = require('@discordjs/voice');
const { errorEmbed, successEmbed } = require('../../../lib/embed');

module.exports = {
    name: "resume",
    description: "Resume the song that was paused.",
    cooldown: 3,
    category: "lofi",
    async execute(message) {
        let guildData = await message.client.db.get(`vc.${message.guild.id}`);
        if(!guildData) return message.replyWithoutMention({ embeds: [errorEmbed('The bot is not playing music right now.')] });

        if(guildData.master !== message.member.user.id) return message.replyWithoutMention({ embeds: [errorEmbed('Only the DJ can control using this command.')] })
        if(guildData.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });
        
        let connection = getVoiceConnection(message.guild.id);
        if(!connection) return message.replyWithoutMention({ embeds: [errorEmbed('The bot is not playing music right now.')] });
        
        connection.state.subscription.player.unpause();
        message.replyWithoutMention({ embeds: [successEmbed('Resumed!')] });
    }
}
