const { AudioPlayerStatus } = require('@discordjs/voice');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: "resume",
    description: "resume the current paused song!",
    cooldown: 1,
    category: "lofi",
    async execute(message) {
        let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
        if(!isplaying) return message.reply("does'nt play any song rn");

        let getdb = await message.client.db.get(`vc.${message.guild.id}`);
        if(getdb.master !== message.member.user.id) return message.reply(`you are not the user that using the play command previously`)
        if(getdb.channel !== message.member.voice.channelId) return message.reply(`we are not in the same vc`);
        
        let player = getVoiceConnection(message.guild.id).state.subscription.player;
        player.unpause();
        message.reply("unpaused");
    }
}