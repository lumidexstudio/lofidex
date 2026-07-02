"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const voice_1 = require("@discordjs/voice");
const ambient_sound_1 = __importDefault(require("../../../ambient-sound"));
const discord_js_1 = require("discord.js");
const embed_1 = require("../../../lib/embed");
const addAmbient_1 = __importDefault(require("../../../lib/music/addAmbient"));
const removeAmbient_1 = __importDefault(require("../../../lib/music/removeAmbient"));
const stopAllCollectors_1 = __importDefault(require("../../../lib/stopAllCollectors"));
function formatAmbientList(items) {
    return items.map((item) => `\`${item.name}\``).join(", ");
}
module.exports = {
    name: "add",
    description: "Adds ambient to the currently playing song.",
    aliases: ["addambient", "ambient"],
    cooldown: 1,
    category: "lofi",
    args: ["<ambient?>"],
    async execute(message, args) {
        const guildData = (await message.client.db.get(`vc.${message.guild.id}`));
        if (!guildData)
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
        if (args[0]) {
            await (0, addAmbient_1.default)(message, connection, args[0]);
        }
        else {
            if (ambient_sound_1.default.length > 25) {
                return message.channel.send({
                    embeds: [
                        (0, embed_1.infoEmbed)(`Ambient library is too large for button mode.\n\nCurrent ambients: ${(0, discord_js_1.inlineCode)(getdb.ambients.length
                            ? getdb.ambients.join("`, `")
                            : "none")}\n\nUse \`${message.client.config.prefix}add <ambient-name>\` with one of these names:\n${formatAmbientList(ambient_sound_1.default)}`),
                    ],
                });
            }
            const btns = {};
            const ambientsNow = await message.client.db.get(`vc.${message.guild.id}.ambients`);
            const rows = [];
            let row = new discord_js_1.ActionRowBuilder();
            for (let i = 0; i < ambient_sound_1.default.length; i++) {
                const ambient = ambient_sound_1.default[i];
                btns[ambient.name] = new discord_js_1.ButtonBuilder()
                    .setCustomId("add_" + ambient.name)
                    .setLabel(ambient.name)
                    .setEmoji(ambient.emoji);
                if (ambientsNow?.includes(ambient.name)) {
                    btns[ambient.name].setStyle(discord_js_1.ButtonStyle.Primary);
                }
                else {
                    btns[ambient.name].setStyle(discord_js_1.ButtonStyle.Secondary);
                }
                row.addComponents(btns[ambient.name]);
                if ((i + 1) % 5 === 0 || i === ambient_sound_1.default.length - 1) {
                    rows.push(row);
                    row = new discord_js_1.ActionRowBuilder();
                }
            }
            await (0, stopAllCollectors_1.default)(message);
            const msg = await message.channel.send({
                embeds: [
                    (0, embed_1.infoEmbed)(`Add some ambients? use the buttons below...\n\nCurrent ambients: ${(0, discord_js_1.inlineCode)(ambientsNow?.length ? ambientsNow.join("`, `") : "none")}`),
                ],
                components: rows,
            });
            const collector = message.channel.createMessageComponentCollector({
                componentType: discord_js_1.ComponentType.Button,
                time: 120000,
            });
            message.client.addAmbient.set(message.guild.id, collector);
            collector.on("collect", async (d) => {
                const set = async (x) => {
                    const ambientsOld = await message.client.db.get(`vc.${message.guild.id}.ambients`);
                    if (ambientsOld?.includes(x.customId.split("_")[1])) {
                        await (0, removeAmbient_1.default)(message, connection, x.customId.split("_")[1]);
                    }
                    else {
                        await (0, addAmbient_1.default)(message, connection, x.customId.split("_")[1]);
                    }
                    const ambientsNowDb = await message.client.db.get(`vc.${message.guild.id}.ambients`);
                    Object.keys(btns).forEach((key) => {
                        if (ambientsNowDb?.includes(key)) {
                            btns[key].setStyle(discord_js_1.ButtonStyle.Primary);
                        }
                        else {
                            btns[key].setStyle(discord_js_1.ButtonStyle.Secondary);
                        }
                    });
                    await msg.edit({
                        embeds: [
                            (0, embed_1.infoEmbed)(`Add some ambients? use the buttons below...\n\nCurrent ambients: ${(0, discord_js_1.inlineCode)(ambientsNowDb?.length ? ambientsNowDb.join("`, `") : "none")}`),
                        ],
                        components: rows,
                    });
                };
                await d.deferUpdate();
                if (d.user.id !== getdb.master) {
                    await d.followUp({
                        content: `${d.user.username}, only host can use this button.`,
                        ephemeral: true,
                    });
                    return;
                }
                await set(d);
            });
        }
    },
};
//# sourceMappingURL=add.js.map