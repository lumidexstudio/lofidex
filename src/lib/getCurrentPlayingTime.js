const { AudioPlayerStatus } = require("@discordjs/voice");

const getCurrentlyPlayingTime = (connection) => {
    const audioPlayer = connection.state.subscription.player;
    if (audioPlayer.state.status === AudioPlayerStatus.Playing) {
      const currentTime = audioPlayer.state.playbackDuration;
      // Konversi waktu dari milidetik ke detik
      const currentTimeInSeconds = Math.floor(currentTime / 1000);
      return currentTimeInSeconds;
    } else {
      return null;
    }
};

module.exports = getCurrentlyPlayingTime;