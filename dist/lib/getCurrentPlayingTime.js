"use strict";
const voice_1 = require("@discordjs/voice");
const playbackEngine_1 = require("./audio/playbackEngine");
const getCurrentlyPlayingTime = (connection, client, guildId) => {
    const audioPlayer = connection.state.subscription.player;
    if (audioPlayer.state.status !== voice_1.AudioPlayerStatus.Playing &&
        audioPlayer.state.status !== voice_1.AudioPlayerStatus.Paused) {
        return null;
    }
    return (0, playbackEngine_1.getPlaybackOffsetSeconds)(client, guildId, audioPlayer);
};
module.exports = getCurrentlyPlayingTime;
//# sourceMappingURL=getCurrentPlayingTime.js.map