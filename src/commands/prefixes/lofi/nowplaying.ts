import {
  EmbedBuilder,
  bold,
  hyperlink,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  type ButtonInteraction,
  type Message,
} from "discord.js";
import { getVoiceConnection, AudioPlayerStatus, type AudioPlayer, type VoiceConnection } from "@discordjs/voice";
import songlist from "../../../lofi";
import formatTime from "../../../lib/formatTime";
import getCurrentlyPlayingTime from "../../../lib/getCurrentPlayingTime";
import createProgressBar from "../../../lib/createProgressBar";
import { getAudioDuration } from "../../../lib/audio/nativeMixer";
import skipMusic from "../../../lib/music/skip";
import { errorEmbed, successEmbed } from "../../../lib/embed";
import stop from "../../../lib/music/stop";
import createButtonCollector from "../../../lib/createButtonCollector";
import type { MessageWithReply } from "../../../types";

async function handleCollectorEnd(r: string, connection: VoiceConnection, message: MessageWithReply) {
  if (r === "disconnect") {
    try {
      await stop(connection, message);
      await message.replyWithoutMention!({
        embeds: [
          successEmbed(
            `Disconnected\n\nThank you for using this bot. We are aware that many issues still exist. Come join our ${hyperlink(bold("Support Server"), message.client.config.supportServer)} to get information, updates and more.`
          ),
        ],
      });
    } catch {
      console.log("err stop button now playing");
    }
  }
}

function ambientNowPlayingEmbed(ambientNames: string[]): EmbedBuilder {
  return new EmbedBuilder()
    .setColor("Fuchsia")
    .setTitle("Ambient Mode")
    .setDescription(`Currently playing ambients:\n${ambientNames.map((n) => `\`${n}\``).join(", ")}`)
    .setTimestamp();
}

function songNowPlayingEmbed(detail: { title: string; author: string; source: string; cover: string; id: number }, nowin: number, dur: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor("Fuchsia")
    .setTitle(detail.title + " by " + detail.author)
    .setURL(detail.source)
    .setThumbnail(detail.cover)
    .setDescription(`${formatTime(nowin)} ${createProgressBar(nowin, dur)} ${formatTime(dur)}`)
    .setTimestamp()
    .setFooter({ text: `Song ID: ${detail.id}` });
}

function buildSongButtons() {
  return {
    pause: new ButtonBuilder().setCustomId("pause").setLabel("Pause").setEmoji("\u23F8").setStyle(ButtonStyle.Secondary),
    stop: new ButtonBuilder().setCustomId("stop").setLabel("Stop").setEmoji("\u23F9").setStyle(ButtonStyle.Danger),
    skip: new ButtonBuilder().setCustomId("skip").setLabel("Skip").setEmoji("\u23ED").setStyle(ButtonStyle.Primary),
  };
}

export = {
  name: "nowplaying",
  description: "Get details of the currently playing song.",
  aliases: ["np"],
  cooldown: 1,
  category: "lofi",
  async execute(message: MessageWithReply): Promise<unknown> {
    const guildData = (await message.client.db.get(`vc.${message.guild!.id}`)) as {
      channel?: string;
      master?: string;
      ambients?: string[];
      ambientOnly?: boolean;
      now?: number;
    } | null;
    if (!guildData)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("The bot is not playing music right now.")],
      });

    if (guildData.channel !== (message.member as { voice: { channelId: string } }).voice.channelId)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("We are not in the same voice channel!")],
      });

    const connection = getVoiceConnection(message.guild!.id);
    if (!connection)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("The bot is not playing music right now.")],
      });

    if (guildData.ambientOnly) {
      const ambientNames = guildData.ambients ?? [];
      const btns = {
        stop: new ButtonBuilder().setCustomId("stop").setLabel("Stop").setEmoji("\u23F9").setStyle(ButtonStyle.Danger),
      };
      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btns.stop);

      await createButtonCollector(message, {
        key: "nowplaying",
        masterId: guildData.master ?? null,
        embeds: [ambientNowPlayingEmbed(ambientNames)],
        components: [row],
        async onCollect(d: ButtonInteraction) {
          if (d.customId === "stop") {
            const coll = (message.client as unknown as { nowplaying: Map<string, { stop: (r: string) => void }> }).nowplaying.get(message.guild!.id);
            if (coll) coll.stop("disconnect");
          }
        },
        async onEnd(r: string) {
          await handleCollectorEnd(r, connection, message);
        },
      });
      return;
    }

    const isplaying = await message.client.db.has(`vc.${message.guild!.id}.now`);
    if (!isplaying)
      return message.replyWithoutMention!({
        embeds: [errorEmbed("The bot is not playing music right now.")],
      });

    let detail = songlist[guildData.now ?? 0];
    const dur = getAudioDuration(detail.path);
    const nowin = getCurrentlyPlayingTime(connection, message.client, message.guild!.id) ?? 0;
    const btns = buildSongButtons();
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btns.pause, btns.skip, btns.stop);

    const msg = await createButtonCollector(message, {
      key: "nowplaying",
      masterId: guildData.master ?? null,
      embeds: [songNowPlayingEmbed(detail, nowin, dur)],
      components: [row],
      async onCollect(d: ButtonInteraction) {
        const player = (connection.state as { subscription: { player: AudioPlayer } }).subscription.player;

        if (d.customId === "pause") {
          const meta = player.state as { resource: { metadata: { shouldSendEmbed: boolean } } };
          meta.resource.metadata.shouldSendEmbed = false;
          if (player.state.status === AudioPlayerStatus.Paused) {
            player.unpause();
            btns.pause.setStyle(ButtonStyle.Secondary).setLabel("Pause").setEmoji("\u23F8");
          } else {
            player.pause();
            btns.pause.setStyle(ButtonStyle.Primary).setLabel("Resume").setEmoji("\u25B6");
          }
        } else if (d.customId === "stop") {
          const coll = (message.client as unknown as { nowplaying: Map<string, { stop: (r: string) => void }> }).nowplaying.get(message.guild!.id);
          if (coll) coll.stop("disconnect");
          return;
        } else if (d.customId === "skip") {
          await skipMusic(message, player, false);
          const now = await message.client.db.get<number>(`vc.${message.guild!.id}.now`);
          detail = songlist[now ?? 0];

          const durNew = getAudioDuration(detail.path);
          const nowinNew = getCurrentlyPlayingTime(connection, message.client, message.guild!.id) ?? 0;
          const embed = songNowPlayingEmbed(detail, nowinNew, durNew);

          await msg.edit({ embeds: [embed], components: [row] });
          return;
        }

        await msg.edit({ embeds: [songNowPlayingEmbed(detail, getCurrentlyPlayingTime(connection, message.client, message.guild!.id) ?? 0, getAudioDuration(detail.path))], components: [row] });
      },
      async onEnd(r: string) {
        await handleCollectorEnd(r, connection, message);
      },
    });
  },
};
