import fs from "node:fs";
import { getVoiceConnection } from "@discordjs/voice";
import type { Client } from "discord.js";
import { destroyGuildMixer } from "../audio/playbackEngine";

async function leaveVoice(
  client: Client,
  guildId: string
): Promise<void> {
  destroyGuildMixer(client, guildId);

  const connection = getVoiceConnection(guildId);
  if (connection) {
    connection.destroy();
  }

  const timer = client.leaveTimers?.get(guildId);
  if (timer) {
    clearTimeout(timer);
    client.leaveTimers.delete(guildId);
  }

  client.nowplaying.delete(guildId);

  try {
    fs.rmSync(`temp/${guildId}`, { recursive: true, force: true });
  } catch {
    // temp dir may not exist — nothing to clean up
  }

  await client.db.delete(`vc.${guildId}`);
}

export = leaveVoice;
