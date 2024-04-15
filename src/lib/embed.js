const { EmbedBuilder } = require("discord.js");
const { emoji } = require('../../config')

exports.errorEmbed = (message) => {
    const embed = new EmbedBuilder()
            .setDescription(`${emoji.noEntry} ` + message)
            .setColor("Red");

    return embed;
}

exports.successEmbed = (message) => {
    const embed = new EmbedBuilder()
            .setDescription(`${emoji.check} ` + message)
            .setColor("Green");

    return embed;
}

exports.dieEmbed = (message) => {
    const embed = new EmbedBuilder()
            .setDescription(`${emoji.skull} ` + message)
            .setColor('Red');

    return embed;
}

exports.noteEmbed = (message) => {
    let embed = new EmbedBuilder()
            .setDescription(`${emoji.info} ` + message)
            .setColor('Fuchsia');

    return embed;
}

exports.loadingEmbed = (message) => {
    let embed = new EmbedBuilder()
            .setDescription(`${emoji.hourglass} ` + message)
            .setColor(`Fuchsia`);

    return embed;
}

exports.infoEmbed = (message) => {
    let embed = new EmbedBuilder()
            .setDescription(`${emoji.sparkles} ` + message)
            .setColor(`Fuchsia`);

    return embed;
}