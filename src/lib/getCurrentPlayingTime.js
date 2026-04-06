const { AudioPlayerStatus } = require("@discordjs/voice");
const { getPlaybackOffsetSeconds } = require("./audio/playbackEngine");

const getCurrentlyPlayingTime = (connection, client, guildId) => {
  const audioPlayer = connection.state.subscription.player;

  if (audioPlayer.state.status !== AudioPlayerStatus.Playing && audioPlayer.state.status !== AudioPlayerStatus.Paused) {
    return null;
  }

  return getPlaybackOffsetSeconds(client, guildId, audioPlayer);
};

module.exports = getCurrentlyPlayingTime;
