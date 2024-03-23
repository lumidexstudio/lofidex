const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: "stop",
    description: "stop playing!",
    cooldown: 1,
    category: "lofi",
    async execute(message) {
        if(!message.client.voice.adapters.has(message.guild.id)) return message.reply(`bot not in vc`);

        let storedid = await message.client.db.get(`vc.${message.guild.id}`);
        if(storedid !== message.member.voice.channelId) return message.reply(`we are not in the same vc`);
        
        await getVoiceConnection(message.guild.id).disconnect();
        await message.client.db.delete(`vc.${message.guild.id}`);
        message.reply('disconnected');
    }
}