"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPlaybackSession = startPlaybackSession;
const node_fs_1 = __importDefault(require("node:fs"));
const voice_1 = require("@discordjs/voice");
const discord_js_1 = require("discord.js");
const humanizeTime_1 = __importDefault(require("../humanizeTime"));
const playbackEngine_1 = require("../audio/playbackEngine");
const nativeMixer_1 = require("../audio/nativeMixer");
const loop_1 = __importDefault(require("../music/loop"));
const leaveVoice_1 = __importDefault(require("./leaveVoice"));
const lofi_1 = __importDefault(require("../../lofi"));
function ensureGuildTemp(guildId) {
    if (!node_fs_1.default.existsSync(`temp/${guildId}`)) {
        node_fs_1.default.mkdirSync(`temp/${guildId}`);
    }
}
async function genMusic(client, guildId, player) {
    const ambients = await client.db.get(`vc.${guildId}.ambients`);
    const idx = Math.floor(Math.random() * lofi_1.default.length);
    const song = lofi_1.default[idx];
    (0, playbackEngine_1.playSong)(client, guildId, player, song, {
        ambientNames: ambients ?? [],
        songIndex: idx,
        startOffsetSeconds: 0,
        shouldSendEmbed: true,
    });
    await client.db.set(`vc.${guildId}.now`, idx);
}
async function resumeSong(client, guildId, player) {
    const ambients = await client.db.get(`vc.${guildId}.ambients`);
    const now = await client.db.get(`vc.${guildId}.now`);
    const idx = Number.isInteger(now) ? now : 0;
    const song = lofi_1.default[idx] ?? lofi_1.default[0];
    (0, playbackEngine_1.playSong)(client, guildId, player, song, {
        ambientNames: ambients ?? [],
        songIndex: idx,
        startOffsetSeconds: 0,
        shouldSendEmbed: false,
    });
    await client.db.set(`vc.${guildId}.now`, idx);
}
async function startPlaybackSession(client, { guild, voiceChannel, textChannel = null, announce = true, resume = false }) {
    const guildId = guild.id;
    ensureGuildTemp(guildId);
    const connection = (0, voice_1.joinVoiceChannel)({
        channelId: voiceChannel.id,
        guildId,
        adapterCreator: guild.voiceAdapterCreator,
    });
    connection.on(voice_1.VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Signalling, 5_000),
                (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Connecting, 5_000),
            ]);
        }
        catch {
            await (0, leaveVoice_1.default)(client, guildId);
            console.log(`bot disconnected from guild ${guildId}`);
        }
    });
    try {
        await (0, voice_1.entersState)(connection, voice_1.VoiceConnectionStatus.Ready, 30_000);
    }
    catch (error) {
        await (0, leaveVoice_1.default)(client, guildId);
        throw error;
    }
    const player = (0, voice_1.createAudioPlayer)();
    connection.subscribe(player);
    const session = await client.db.get(`vc.${guildId}`);
    if (session?.ambientOnly) {
        (0, playbackEngine_1.playAmbientOnly)(client, guildId, player, session.ambients ?? [], { shouldSendEmbed: announce });
    }
    else if (resume) {
        await resumeSong(client, guildId, player);
    }
    else {
        await genMusic(client, guildId, player);
    }
    let embed = new discord_js_1.EmbedBuilder().setColor("Fuchsia").setAuthor({ name: "Loading" }).setDescription((0, discord_js_1.italic)("Preparing..."));
    player.on(voice_1.AudioPlayerStatus.Buffering, async () => {
        const meta = player.state.resource.metadata;
        if (!textChannel || !meta.shouldSendEmbed)
            return;
        embed.setAuthor({ name: "Buffering" }).setDescription("Please wait until song are played").setThumbnail(null);
        await textChannel.send({ embeds: [embed] });
    });
    player.on(voice_1.AudioPlayerStatus.Playing, async () => {
        const meta = player.state.resource.metadata;
        if (!textChannel || !meta.shouldSendEmbed)
            return;
        if (meta.ambientOnly) {
            const ambientNames = meta.ambientNames.map((n) => `\`${n}\``).join(", ");
            embed = embed.setAuthor({ name: "Playing Ambient" }).setDescription(`Ambients: ${ambientNames}`).setThumbnail(null).setTimestamp();
            await textChannel.send({ embeds: [embed] });
        }
        else {
            const songDuration = (0, nativeMixer_1.getAudioDuration)(meta.path);
            const sourceButton = new discord_js_1.ButtonBuilder().setLabel("Source").setURL(meta.source).setStyle(discord_js_1.ButtonStyle.Link);
            const row = new discord_js_1.ActionRowBuilder().addComponents(sourceButton);
            embed = embed
                .setAuthor({ name: `Playing ${meta.title}` })
                .setDescription(`By: ${meta.author}\nDuration: ${(0, humanizeTime_1.default)(Math.ceil(songDuration))}`)
                .setThumbnail(meta.cover)
                .setTimestamp();
            await textChannel.send({ embeds: [embed], components: [row] });
        }
    });
    player.on("error", (error) => {
        console.error(error);
    });
    let skipNextIdle = false;
    player.skipNextIdle = () => {
        skipNextIdle = true;
    };
    player.on(voice_1.AudioPlayerStatus.Idle, async () => {
        if (skipNextIdle) {
            skipNextIdle = false;
            return;
        }
        (0, playbackEngine_1.destroyGuildMixer)(client, guildId);
        const guildData = await client.db.get(`vc.${guildId}`);
        if (!guildData)
            return;
        if (guildData.ambientOnly) {
            (0, playbackEngine_1.playAmbientOnly)(client, guildId, player, guildData.ambients ?? [], { shouldSendEmbed: false });
            return;
        }
        if (guildData.repeat?.state) {
            await (0, loop_1.default)(client, guildId, player, textChannel ?? null);
        }
        else {
            await genMusic(client, guildId, player);
        }
    });
    return { connection, player };
}
//# sourceMappingURL=playbackSession.js.map