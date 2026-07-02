import { EmbedBuilder } from "discord.js";
import ambientLibrary from "../../../ambient-sound";
import type { MessageWithReply } from "../../../types";

const CATEGORY_LABELS: Record<string, string> = {
  animals: "\uD83D\uDC3E Animals",
  binaural: "\uD83E\uDDE0 Binaural",
  nature: "\uD83C\uDF3F Nature",
  noise: "\uD83D\uDCFB Noise",
  places: "\uD83C\uDFD9\uFE0F Places",
  rain: "\uD83C\uDF27\uFE0F Rain",
  things: "\uD83C\uDF9B\uFE0F Things",
  transport: "\uD83D\uDE86 Transport",
  urban: "\uD83D\uDEA6 Urban",
};

export = {
  name: "ambients",
  description: "List all available ambient sounds by category.",
  aliases: ["ambientlist", "al"],
  cooldown: 3,
  category: "lofi",
  async execute(message: MessageWithReply): Promise<void> {
    const grouped: Record<string, typeof ambientLibrary> = {};

    for (const item of ambientLibrary) {
      const cat = item.category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    }

    const embed = new EmbedBuilder()
      .setColor("Fuchsia")
      .setTitle("Ambient Library")
      .setTimestamp();

    const sortedCategories = Object.keys(grouped).sort((a, b) => {
      if (a === "root") return 1;
      if (b === "root") return -1;
      return a.localeCompare(b);
    });

    for (const cat of sortedCategories) {
      const label =
        CATEGORY_LABELS[cat] ??
        `\uD83C\uDFB5 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
      const names = grouped[cat]
        .map((item) => `\`${item.name}\``)
        .join(", ");
      embed.addFields({ name: label, value: names });
    }

    embed.setFooter({
      text: `${ambientLibrary.length} ambients available \u2022 Use ${message.client.config.prefix}play <name> for ambient-only or ${message.client.config.prefix}add <name> to layer on a song`,
    });

    await (message.channel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({
      embeds: [embed],
    });
  },
};
