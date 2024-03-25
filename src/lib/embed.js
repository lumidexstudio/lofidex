const { EmbedBuilder } = require("discord.js");

exports.errorEmbed = (message) => {
    const embed = new EmbedBuilder()
            .setDescription("<:noentry:1058255404431310878> " + message)
            .setColor("Red");

    return embed;
}

exports.successEmbed = (message) => {
    const embed = new EmbedBuilder()
            .setDescription("<:check:1058239965689040956> " + message)
            .setColor("Green");

    return embed;
}

exports.dieEmbed = (message) => {
    const embed = new EmbedBuilder()
            .setDescription("<:skull1:1058236954673692722> " + message)
            .setColor('Red');

    return embed;
}

exports.noteEmbed = (message) => {
    let embed = new EmbedBuilder()
            .setDescription(`<:lamp:1058246307749314620> ` + message)
            .setColor('Purple');

    return embed;
}

exports.loadingEmbed = (message) => {
    let embed = new EmbedBuilder()
            .setDescription(`<:hourglassicon:1058763743565193227> ` + message)
            .setColor(`Purple`);

    return embed;
}

exports.infoEmbed = (message) => {
    let embed = new EmbedBuilder()
            .setDescription(`<:spark:1058788075154710670>  ` + message)
            .setColor(`Purple`);

    return embed;
}