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
const createButtonCollector_1 = __importDefault(require("../../../lib/createButtonCollector"));
const playbackSession_1 = require("../../../lib/voice/playbackSession");
const leaveVoice_1 = __importDefault(require("../../../lib/voice/leaveVoice"));
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
        if (!guildData) {
            if (!args[0]) {
                return message.replyWithoutMention({
                    embeds: [
                        (0, embed_1.errorEmbed)("Specify an ambient name to start. Usage: `add <ambient>`"),
                    ],
                });
            }
            if (!ambient_sound_1.default.find((item) => item.name === args[0])) {
                return message.replyWithoutMention({
                    embeds: [(0, embed_1.errorEmbed)("Ambient not found! Use `ambients` to see available sounds.")],
                });
            }
            const voiceChannelId = message.member.voice.channelId;
            if (!voiceChannelId)
                return message.replyWithoutMention({
                    embeds: [(0, embed_1.errorEmbed)("You must be on a voice channel first!")],
                });
            const voiceChannel = message.guild.channels.cache.get(voiceChannelId);
            if (!voiceChannel)
                return message.replyWithoutMention({
                    embeds: [(0, embed_1.errorEmbed)("Voice channel not found")],
                });
            const existingConnection = (0, voice_1.getVoiceConnection)(message.guild.id);
            if (existingConnection && existingConnection.state.status !== voice_1.VoiceConnectionStatus.Destroyed) {
                existingConnection.destroy();
            }
            await message.client.db.set(`vc.${message.guild.id}`, {
                channel: voiceChannel.id,
                master: message.member.user.id,
                ambients: [args[0]],
                ambientOnly: true,
                stay247: false,
            });
            try {
                await (0, playbackSession_1.startPlaybackSession)(message.client, {
                    guild: message.guild,
                    voiceChannel: voiceChannel,
                    textChannel: message.channel,
                    announce: true,
                });
            }
            catch {
                await (0, leaveVoice_1.default)(message.client, message.guild.id);
                return message.replyWithoutMention({
                    embeds: [(0, embed_1.errorEmbed)("Failed to join the voice channel.")],
                });
            }
            return;
        }
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
            await (0, createButtonCollector_1.default)(message, {
                key: "addAmbient",
                masterId: getdb.master,
                embeds: [
                    (0, embed_1.infoEmbed)(`Add some ambients? use the buttons below...\n\nCurrent ambients: ${(0, discord_js_1.inlineCode)(ambientsNow?.length ? ambientsNow.join("`, `") : "none")}`),
                ],
                components: rows,
                async onCollect(d, msg) {
                    const ambientsOld = await message.client.db.get(`vc.${message.guild.id}.ambients`);
                    if (ambientsOld?.includes(d.customId.split("_")[1])) {
                        await (0, removeAmbient_1.default)(message, connection, d.customId.split("_")[1]);
                    }
                    else {
                        await (0, addAmbient_1.default)(message, connection, d.customId.split("_")[1]);
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
                },
            });
        }
    },
};
//# sourceMappingURL=add.js.map