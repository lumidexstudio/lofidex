"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const ambient_sound_1 = __importDefault(require("../../ambient-sound"));
const lofi_1 = __importDefault(require("../../lofi"));
const getCurrentPlayingTime_1 = __importDefault(require("../getCurrentPlayingTime"));
const embed_1 = require("../embed");
const playbackEngine_1 = require("../audio/playbackEngine");
const addAmbient = async (message, con, argsAmbient) => {
    if (!ambient_sound_1.default.find((item) => item.name === argsAmbient))
        return message.replyWithoutMention({
            embeds: [(0, embed_1.errorEmbed)("Ambient not found!")],
        });
    const getdb = (await message.client.db.get(`vc.${message.guild.id}`));
    if (getdb.ambients.includes(argsAmbient))
        return message.replyWithoutMention({
            embeds: [(0, embed_1.errorEmbed)(`${argsAmbient} ambient already in use!`)],
        });
    getdb.ambients.push(argsAmbient);
    await message.client.db.set(`vc.${message.guild.id}.ambients`, getdb.ambients);
    const player = con.state.subscription.player;
    if (typeof player.skipNextIdle === "function")
        player.skipNextIdle();
    if (getdb.ambientOnly) {
        (0, playbackEngine_1.playAmbientOnly)(message.client, message.guild.id, player, getdb.ambients, {
            shouldSendEmbed: false,
        });
        return message.replyWithoutMention({
            embeds: [(0, embed_1.successEmbed)("Ambient added successfully!")],
        });
    }
    const resource = player.state.resource;
    if (!resource) {
        getdb.ambientOnly = true;
        await message.client.db.set(`vc.${message.guild.id}.ambientOnly`, true);
        (0, playbackEngine_1.playAmbientOnly)(message.client, message.guild.id, player, getdb.ambients, {
            shouldSendEmbed: false,
        });
        return message.replyWithoutMention({
            embeds: [(0, embed_1.successEmbed)("Ambient added successfully!")],
        });
    }
    const song = lofi_1.default[resource.metadata.index];
    const startOffset = (0, getCurrentPlayingTime_1.default)(con, message.client, message.guild.id);
    if (startOffset === null)
        return message.replyWithoutMention({
            embeds: [(0, embed_1.errorEmbed)("No song were played!")],
        });
    (0, playbackEngine_1.playSong)(message.client, message.guild.id, player, song, {
        ambientNames: getdb.ambients,
        songIndex: lofi_1.default.findIndex((item) => item.title === song.title),
        startOffsetSeconds: startOffset,
        shouldSendEmbed: false,
    });
    return message.replyWithoutMention({
        embeds: [(0, embed_1.successEmbed)("Ambient added successfully!")],
    });
};
module.exports = addAmbient;
//# sourceMappingURL=addAmbient.js.map