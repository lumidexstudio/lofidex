"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.infoEmbed = exports.loadingEmbed = exports.noteEmbed = exports.dieEmbed = exports.successEmbed = exports.errorEmbed = void 0;
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../config"));
const errorEmbed = (message) => {
    const embed = new discord_js_1.EmbedBuilder()
        .setDescription(`${config_1.default.emoji.noEntry} ` + message)
        .setColor("Red");
    return embed;
};
exports.errorEmbed = errorEmbed;
const successEmbed = (message) => {
    const embed = new discord_js_1.EmbedBuilder()
        .setDescription(`${config_1.default.emoji.check} ` + message)
        .setColor("Green");
    return embed;
};
exports.successEmbed = successEmbed;
const dieEmbed = (message) => {
    const embed = new discord_js_1.EmbedBuilder()
        .setDescription(`${config_1.default.emoji.skull} ` + message)
        .setColor("Red");
    return embed;
};
exports.dieEmbed = dieEmbed;
const noteEmbed = (message) => {
    const embed = new discord_js_1.EmbedBuilder()
        .setDescription(`${config_1.default.emoji.info} ` + message)
        .setColor("Fuchsia");
    return embed;
};
exports.noteEmbed = noteEmbed;
const loadingEmbed = (message) => {
    const embed = new discord_js_1.EmbedBuilder()
        .setDescription(`${config_1.default.emoji.hourglass} ` + message)
        .setColor("Fuchsia");
    return embed;
};
exports.loadingEmbed = loadingEmbed;
const infoEmbed = (message) => {
    const embed = new discord_js_1.EmbedBuilder()
        .setDescription(`${config_1.default.emoji.sparkles} ` + message)
        .setColor("Fuchsia");
    return embed;
};
exports.infoEmbed = infoEmbed;
//# sourceMappingURL=embed.js.map