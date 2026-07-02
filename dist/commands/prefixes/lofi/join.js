"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const voice_1 = require("@discordjs/voice");
const embed_1 = require("../../../lib/embed");
const leaveVoice_1 = __importDefault(require("../../../lib/voice/leaveVoice"));
module.exports = {
    name: "join",
    description: "Make the bot join your voice channel without playing anything.",
    aliases: ["j"],
    cooldown: 3,
    category: "lofi",
    async execute(message) {
        const voiceChannelId = message.member.voice.channelId;
        if (!voiceChannelId)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("You must be on a voice channel first!")],
            });
        const existingData = await message.client.db.get(`vc.${message.guild.id}`);
        if (existingData)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("The bot is already connected to a voice channel. Use `stop` first.")],
            });
        const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
        if (!voiceChannel)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("Voice channel not found")],
            });
        await message.client.db.set(`vc.${message.guild.id}`, {
            channel: voiceChannel.id,
            master: message.member.user.id,
            ambients: [],
            ambientOnly: false,
            stay247: false,
        });
        const connection = (0, voice_1.joinVoiceChannel)({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        connection.on(voice_1.VoiceConnectionStatus.Disconnected, async () => {
            try {
                await Promise.race([
                    (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Signalling, 5_000),
                    (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Connecting, 5_000),
                ]);
            }
            catch {
                await (0, leaveVoice_1.default)(message.client, message.guild.id);
            }
        });
        try {
            await (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 30_000);
        }
        catch {
            await (0, leaveVoice_1.default)(message.client, message.guild.id);
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("Failed to join the voice channel.")],
            });
        }
        const player = (0, voice_1.createAudioPlayer)();
        connection.subscribe(player);
        player.on("error", console.error);
        return message.replyWithoutMention({
            embeds: [(0, embed_1.successEmbed)(`Joined **${voiceChannel.name}**! Use \`add <ambient>\` to play sounds or \`play\` to start lofi music.`)],
        });
    },
};
//# sourceMappingURL=join.js.map