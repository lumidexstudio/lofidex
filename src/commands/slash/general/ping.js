const { EmbedBuilder } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('pong!'),
	async execute(interaction) {
        let ping = Date.now() - interaction.createdTimestamp;
        const embed = new EmbedBuilder()
            .setAuthor({ name: "pong!" })
            .setDescription(`⏳ **Response Time:** ${ping}ms\n⏱ **Websocket:** ${Math.round(interaction.client.ws.ping)}ms`)
            .setColor(ping <= 100 ? 'Green' : ping <= 500 ? 'Yellow' : 'Red');

		return interaction.reply({ embeds: [embed] });
	},
};