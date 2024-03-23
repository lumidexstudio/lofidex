const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "ping",
    description: "Pong!",
    cooldown: 1,
    category: "general",
    async execute(message) {
        let ping = Date.now() - message.createdTimestamp;
        const embed = new EmbedBuilder()
            .setAuthor({ name: "pong!" })
            .setDescription(`⏳ **Response Time:** ${ping}ms\n⏱ **Websocket:** ${Math.round(message.client.ws.ping)}ms`)
            .setColor(ping <= 100 ? 'Green' : ping <= 500 ? 'Yellow' : 'Red');

        message.replyWithoutMention({ embeds: [embed] });
    }
}