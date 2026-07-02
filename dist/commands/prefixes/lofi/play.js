"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const voice_1 = require("@discordjs/voice");
const embed_1 = require("../../../lib/embed");
const playbackSession_1 = require("../../../lib/voice/playbackSession");
const leaveVoice_1 = __importDefault(require("../../../lib/voice/leaveVoice"));
const ambient_sound_1 = __importDefault(require("../../../ambient-sound"));
function findAmbient(name) {
    const exact = ambient_sound_1.default.find((item) => item.name === name);
    if (exact)
        return exact;
    return ambient_sound_1.default.find((item) => {
        if (item.category !== "root" && item.name.startsWith(item.category + "-")) {
            const withoutPrefix = item.name.slice(item.category.length + 1);
            if (withoutPrefix === name)
                return true;
        }
        return false;
    });
}
module.exports = {
    name: "play",
    description: "start playing a song.",
    aliases: ["p"],
    cooldown: 3,
    category: "lofi",
    args: ["<ambient?>"],
    async execute(message, args) {
        const voiceChannelId = message.member.voice.channelId;
        if (!voiceChannelId)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("You must be on the voice channel first!")],
            });
        const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
        if (!voiceChannel)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)(`Voice channel not found`)],
            });
        const existingConnection = (0, voice_1.getVoiceConnection)(message.guild.id);
        if (existingConnection) {
            if (existingConnection.state.status !== voice_1.VoiceConnectionStatus.Destroyed) {
                return message.replyWithoutMention({
                    embeds: [(0, embed_1.infoEmbed)("Lofidex is already on the voice channel and is probably playing lofi.")],
                });
            }
            existingConnection.destroy();
        }
        const ambientArg = args[0] ? findAmbient(args[0]) : null;
        const isAmbientOnly = !!ambientArg;
        await message.client.db.set(`vc.${message.guild.id}`, {
            channel: voiceChannel.id,
            master: message.member.user.id,
            ambients: isAmbientOnly ? [ambientArg.name] : [],
            ambientOnly: isAmbientOnly,
            stay247: false,
            repeat: { state: false, song: null },
        });
        try {
            await (0, playbackSession_1.startPlaybackSession)(message.client, {
                guild: message.guild,
                voiceChannel: voiceChannel,
                textChannel: message.channel,
                announce: true,
            });
        }
        catch {
            await (0, leaveVoice_1.default)(message.client, message.guild.id);
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("Failed to join the voice channel.")],
            });
        }
        console.log("bot connected - ready to play");
    },
};
//# sourceMappingURL=play.js.map