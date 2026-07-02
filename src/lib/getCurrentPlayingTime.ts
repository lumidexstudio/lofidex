import { AudioPlayerStatus, type AudioPlayer, type VoiceConnection } from "@discordjs/voice";
import type { Client } from "discord.js";
import { getPlaybackOffsetSeconds } from "./audio/playbackEngine";

const getCurrentlyPlayingTime = (
  connection: VoiceConnection,
  client: Client,
  guildId: string
): number | null => {
  const audioPlayer = (connection.state as { subscription: { player: AudioPlayer } }).subscription.player;

  if (
    audioPlayer.state.status !== AudioPlayerStatus.Playing &&
    audioPlayer.state.status !== AudioPlayerStatus.Paused
  ) {
    return null;
  }

  return getPlaybackOffsetSeconds(client, guildId, audioPlayer);
};

export = getCurrentlyPlayingTime;
