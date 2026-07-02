import {
  EmbedBuilder,
  bold,
  hyperlink,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  type ButtonInteraction,
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
import stopAllCollectors from "../../../lib/stopAllCollectors";
import type { MessageWithReply } from "../../../types";

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
      const ambientNames = (guildData.ambients ?? []).map((n) => `\`${n}\``).join(", ");
      const embed = new EmbedBuilder()
        .setColor("Fuchsia")
        .setTitle("Ambient Mode")
        .setDescription(`Currently playing ambients:\n${ambientNames}`)
        .setTimestamp();

      const btns = {
        stop: new ButtonBuilder().setCustomId("stop").setLabel("Stop").setEmoji("\u23F9").setStyle(ButtonStyle.Danger),
      };

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btns.stop);
      const msg = await (message.channel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({
        embeds: [embed],
        components: [row],
      });

      await stopAllCollectors(message);
      const collector = message.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 120000,
      });
      message.client.nowplaying.set(message.guild!.id, collector);
      collector.on("collect", async (d: ButtonInteraction) => {
        await d.deferUpdate();
        if (d.user.id !== guildData.master) {
          await d.followUp({ content: `${d.user.username}, only host can use this button.`, ephemeral: true });
          return;
        }
        if (d.customId === "stop") {
          collector.stop("disconnect");
        }
      });

      collector.on("end", async (_d, r: string) => {
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

    const embed = new EmbedBuilder()
      .setColor("Fuchsia")
      .setTitle(detail.title + " by " + detail.author)
      .setURL(detail.source)
      .setThumbnail(detail.cover)
      .setDescription(`${formatTime(nowin)} ${createProgressBar(nowin, dur)} ${formatTime(dur)}`)
      .setTimestamp()
      .setFooter({ text: `Song ID: ${detail.id}` });

    const btns = {
      pause: new ButtonBuilder().setCustomId("pause").setLabel("Pause").setEmoji("\u23F8").setStyle(ButtonStyle.Secondary),
      stop: new ButtonBuilder().setCustomId("stop").setLabel("Stop").setEmoji("\u23F9").setStyle(ButtonStyle.Danger),
      skip: new ButtonBuilder().setCustomId("skip").setLabel("Skip").setEmoji("\u23ED").setStyle(ButtonStyle.Primary),
    };

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(btns.pause, btns.skip, btns.stop);
    const msg = await (message.channel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({
      embeds: [embed],
      components: [row],
    });

    await stopAllCollectors(message);
    const collector = message.channel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 120000,
    });
    message.client.nowplaying.set(message.guild!.id, collector);
    collector.on("collect", async (d: ButtonInteraction) => {
      const set = async (x: ButtonInteraction) => {
        const player = (connection.state as { subscription: { player: AudioPlayer } }).subscription.player;

        if (x.customId === "pause") {
          const meta = player.state as { resource: { metadata: { shouldSendEmbed: boolean } } };
          meta.resource.metadata.shouldSendEmbed = false;
          if (player.state.status === AudioPlayerStatus.Paused) {
            player.unpause();
            btns.pause.setStyle(ButtonStyle.Secondary).setLabel("Pause").setEmoji("\u23F8");
          } else {
            player.pause();
            btns.pause.setStyle(ButtonStyle.Primary).setLabel("Resume").setEmoji("\u25B6");
          }
        } else if (x.customId === "stop") {
          const coll = message.client.nowplaying.get(message.guild!.id) as { stop: (reason: string) => void } | undefined;
          if (coll) coll.stop("disconnect");
        } else if (x.customId === "skip") {
          await skipMusic(message, (connection.state as { subscription: { player: AudioPlayer } }).subscription.player, false);
          const now = await message.client.db.get<number>(`vc.${message.guild!.id}.now`);
          detail = songlist[now ?? 0];

          const durNew = getAudioDuration(detail.path);
          const nowinNew = getCurrentlyPlayingTime(connection, message.client, message.guild!.id) ?? 0;

          embed
            .setTitle(detail.title + " by " + detail.author)
            .setURL(detail.source)
            .setThumbnail(detail.cover)
            .setDescription(`${formatTime(nowinNew)} ${createProgressBar(nowinNew, durNew)} ${formatTime(durNew)}`)
            .setTimestamp()
            .setFooter({ text: `Song ID: ${detail.id}` });
        }

        await (msg as unknown as { edit: (opts: unknown) => Promise<unknown> }).edit({
          embeds: [embed],
          components: [row],
        });
      };

      await d.deferUpdate();
      if (d.user.id !== guildData.master) {
        await d.followUp({ content: `${d.user.username}, only host can use this button.`, ephemeral: true });
        return;
      }
      await set(d);
    });

    collector.on("end", async (_d, r: string) => {
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
    });
  },
};
