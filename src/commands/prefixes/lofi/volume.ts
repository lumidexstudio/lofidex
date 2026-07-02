import {
  AudioPlayerStatus,
  getVoiceConnection,
  type AudioPlayer,
} from "@discordjs/voice";
import {
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  ComponentType,
  inlineCode,
  type ButtonInteraction,
} from "discord.js";
import {
  errorEmbed,
  infoEmbed,
  successEmbed,
} from "../../../lib/embed";
import stopAllCollectors from "../../../lib/stopAllCollectors";
import type { MessageWithReply } from "../../../types";

export = {
  name: "volume",
  description:
    "Controls the volume of the music being played.",
  aliases: ["vol"],
  cooldown: 1,
  category: "lofi",
  args: ["<volume?>"],
  async execute(
    message: MessageWithReply,
    args: string[]
  ): Promise<unknown> {
    const isplaying = await message.client.db.has(
      `vc.${message.guild!.id}.now`
    );
    if (!isplaying)
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "The bot is not playing music right now."
          ),
        ],
      });

    const getdb = (await message.client.db.get(
      `vc.${message.guild!.id}`
    )) as {
      master: string;
      channel: string;
    };
    if (
      getdb.master !== message.member!.user.id
    )
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "Only the DJ can control using this command."
          ),
        ],
      });
    if (
      getdb.channel !==
      (message.member as { voice: { channelId: string } }).voice
        .channelId
    )
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "We are not in the same voice channel!"
          ),
        ],
      });

    const connection = getVoiceConnection(
      message.guild!.id
    );
    if (!connection)
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed(
            "The bot is not playing music right now."
          ),
        ],
      });

    const player = (connection.state as { subscription: { player: AudioPlayer } }).subscription.player;
    const volumeState = player.state as { resource: { volume: { volume: number; setVolume: (vol: number) => void } } };

    if (!args[0]) {
      const btns: Record<
        string,
        ButtonBuilder
      > = {
        "20": new ButtonBuilder()
          .setCustomId("20")
          .setLabel("20%")
          .setStyle(ButtonStyle.Secondary),
        "40": new ButtonBuilder()
          .setCustomId("40")
          .setLabel("40%")
          .setStyle(ButtonStyle.Secondary),
        "60": new ButtonBuilder()
          .setCustomId("60")
          .setLabel("60%")
          .setStyle(ButtonStyle.Secondary),
        "80": new ButtonBuilder()
          .setCustomId("80")
          .setLabel("80%")
          .setStyle(ButtonStyle.Secondary),
        "100": new ButtonBuilder()
          .setCustomId("100")
          .setLabel("100%")
          .setStyle(ButtonStyle.Primary),
      };

      const volumeRow =
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          btns["20"],
          btns["40"],
          btns["60"],
          btns["80"],
          btns["100"]
        );

      await stopAllCollectors(message);
      const msg = await (message.channel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({
        embeds: [
          infoEmbed(
            `Current volume: ${inlineCode(`${(volumeState.resource.volume.volume * 100).toFixed(0)}%`)}`
          ),
        ],
        components: [volumeRow],
      });
      const collector =
        message.channel.createMessageComponentCollector(
          {
            componentType: ComponentType.Button,
            time: 120000,
          }
        );
      message.client.volume.set(
        message.guild!.id,
        collector
      );
      collector.on(
        "collect",
        async (d: ButtonInteraction) => {
          const set = async (
            x: ButtonInteraction
          ) => {
            volumeState.resource.volume.setVolume(
              Number(x.customId) / 100
            );
            Object.keys(btns).forEach(
              (key) => {
                btns[key].setStyle(
                  ButtonStyle.Secondary
                );
              }
            );

            btns[x.customId].setStyle(
              ButtonStyle.Primary
            );
            await (msg as unknown as { edit: (opts: unknown) => Promise<unknown> }).edit({
              embeds: [
                infoEmbed(
                  `Current volume: ${inlineCode(`${(volumeState.resource.volume.volume * 100).toFixed(0)}%`)}`
                ),
              ],
              components: [volumeRow],
            });
          };

          await d.deferUpdate();
          await set(d);
        }
      );

      return;
    } else {
      let vol = Number(args[0]);
      if (vol > 100) vol = 100;
      volumeState.resource.volume.setVolume(
        vol / 100
      );
      return message.replyWithoutMention!({
        embeds: [
          successEmbed(
            `Successfully set the volume to ${inlineCode(vol + "%")}`
          ),
        ],
      });
    }
  },
};
