import {
  EmbedBuilder,
  SlashCommandBuilder,
  type CommandInteraction,
} from "discord.js";

export = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("pong!"),
  async execute(
    interaction: CommandInteraction
  ): Promise<void> {
    const ping =
      Date.now() - interaction.createdTimestamp;
    const embed = new EmbedBuilder()
      .setAuthor({ name: "pong!" })
      .setDescription(
        `\u23F3 **Response Time:** ${ping}ms\n\u23F1 **Websocket:** ${Math.round(interaction.client.ws.ping)}ms`
      )
      .setColor(
        ping <= 100
          ? "Green"
          : ping <= 500
            ? "Yellow"
            : "Red"
      );

    await interaction.reply({ embeds: [embed] });
  },
};
