const { REST, Routes, Events } = require('discord.js');
const config = require('../../config');
const restoreSessions = require('../lib/voice/restoreSessions');
const rest = new REST({ version: 10 }).setToken(config.token);

module.exports = {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
        let slash = { data: [] };
        client.slash.forEach(function (value) {
          this.data.push(value.data);
        }, slash);

		console.log(`Ready! Logged in as ${client.user.tag}`);
        try {
            console.log(`Started refreshing ${slash.data.length} application (/) commands.`);
            const data = await rest.put(
                Routes.applicationCommands(client.config.clientID),
                { body: slash.data },
            );

            console.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error(error);
        }

        try {
            await restoreSessions(client);
        } catch (error) {
            console.error('Failed to restore 24/7 sessions:', error);
        }
	},
};