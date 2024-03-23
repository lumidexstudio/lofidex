const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');

module.exports = {
    name: "play",
    description: "start playing!",
    cooldown: 1,
    category: "lofi",
    async execute(message) {
        const voiceChannelId = message.member.voice.channelId;
        if (!voiceChannelId) return message.reply('You are not in the voice channel rn');

        const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
        if (!voiceChannel) return message.reply('Voice channel not found!');

        if(message.client.voice.adapters.has(message.guild.id)) return message.reply(`I already joined`);

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            message.client.db.set(`vc.${message.guild.id}.id`, voiceChannel.id)
            console.log("bot connected - ready to play");
        });

        connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
                
                console.log("bot pindah vc?")
            } catch (error) {
                connection.destroy();
                console.log("bot disconnected")
            }
        });
    }
}