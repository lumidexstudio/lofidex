"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const voice_1 = require("@discordjs/voice");
const lofi_1 = __importDefault(require("../../../lofi"));
const formatTime_1 = __importDefault(require("../../../lib/formatTime"));
const getCurrentPlayingTime_1 = __importDefault(require("../../../lib/getCurrentPlayingTime"));
const createProgressBar_1 = __importDefault(require("../../../lib/createProgressBar"));
const nativeMixer_1 = require("../../../lib/audio/nativeMixer");
const skip_1 = __importDefault(require("../../../lib/music/skip"));
const embed_1 = require("../../../lib/embed");
const stop_1 = __importDefault(require("../../../lib/music/stop"));
const stopAllCollectors_1 = __importDefault(require("../../../lib/stopAllCollectors"));
module.exports = {
    name: "nowplaying",
    description: "Get details of the currently playing song.",
    aliases: ["np"],
    cooldown: 1,
    category: "lofi",
    async execute(message) {
        const guildData = (await message.client.db.get(`vc.${message.guild.id}`));
        if (!guildData)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("The bot is not playing music right now.")],
            });
        if (guildData.channel !== message.member.voice.channelId)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("We are not in the same voice channel!")],
            });
        const connection = (0, voice_1.getVoiceConnection)(message.guild.id);
        if (!connection)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("The bot is not playing music right now.")],
            });
        if (guildData.ambientOnly) {
            const ambientNames = (guildData.ambients ?? []).map((n) => `\`${n}\``).join(", ");
            const embed = new discord_js_1.EmbedBuilder()
                .setColor("Fuchsia")
                .setTitle("Ambient Mode")
                .setDescription(`Currently playing ambients:\n${ambientNames}`)
                .setTimestamp();
            const btns = {
                stop: new discord_js_1.ButtonBuilder().setCustomId("stop").setLabel("Stop").setEmoji("\u23F9").setStyle(discord_js_1.ButtonStyle.Danger),
            };
            const row = new discord_js_1.ActionRowBuilder().addComponents(btns.stop);
            const msg = await message.channel.send({
                embeds: [embed],
                components: [row],
            });
            await (0, stopAllCollectors_1.default)(message);
            const collector = message.channel.createMessageComponentCollector({
                componentType: discord_js_1.ComponentType.Button,
                time: 120000,
            });
            message.client.nowplaying.set(message.guild.id, collector);
            collector.on("collect", async (d) => {
                await d.deferUpdate();
                if (d.user.id !== guildData.master) {
                    await d.followUp({ content: `${d.user.username}, only host can use this button.`, ephemeral: true });
                    return;
                }
                if (d.customId === "stop") {
                    collector.stop("disconnect");
                }
            });
            collector.on("end", async (_d, r) => {
                if (r === "disconnect") {
                    try {
                        await (0, stop_1.default)(connection, message);
                        await message.replyWithoutMention({
                            embeds: [
                                (0, embed_1.successEmbed)(`Disconnected\n\nThank you for using this bot. We are aware that many issues still exist. Come join our ${(0, discord_js_1.hyperlink)((0, discord_js_1.bold)("Support Server"), message.client.config.supportServer)} to get information, updates and more.`),
                            ],
                        });
                    }
                    catch {
                        console.log("err stop button now playing");
                    }
                }
            });
            return;
        }
        const isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
        if (!isplaying)
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("The bot is not playing music right now.")],
            });
        let detail = lofi_1.default[guildData.now ?? 0];
        const dur = (0, nativeMixer_1.getAudioDuration)(detail.path);
        const nowin = (0, getCurrentPlayingTime_1.default)(connection, message.client, message.guild.id) ?? 0;
        const embed = new discord_js_1.EmbedBuilder()
            .setColor("Fuchsia")
            .setTitle(detail.title + " by " + detail.author)
            .setURL(detail.source)
            .setThumbnail(detail.cover)
            .setDescription(`${(0, formatTime_1.default)(nowin)} ${(0, createProgressBar_1.default)(nowin, dur)} ${(0, formatTime_1.default)(dur)}`)
            .setTimestamp()
            .setFooter({ text: `Song ID: ${detail.id}` });
        const btns = {
            pause: new discord_js_1.ButtonBuilder().setCustomId("pause").setLabel("Pause").setEmoji("\u23F8").setStyle(discord_js_1.ButtonStyle.Secondary),
            stop: new discord_js_1.ButtonBuilder().setCustomId("stop").setLabel("Stop").setEmoji("\u23F9").setStyle(discord_js_1.ButtonStyle.Danger),
            skip: new discord_js_1.ButtonBuilder().setCustomId("skip").setLabel("Skip").setEmoji("\u23ED").setStyle(discord_js_1.ButtonStyle.Primary),
        };
        const row = new discord_js_1.ActionRowBuilder().addComponents(btns.pause, btns.skip, btns.stop);
        const msg = await message.channel.send({
            embeds: [embed],
            components: [row],
        });
        await (0, stopAllCollectors_1.default)(message);
        const collector = message.channel.createMessageComponentCollector({
            componentType: discord_js_1.ComponentType.Button,
            time: 120000,
        });
        message.client.nowplaying.set(message.guild.id, collector);
        collector.on("collect", async (d) => {
            const set = async (x) => {
                const player = connection.state.subscription.player;
                if (x.customId === "pause") {
                    const meta = player.state;
                    meta.resource.metadata.shouldSendEmbed = false;
                    if (player.state.status === voice_1.AudioPlayerStatus.Paused) {
                        player.unpause();
                        btns.pause.setStyle(discord_js_1.ButtonStyle.Secondary).setLabel("Pause").setEmoji("\u23F8");
                    }
                    else {
                        player.pause();
                        btns.pause.setStyle(discord_js_1.ButtonStyle.Primary).setLabel("Resume").setEmoji("\u25B6");
                    }
                }
                else if (x.customId === "stop") {
                    const coll = message.client.nowplaying.get(message.guild.id);
                    if (coll)
                        coll.stop("disconnect");
                }
                else if (x.customId === "skip") {
                    await (0, skip_1.default)(message, connection.state.subscription.player, false);
                    const now = await message.client.db.get(`vc.${message.guild.id}.now`);
                    detail = lofi_1.default[now ?? 0];
                    const durNew = (0, nativeMixer_1.getAudioDuration)(detail.path);
                    const nowinNew = (0, getCurrentPlayingTime_1.default)(connection, message.client, message.guild.id) ?? 0;
                    embed
                        .setTitle(detail.title + " by " + detail.author)
                        .setURL(detail.source)
                        .setThumbnail(detail.cover)
                        .setDescription(`${(0, formatTime_1.default)(nowinNew)} ${(0, createProgressBar_1.default)(nowinNew, durNew)} ${(0, formatTime_1.default)(durNew)}`)
                        .setTimestamp()
                        .setFooter({ text: `Song ID: ${detail.id}` });
                }
                await msg.edit({
                    embeds: [embed],
                    components: [row],
                });
            };
            await d.deferUpdate();
            if (d.user.id !== guildData.master) {
                await d.followUp({ content: `${d.user.username}, only host can use this button.`, ephemeral: true });
                return;
            }
            await set(d);
        });
        collector.on("end", async (_d, r) => {
            if (r === "disconnect") {
                try {
                    await (0, stop_1.default)(connection, message);
                    await message.replyWithoutMention({
                        embeds: [
                            (0, embed_1.successEmbed)(`Disconnected\n\nThank you for using this bot. We are aware that many issues still exist. Come join our ${(0, discord_js_1.hyperlink)((0, discord_js_1.bold)("Support Server"), message.client.config.supportServer)} to get information, updates and more.`),
                        ],
                    });
                }
                catch {
                    console.log("err stop button now playing");
                }
            }
        });
    },
};
//# sourceMappingURL=nowplaying.js.map