"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const embed_1 = require("../embed");
const getCurrentPlayingTime_1 = __importDefault(require("../getCurrentPlayingTime"));
const playbackEngine_1 = require("../audio/playbackEngine");
const removeAmbient = async (message, con, argsAmbient) => {
    let ambients = (await message.client.db.get(`vc.${message.guild.id}.ambients`)) ?? [];
    if (!ambients.includes(argsAmbient)) {
        return message.replyWithoutMention({
            embeds: [(0, embed_1.errorEmbed)("Ambient not found in the active list.")],
        });
    }
    const getdb = (await message.client.db.get(`vc.${message.guild.id}`));
    ambients = ambients.filter((item) => item !== argsAmbient);
    await message.client.db.set(`vc.${message.guild.id}.ambients`, ambients);
    const player = con.state.subscription.player;
    if (typeof player.skipNextIdle === "function")
        player.skipNextIdle();
    if (getdb.ambientOnly) {
        if (ambients.length === 0) {
            return message.replyWithoutMention({
                embeds: [(0, embed_1.errorEmbed)("Cannot remove the last ambient in ambient-only mode. Use stop instead.")],
            });
        }
        (0, playbackEngine_1.playAmbientOnly)(message.client, message.guild.id, player, ambients, {
            shouldSendEmbed: false,
        });
        return message.replyWithoutMention({
            embeds: [(0, embed_1.successEmbed)("Ambient removed successfully!")],
        });
    }
    const list = require("../../lofi");
    const song = list[player.state.resource.metadata.index];
    const startOffset = (0, getCurrentPlayingTime_1.default)(con, message.client, message.guild.id);
    if (startOffset === null)
        return message.replyWithoutMention({
            embeds: [(0, embed_1.errorEmbed)("No song were played!")],
        });
    (0, playbackEngine_1.playSong)(message.client, message.guild.id, player, song, {
        ambientNames: ambients,
        songIndex: list.findIndex((item) => item.title === song.title),
        startOffsetSeconds: startOffset,
        shouldSendEmbed: false,
    });
    return message.replyWithoutMention({
        embeds: [(0, embed_1.successEmbed)("Ambient removed successfully!")],
    });
};
module.exports = removeAmbient;
//# sourceMappingURL=removeAmbient.js.map