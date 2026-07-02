import { Events, type Interaction } from "discord.js";

export = {
  name: Events.InteractionCreate,
  async execute(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.slash.get(interaction.commandName);

    if (!command) {
      console.error(
        `No command matching ${interaction.commandName} was found.`
      );
      return;
    }

    try {
      await (
        command as {
          execute: (
            interaction: Interaction,
            client: typeof interaction.client
          ) => Promise<void>;
        }
      ).execute(interaction, interaction.client);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}`);
      console.error(error);
    }
  },
};
