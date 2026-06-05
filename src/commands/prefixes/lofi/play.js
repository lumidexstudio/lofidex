const { VoiceConnectionStatus, getVoiceConnection } = require("@discordjs/voice");
const { errorEmbed, infoEmbed } = require("../../../lib/embed");
const { startPlaybackSession } = require("../../../lib/voice/playbackSession");
const leaveVoice = require("../../../lib/voice/leaveVoice");
const ambientLibrary = require("../../../ambient-sound");

function findAmbient(name) {
  // Exact match first
  const exact = ambientLibrary.find((item) => item.name === name);
  if (exact) return exact;

  // Partial match — user may omit category prefix (e.g. "heavy-rain" instead of "rain-heavy-rain")
  return ambientLibrary.find((item) => {
    // Strip the category prefix if the name has one (e.g. "rain-heavy-rain" → "heavy-rain")
    if (item.category !== "root" && item.name.startsWith(item.category + "-")) {
      const withoutPrefix = item.name.slice(item.category.length + 1);
      if (withoutPrefix === name) return true;
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
    if (!voiceChannelId) return message.replyWithoutMention({ embeds: [errorEmbed("You must be on the voice channel first!")] });

    const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
    if (!voiceChannel) return message.replyWithoutMention({ embeds: [errorEmbed(`Voice channel not found`)] });

    const existingConnection = getVoiceConnection(message.guild.id);
    if (existingConnection) {
      if (existingConnection.state.status !== VoiceConnectionStatus.Destroyed) {
        return message.replyWithoutMention({ embeds: [infoEmbed("Lofidex is already on the voice channel and is probably playing lofi.")] });
      }

      existingConnection.destroy();
    }

    // Check if the argument is an ambient name
    const ambientArg = args[0] ? findAmbient(args[0]) : null;
    const isAmbientOnly = !!ambientArg;

    await message.client.db.set(`vc.${message.guild.id}`, {
      channel: voiceChannel.id,
      master: message.member.user.id,
      ambients: isAmbientOnly ? [ambientArg.name] : [],
      ambientOnly: isAmbientOnly,
      stay247: false,
      repeat: {
        state: false,
        song: null,
      },
    });

    try {
      await startPlaybackSession(message.client, {
        guild: message.guild,
        voiceChannel,
        textChannel: message.channel,
        announce: true,
      });
    } catch (error) {
      await leaveVoice(message.client, message.guild.id);
      return message.replyWithoutMention({ embeds: [errorEmbed("Failed to join the voice channel.")] });
    }

    console.log("bot connected - ready to play");
  },
};
