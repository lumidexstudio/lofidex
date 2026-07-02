import { REST, Routes, Events, type Client } from "discord.js";
import config from "../config";
import restoreSessions from "../lib/voice/restoreSessions";

const rest = new REST({ version: "10" }).setToken(config.token);

export = {
  name: Events.ClientReady,
  once: true,
  async execute(client: Client): Promise<void> {
    const slash: { data: unknown[] } = { data: [] };
    client.slash.forEach((value: unknown) => {
      slash.data.push((value as { data: unknown }).data);
    });

    console.log(`Ready! Logged in as ${client.user!.tag}`);
    try {
      console.log(`Started refreshing ${slash.data.length} application (/) commands.`);
      const data = (await rest.put(Routes.applicationCommands(client.config.clientID), { body: slash.data })) as unknown[];
      console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
      console.error(error);
    }

    try {
      await restoreSessions(client);
    } catch (error) {
      console.error("Failed to restore 24/7 sessions:", error);
    }
  },
};
