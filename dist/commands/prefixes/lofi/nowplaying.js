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
const createButtonCollector_1 = __importDefault(require("../../../lib/createButtonCollector"));
async function handleCollectorEnd(r, connection, message) {
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
}
function ambientNowPlayingEmbed(ambientNames) {
    return new discord_js_1.EmbedBuilder()
        .setColor("Fuchsia")
        .setTitle("Ambient Mode")
        .setDescription(`Currently playing ambients:\n${ambientNames.map((n) => `\`${n}\``).join(", ")}`)
        .setTimestamp();
}
function songNowPlayingEmbed(detail, nowin, dur) {
    return new discord_js_1.EmbedBuilder()
        .setColor("Fuchsia")
        .setTitle(detail.title + " by " + detail.author)
        .setURL(detail.source)
        .setThumbnail(detail.cover)
        .setDescription(`${(0, formatTime_1.default)(nowin)} ${(0, createProgressBar_1.default)(nowin, dur)} ${(0, formatTime_1.default)(dur)}`)
        .setTimestamp()
        .setFooter({ text: `Song ID: ${detail.id}` });
}
function buildSongButtons() {
    return {
        pause: new discord_js_1.ButtonBuilder().setCustomId("pause").setLabel("Pause").setEmoji("\u23F8").setStyle(discord_js_1.ButtonStyle.Secondary),
        stop: new discord_js_1.ButtonBuilder().setCustomId("stop").setLabel("Stop").setEmoji("\u23F9").setStyle(discord_js_1.ButtonStyle.Danger),
        skip: new discord_js_1.ButtonBuilder().setCustomId("skip").setLabel("Skip").setEmoji("\u23ED").setStyle(discord_js_1.ButtonStyle.Primary),
    };
}
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
            const ambientNames = guildData.ambients ?? [];
            const btns = {
                stop: new discord_js_1.ButtonBuilder().setCustomId("stop").setLabel("Stop").setEmoji("\u23F9").setStyle(discord_js_1.ButtonStyle.Danger),
            };
            const row = new discord_js_1.ActionRowBuilder().addComponents(btns.stop);
            await (0, createButtonCollector_1.default)(message, {
                key: "nowplaying",
                masterId: guildData.master ?? null,
                embeds: [ambientNowPlayingEmbed(ambientNames)],
                components: [row],
                async onCollect(d) {
                    if (d.customId === "stop") {
                        const coll = message.client.nowplaying.get(message.guild.id);
                        if (coll)
                            coll.stop("disconnect");
                    }
                },
                async onEnd(r) {
                    await handleCollectorEnd(r, connection, message);
                },
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
        const btns = buildSongButtons();
        const row = new discord_js_1.ActionRowBuilder().addComponents(btns.pause, btns.skip, btns.stop);
        const msg = await (0, createButtonCollector_1.default)(message, {
            key: "nowplaying",
            masterId: guildData.master ?? null,
            embeds: [songNowPlayingEmbed(detail, nowin, dur)],
            components: [row],
            async onCollect(d) {
                const player = connection.state.subscription.player;
                if (d.customId === "pause") {
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
                else if (d.customId === "stop") {
                    const coll = message.client.nowplaying.get(message.guild.id);
                    if (coll)
                        coll.stop("disconnect");
                    return;
                }
                else if (d.customId === "skip") {
                    await (0, skip_1.default)(message, player, false);
                    const now = await message.client.db.get(`vc.${message.guild.id}.now`);
                    detail = lofi_1.default[now ?? 0];
                    const durNew = (0, nativeMixer_1.getAudioDuration)(detail.path);
                    const nowinNew = (0, getCurrentPlayingTime_1.default)(connection, message.client, message.guild.id) ?? 0;
                    const embed = songNowPlayingEmbed(detail, nowinNew, durNew);
                    await msg.edit({ embeds: [embed], components: [row] });
                    return;
                }
                await msg.edit({ embeds: [songNowPlayingEmbed(detail, (0, getCurrentPlayingTime_1.default)(connection, message.client, message.guild.id) ?? 0, (0, nativeMixer_1.getAudioDuration)(detail.path))], components: [row] });
            },
            async onEnd(r) {
                await handleCollectorEnd(r, connection, message);
            },
        });
    },
};
//# sourceMappingURL=nowplaying.js.map