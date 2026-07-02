"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const lofi_1 = __importDefault(require("../../lofi"));
const playbackEngine_1 = require("../audio/playbackEngine");
const restoreAmbient = async (message, songIndex, options = {}) => {
    const ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);
    const song = lofi_1.default[songIndex];
    const { resource } = (0, playbackEngine_1.createTrackResource)(message.client, message.guild.id, song, {
        ambientNames: ambients ?? [],
        songIndex,
        startOffsetSeconds: options.startOffsetSeconds ?? 0,
        shouldSendEmbed: options.shouldSendEmbed ?? true,
    });
    return resource;
};
module.exports = restoreAmbient;
//# sourceMappingURL=restoreAmbient.js.map