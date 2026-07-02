import { getVoiceConnection } from "@discordjs/voice";
import ambientList from "../../../ambient-sound";
import {
  ActionRowBuilder,
  ButtonStyle,
  ButtonBuilder,
  inlineCode,
  type Message,
  type ButtonInteraction,
} from "discord.js";
import {
  errorEmbed,
  infoEmbed,
} from "../../../lib/embed";
import addAmbientFn from "../../../lib/music/addAmbient";
import removeAmbientFn from "../../../lib/music/removeAmbient";
import createButtonCollector from "../../../lib/createButtonCollector";
import type { MessageWithReply } from "../../../types";

function formatAmbientList(
  items: { name: string }[]
): string {
  return items.map((item) => `\`${item.name}\``).join(", ");
}

export = {
  name: "add",
  description: "Adds ambient to the currently playing song.",
  aliases: ["addambient", "ambient"],
  cooldown: 1,
  category: "lofi",
  args: ["<ambient?>"],
  async execute(
    message: MessageWithReply,
    args: string[]
  ): Promise<unknown> {
    const guildData = (await message.client.db.get(
      `vc.${message.guild!.id}`
    )) as Record<string, unknown> | null;
    if (!guildData)
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed("The bot is not playing music right now."),
        ],
      });

    const getdb = (await message.client.db.get(
      `vc.${message.guild!.id}`
    )) as {
      master: string;
      channel: string;
      ambients: string[];
    };
    if (getdb.master !== message.member!.user.id)
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
          errorEmbed("We are not in the same voice channel!"),
        ],
      });

    const connection = getVoiceConnection(message.guild!.id);
    if (!connection)
      return message.replyWithoutMention!({
        embeds: [
          errorEmbed("The bot is not playing music right now."),
        ],
      });

    if (args[0]) {
      await addAmbientFn(message, connection, args[0]);
    } else {
      if (ambientList.length > 25) {
        return (message.channel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({
          embeds: [
            infoEmbed(
              `Ambient library is too large for button mode.\n\nCurrent ambients: ${inlineCode(
                getdb.ambients.length
                  ? getdb.ambients.join("`, `")
                  : "none"
              )}\n\nUse \`${message.client.config.prefix}add <ambient-name>\` with one of these names:\n${formatAmbientList(ambientList)}`
            ),
          ],
        });
      }

      const btns: Record<string, ButtonBuilder> = {};
      const ambientsNow = await message.client.db.get<string[]>(
        `vc.${message.guild!.id}.ambients`
      );

      const rows: ActionRowBuilder<ButtonBuilder>[] = [];
      let row = new ActionRowBuilder<ButtonBuilder>();

      for (let i = 0; i < ambientList.length; i++) {
        const ambient = ambientList[i];
        btns[ambient.name] = new ButtonBuilder()
          .setCustomId("add_" + ambient.name)
          .setLabel(ambient.name)
          .setEmoji(ambient.emoji);

        if (ambientsNow?.includes(ambient.name)) {
          btns[ambient.name].setStyle(ButtonStyle.Primary);
        } else {
          btns[ambient.name].setStyle(ButtonStyle.Secondary);
        }

        row.addComponents(btns[ambient.name]);

        if ((i + 1) % 5 === 0 || i === ambientList.length - 1) {
          rows.push(row);
          row = new ActionRowBuilder<ButtonBuilder>();
        }
      }

      await createButtonCollector(message, {
        key: "addAmbient",
        masterId: getdb.master,
        embeds: [
          infoEmbed(
            `Add some ambients? use the buttons below...\n\nCurrent ambients: ${inlineCode(
              ambientsNow?.length ? ambientsNow.join("`, `") : "none"
            )}`
          ),
        ],
        components: rows,
        async onCollect(d: ButtonInteraction, msg: Message) {
          const ambientsOld = await message.client.db.get<string[]>(
            `vc.${message.guild!.id}.ambients`
          );

          if (ambientsOld?.includes(d.customId.split("_")[1])) {
            await removeAmbientFn(message, connection, d.customId.split("_")[1]);
          } else {
            await addAmbientFn(message, connection, d.customId.split("_")[1]);
          }

          const ambientsNowDb = await message.client.db.get<string[]>(
            `vc.${message.guild!.id}.ambients`
          );
          Object.keys(btns).forEach((key) => {
            if (ambientsNowDb?.includes(key)) {
              btns[key].setStyle(ButtonStyle.Primary);
            } else {
              btns[key].setStyle(ButtonStyle.Secondary);
            }
          });

          await msg.edit({
            embeds: [
              infoEmbed(
                `Add some ambients? use the buttons below...\n\nCurrent ambients: ${inlineCode(
                  ambientsNowDb?.length ? ambientsNowDb.join("`, `") : "none"
                )}`
              ),
            ],
            components: rows,
          });
        },
      });
    }
  },
};
