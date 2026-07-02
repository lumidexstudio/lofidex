"use strict";
const discord_js_1 = require("discord.js");
module.exports = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName("ping")
        .setDescription("pong!"),
    async execute(interaction) {
        const ping = Date.now() - interaction.createdTimestamp;
        const embed = new discord_js_1.EmbedBuilder()
            .setAuthor({ name: "pong!" })
            .setDescription(`\u23F3 **Response Time:** ${ping}ms\n\u23F1 **Websocket:** ${Math.round(interaction.client.ws.ping)}ms`)
            .setColor(ping <= 100
            ? "Green"
            : ping <= 500
                ? "Yellow"
                : "Red");
        await interaction.reply({ embeds: [embed] });
    },
};
//# sourceMappingURL=ping.js.map