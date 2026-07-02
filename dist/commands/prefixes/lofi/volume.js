"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const embed_1 = require("../../../lib/embed");
const createButtonCollector_1 = __importDefault(require("../../../lib/createButtonCollector"));
module.exports = {
    name: "volume",
    description: "Controls the volume of the music being played.",
    aliases: ["vol"],
    cooldown: 1,
    category: "lofi",
    args: ["<volume?>"],
    async execute(message, args) {
        const isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
        if (!isplaying)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("The bot is not playing music right now."),
                ],
            });
        const getdb = (await message.client.db.get(`vc.${message.guild.id}`));
        if (getdb.master !== message.member.user.id)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("Only the DJ can control using this command."),
                ],
            });
        if (getdb.channel !==
            message.member.voice
                .channelId)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("We are not in the same voice channel!"),
                ],
            });
        const connection = (0, voice_1.getVoiceConnection)(message.guild.id);
        if (!connection)
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.errorEmbed)("The bot is not playing music right now."),
                ],
            });
        const player = connection.state.subscription.player;
        const volumeState = player.state;
        if (!args[0]) {
            const btns = {
                "20": new discord_js_1.ButtonBuilder()
                    .setCustomId("20")
                    .setLabel("20%")
                    .setStyle(discord_js_1.ButtonStyle.Secondary),
                "40": new discord_js_1.ButtonBuilder()
                    .setCustomId("40")
                    .setLabel("40%")
                    .setStyle(discord_js_1.ButtonStyle.Secondary),
                "60": new discord_js_1.ButtonBuilder()
                    .setCustomId("60")
                    .setLabel("60%")
                    .setStyle(discord_js_1.ButtonStyle.Secondary),
                "80": new discord_js_1.ButtonBuilder()
                    .setCustomId("80")
                    .setLabel("80%")
                    .setStyle(discord_js_1.ButtonStyle.Secondary),
                "100": new discord_js_1.ButtonBuilder()
                    .setCustomId("100")
                    .setLabel("100%")
                    .setStyle(discord_js_1.ButtonStyle.Primary),
            };
            const volumeRow = new discord_js_1.ActionRowBuilder().addComponents(btns["20"], btns["40"], btns["60"], btns["80"], btns["100"]);
            await (0, createButtonCollector_1.default)(message, {
                key: "volume",
                masterId: null,
                embeds: [
                    (0, embed_1.infoEmbed)(`Current volume: ${(0, discord_js_1.inlineCode)(`${(volumeState.resource.volume.volume * 100).toFixed(0)}%`)}`),
                ],
                components: [volumeRow],
                async onCollect(d, msg) {
                    volumeState.resource.volume.setVolume(Number(d.customId) / 100);
                    Object.keys(btns).forEach((key) => {
                        btns[key].setStyle(discord_js_1.ButtonStyle.Secondary);
                    });
                    btns[d.customId].setStyle(discord_js_1.ButtonStyle.Primary);
                    await msg.edit({
                        embeds: [
                            (0, embed_1.infoEmbed)(`Current volume: ${(0, discord_js_1.inlineCode)(`${(volumeState.resource.volume.volume * 100).toFixed(0)}%`)}`),
                        ],
                        components: [volumeRow],
                    });
                },
            });
            return;
        }
        else {
            let vol = Number(args[0]);
            if (vol > 100)
                vol = 100;
            volumeState.resource.volume.setVolume(vol / 100);
            return message.replyWithoutMention({
                embeds: [
                    (0, embed_1.successEmbed)(`Successfully set the volume to ${(0, discord_js_1.inlineCode)(vol + "%")}`),
                ],
            });
        }
    },
};
//# sourceMappingURL=volume.js.map