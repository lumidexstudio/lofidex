const { AudioPlayerStatus } = require('@discordjs/voice');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: "pause",
    description: "pause or unpause the current playing song!",
    cooldown: 1,
    category: "lofi",
    async execute(message) {
        if(!message.client.voice.adapters.has(message.guild.id)) return message.reply(`bot not in vc`);

        let getdb = await message.client.db.get(`vc.${message.guild.id}`);
        if(getdb.master !== message.member.user.id) return message.reply(`you are not the user that using the play command previously`)
        if(getdb.channel !== message.member.voice.channelId) return message.reply(`we are not in the same vc`);
        
        let player = getVoiceConnection(message.guild.id).state.subscription.player;
        if(player.state.status === AudioPlayerStatus.Paused) {
            player.unpause();
            message.reply("unpaused")
        } else {
            player.pause();
            message.reply("paused.")
        }
    }
}