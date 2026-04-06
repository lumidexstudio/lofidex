const { EmbedBuilder } = require("discord.js");
const ambientLibrary = require("../../../ambient-sound");

const CATEGORY_LABELS = {
  animals: "🐾 Animals",
  binaural: "🧠 Binaural",
  nature: "🌿 Nature",
  noise: "📻 Noise",
  places: "🏙️ Places",
  rain: "🌧️ Rain",
  things: "🎛️ Things",
  transport: "🚆 Transport",
  urban: "🚦 Urban",
};

module.exports = {
  name: "ambients",
  description: "List all available ambient sounds by category.",
  aliases: ["ambientlist", "al"],
  cooldown: 3,
  category: "lofi",
  async execute(message) {
    const grouped = {};

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
      const label = CATEGORY_LABELS[cat] ?? `🎵 ${cat.charAt(0).toUpperCase() + cat.slice(1)}`;
      const names = grouped[cat].map((item) => `\`${item.name}\``).join(", ");
      embed.addFields({ name: label, value: names });
    }

    embed.setFooter({
      text: `${ambientLibrary.length} ambients available • Use ${message.client.config.prefix}play <name> for ambient-only or ${message.client.config.prefix}add <name> to layer on a song`,
    });

    message.channel.send({ embeds: [embed] });
  },
};
