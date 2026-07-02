import {
  type Message,
  type ButtonInteraction,
  ComponentType,
  type EmbedBuilder,
  type ActionRowBuilder,
  type ButtonBuilder,
} from "discord.js";
import stopAllCollectors from "./stopAllCollectors";

interface ButtonCollectorOptions {
  key: string;
  masterId: string | null;
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
  onCollect: (interaction: ButtonInteraction, msg: Message) => Promise<void>;
  onEnd?: (reason: string, msg: Message) => Promise<void>;
  timeout?: number;
}

async function createButtonCollector(
  message: Message,
  options: ButtonCollectorOptions
): Promise<Message> {
  const { key, masterId, embeds, components, onCollect, onEnd, timeout = 120000 } = options;

  await stopAllCollectors(message);

  const msg = await (message.channel as unknown as { send: (opts: unknown) => Promise<Message> }).send({ embeds, components });

  const collector = message.channel.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: timeout,
  });

  (message.client as unknown as Record<string, { set: (k: string, v: unknown) => void }>)[key].set(message.guild!.id, collector);

  collector.on("collect", async (d: ButtonInteraction) => {
    await d.deferUpdate();
    if (masterId && d.user.id !== masterId) {
      await d.followUp({ content: `${d.user.username}, only host can use this button.`, ephemeral: true });
      return;
    }
    await onCollect(d, msg);
  });

  if (onEnd) {
    collector.on("end", async (_d, r) => {
      await onEnd(r, msg);
    });
  }

  return msg;
}

export = createButtonCollector;
