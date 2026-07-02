import fs from "node:fs";
import {
  joinVoiceChannel,
  VoiceConnectionStatus,
  entersState,
  createAudioPlayer,
  AudioPlayerStatus,
  type VoiceConnection,
  type AudioPlayer,
} from "@discordjs/voice";
import {
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  italic,
  type Client,
  type Guild,
  type VoiceBasedChannel,
  type TextBasedChannel,
} from "discord.js";
import humanizeTime from "../humanizeTime";
import { playSong, playAmbientOnly, destroyGuildMixer } from "../audio/playbackEngine";
import { getAudioDuration } from "../audio/nativeMixer";
import loop from "../music/loop";
import leaveVoice from "./leaveVoice";
import list from "../../lofi";

function ensureGuildTemp(guildId: string): void {
  if (!fs.existsSync(`temp/${guildId}`)) {
    fs.mkdirSync(`temp/${guildId}`);
  }
}

async function genMusic(client: Client, guildId: string, player: AudioPlayer): Promise<void> {
  const ambients = await client.db.get<string[]>(`vc.${guildId}.ambients`);
  const idx = Math.floor(Math.random() * list.length);
  const song = list[idx];

  playSong(client, guildId, player, song, {
    ambientNames: ambients ?? [],
    songIndex: idx,
    startOffsetSeconds: 0,
    shouldSendEmbed: true,
  });

  await client.db.set(`vc.${guildId}.now`, idx);
}

async function resumeSong(client: Client, guildId: string, player: AudioPlayer): Promise<void> {
  const ambients = await client.db.get<string[]>(`vc.${guildId}.ambients`);
  const now = await client.db.get<number>(`vc.${guildId}.now`);
  const idx = Number.isInteger(now) ? (now as number) : 0;
  const song = list[idx] ?? list[0];

  playSong(client, guildId, player, song, {
    ambientNames: ambients ?? [],
    songIndex: idx,
    startOffsetSeconds: 0,
    shouldSendEmbed: false,
  });

  await client.db.set(`vc.${guildId}.now`, idx);
}

interface PlaybackSessionOptions {
  guild: Guild;
  voiceChannel: VoiceBasedChannel;
  textChannel?: TextBasedChannel | null;
  announce?: boolean;
  resume?: boolean;
}

async function startPlaybackSession(
  client: Client,
  { guild, voiceChannel, textChannel = null, announce = true, resume = false }: PlaybackSessionOptions
): Promise<{ connection: VoiceConnection; player: AudioPlayer }> {
  const guildId = guild.id;
  ensureGuildTemp(guildId);

  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId,
    adapterCreator: guild.voiceAdapterCreator,
  });

  connection.on(VoiceConnectionStatus.Disconnected, async () => {
    try {
      await Promise.race([
        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
      ]);
    } catch {
      await leaveVoice(client, guildId);
      console.log(`bot disconnected from guild ${guildId}`);
    }
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
  } catch (error) {
    await leaveVoice(client, guildId);
    throw error;
  }

  const player = createAudioPlayer();
  connection.subscribe(player);

  const session = await client.db.get<{ ambientOnly?: boolean; ambients?: string[] }>(`vc.${guildId}`);
  if (session?.ambientOnly) {
    playAmbientOnly(client, guildId, player, session.ambients ?? [], { shouldSendEmbed: announce });
  } else if (resume) {
    await resumeSong(client, guildId, player);
  } else {
    await genMusic(client, guildId, player);
  }

  let embed = new EmbedBuilder().setColor("Fuchsia").setAuthor({ name: "Loading" }).setDescription(italic("Preparing..."));

  player.on(AudioPlayerStatus.Buffering, async () => {
    const meta = (player.state as { resource: { metadata: Record<string, unknown> } }).resource.metadata;
    if (!textChannel || !meta.shouldSendEmbed) return;

    embed.setAuthor({ name: "Buffering" }).setDescription("Please wait until song are played").setThumbnail(null);
    await (textChannel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({ embeds: [embed] });
  });

  player.on(AudioPlayerStatus.Playing, async () => {
    const meta = (player.state as { resource: { metadata: Record<string, unknown> } }).resource.metadata;
    if (!textChannel || !meta.shouldSendEmbed) return;

    if (meta.ambientOnly) {
      const ambientNames = (meta.ambientNames as string[]).map((n: string) => `\`${n}\``).join(", ");
      embed = embed.setAuthor({ name: "Playing Ambient" }).setDescription(`Ambients: ${ambientNames}`).setThumbnail(null).setTimestamp();

      await (textChannel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({ embeds: [embed] });
    } else {
      const songDuration = getAudioDuration(meta.path as string);
      const sourceButton = new ButtonBuilder().setLabel("Source").setURL(meta.source as string).setStyle(ButtonStyle.Link);
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(sourceButton);

      embed = embed
        .setAuthor({ name: `Playing ${meta.title as string}` })
        .setDescription(`By: ${meta.author as string}\nDuration: ${humanizeTime(Math.ceil(songDuration))}`)
        .setThumbnail(meta.cover as string | null)
        .setTimestamp();

      await (textChannel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({ embeds: [embed], components: [row] });
    }
  });

  player.on("error", (error: Error) => {
    console.error(error);
  });

  let skipNextIdle = false;

  (player as AudioPlayer & { skipNextIdle?: () => void }).skipNextIdle = () => {
    skipNextIdle = true;
  };

  player.on(AudioPlayerStatus.Idle, async () => {
    if (skipNextIdle) {
      skipNextIdle = false;
      return;
    }

    destroyGuildMixer(client, guildId);

    const guildData = await client.db.get<{
      ambientOnly?: boolean;
      ambients?: string[];
      repeat?: { state: boolean; song: Record<string, unknown> };
    }>(`vc.${guildId}`);
    if (!guildData) return;

    if (guildData.ambientOnly) {
      playAmbientOnly(client, guildId, player, guildData.ambients ?? [], { shouldSendEmbed: false });
      return;
    }

    if (guildData.repeat?.state) {
      await loop(client, guildId, player, textChannel ?? null);
    } else {
      await genMusic(client, guildId, player);
    }
  });

  return { connection, player };
}

export { startPlaybackSession };
