"use strict";
const discord_js_1 = require("discord.js");
const embed_1 = require("../../../lib/embed");
const topgg_1 = require("../../../lib/topgg");
module.exports = {
    name: "247",
    description: "Keep the bot in the voice channel even when it's empty. Enabling requires a top.gg vote.",
    aliases: ["24/7", "stay"],
    cooldown: 5,
    category: "lofi",
    async execute(message) {
        const guildId = message.guild.id;
        const guildData = (await message.client.db.get(`vc.${guildId}`));
        if (!guildData)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("The bot is not playing music right now."),
                ],
            });
        if (guildData.master !== message.member.user.id)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("Only the DJ can control using this command."),
                ],
            });
        if (guildData.channel !==
            message.member.voice
                .channelId)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("We are not in the same voice channel!"),
                ],
            });
        const next = !guildData.stay247;
        if (next) {
            const isOwner = message.client.config.ownerID.includes(message.member.user.id);
            const allowed = isOwner || (await (0, topgg_1.hasVoted)(message.member.user.id));
            if (!allowed) {
                const voteLink = (0, discord_js_1.hyperlink)((0, discord_js_1.bold)("Vote on Top.gg"), message.client.config.topgg.voteUrl);
                return message.replyWithoutMention({
                    embeds: [
                        (0, embed_1.errorEmbed)(`24/7 mode is available for voters. Please ${voteLink} first, then run this command again. Votes refresh every 12 hours.`),
                    ],
                });
            }
        }
        await message.client.db.set(`vc.${guildId}.stay247`, next);
        return message.replyWithoutMention({
            embeds: [
                (0, embed_1.successEmbed)(next
                    ? "24/7 mode **enabled** — I'll stay in the voice channel even when it's empty."
                    : "24/7 mode **disabled** — I'll leave once the channel is empty."),
            ],
        });
    },
};
//# sourceMappingURL=247.js.map