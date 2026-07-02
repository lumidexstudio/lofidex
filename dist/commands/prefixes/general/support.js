"use strict";
const discord_js_1 = require("discord.js");
module.exports = {
    name: "support",
    description: "Need a help?",
    cooldown: 1,
    category: "general",
    aliases: ["server", "supportserver"],
    async execute(message) {
        const embed = new discord_js_1.EmbedBuilder()
            .setThumbnail(`https://cdn.discordapp.com/avatars/${message.client.config.clientID}/${message.client.user.avatar}.png`)
            .setDescription(`Need help about the bot? or something else?\n\n${(0, discord_js_1.hyperlink)("[Support Server]", "https://discord.gg/b2hw59zVTx")}\n${(0, discord_js_1.hyperlink)("[Our Website]", "https://lumidex.id")}\n${(0, discord_js_1.hyperlink)("[Vote Me at Top.gg]", "https://top.gg/bot/1221004354408939640?s=024e9ca934714")}`)
            .setColor("Fuchsia");
        await message.replyWithoutMention({ embeds: [embed] });
    },
};
//# sourceMappingURL=support.js.map