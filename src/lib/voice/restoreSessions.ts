import type { Client } from "discord.js";
import { startPlaybackSession } from "./playbackSession";

async function restoreSessions(client: Client): Promise<void> {
  const all = await client.db.get<Record<string, { stay247: boolean; channel: string }>>("vc");
  if (!all || typeof all !== "object") return;

  for (const [guildId, session] of Object.entries(all)) {
    if (!session?.stay247) {
      await client.db.delete(`vc.${guildId}`);
      continue;
    }

    try {
      const guild = await client.guilds.fetch(guildId);
      const voiceChannel = await guild.channels.fetch(session.channel);
      if (!voiceChannel || !("adapterCreator" in voiceChannel)) {
        await client.db.delete(`vc.${guildId}`);
        continue;
      }

      await startPlaybackSession(client, {
        guild,
        voiceChannel: voiceChannel as import("discord.js").VoiceBasedChannel,
        textChannel: null,
        announce: false,
        resume: true,
      });

      console.log(`restored 24/7 session in guild ${guildId}`);
    } catch (error: unknown) {
      console.error(
        `failed to restore session ${guildId}: ${(error as Error).message}`
      );
      await client.db.delete(`vc.${guildId}`);
    }
  }
}

export = restoreSessions;
