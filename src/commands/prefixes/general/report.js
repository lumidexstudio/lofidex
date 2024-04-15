const { EmbedBuilder } = require("discord.js");
const { errorEmbed, successEmbed } = require("../../../lib/embed");

module.exports = {
    name: "report",
    description: "Bug report",
    cooldown: 5,
    category: "general",
    args: ["<message>"],
    async execute(message, args) {
        if (!args.length) {
            return message.replyWithoutMention({ embeds: [errorEmbed('Message required!')] });
        }

        const reportEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Bug Report')
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Reported By', value: `${message.author.username} (ID: ${message.author.id})`, inline: true },
                { name: 'Origin Server', value: `${message.guild.name} (ID: ${message.guild.id})`, inline: true },
                { name: 'Report', value: args.join(' '), inline: false }
            )
            .setTimestamp();

        const reportChannel = message.client.guilds.cache.get(message.client.config.reportTo.guild).channels.cache.get(message.client.config.reportTo.channel);
        if (reportChannel) {
            reportChannel.send({ content: `<@${message.author.id}>`, embeds: [reportEmbed] });
            message.replyWithoutMention({ embeds: [successEmbed('Thanks for reporting! Our developers will check it as soon as possible!') ]});
        } else {
            message.replyWithoutMention({ embeds: [errorEmbed('Failed to send...') ]});
        }
    }
};