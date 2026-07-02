"use strict";
const discord_js_1 = require("discord.js");
const embed_1 = require("../../../lib/embed");
module.exports = {
    name: "report",
    description: "Bug report",
    cooldown: 5,
    category: "general",
    args: ["<message>"],
    async execute(message, args) {
        if (!args.length) {
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("Message required!")],
            });
        }
        const reportEmbed = new discord_js_1.EmbedBuilder()
            .setColor("#ff0000")
            .setTitle("Bug Report")
            .setThumbnail(message.author.displayAvatarURL())
            .addFields({ name: "Reported By", value: `${message.author.username} (ID: ${message.author.id})`, inline: true }, { name: "Origin Server", value: `${message.guild.name} (ID: ${message.guild.id})`, inline: true }, { name: "Report", value: args.join(" "), inline: false })
            .setTimestamp();
        const reportChannel = message.client.guilds.cache
            .get(message.client.config.reportTo.guild)
            ?.channels.cache.get(message.client.config.reportTo.channel);
        if (reportChannel) {
            await reportChannel.send({ content: `<@${message.author.id}>`, embeds: [reportEmbed] });
            return message.replyWithoutMention({
                embeds: [(0, embed_1.successEmbed)("Thanks for reporting! Our developers will check it as soon as possible!")],
            });
        }
        else {
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("Failed to send...")],
            });
        }
    },
};
//# sourceMappingURL=report.js.map