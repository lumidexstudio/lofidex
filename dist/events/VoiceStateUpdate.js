"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const config_1 = __importDefault(require("../config"));
const leaveVoice_1 = __importDefault(require("../lib/voice/leaveVoice"));
function clearPending(timers, guildId) {
    const pending = timers.get(guildId);
    if (pending) {
        clearTimeout(pending);
        timers.delete(guildId);
    }
}
function countHumans(channel) {
    if (!channel)
        return 0;
    return channel.members.filter((member) => !member.user.bot).size;
}
module.exports = {
    name: discord_js_1.Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const guild = newState.guild ?? oldState.guild;
        const client = guild.client;
        const guildId = guild.id;
        const timers = client.leaveTimers;
        const session = await client.db.get(`vc.${guildId}`);
        if (!session)
            return;
        const botChannelId = guild.members.me?.voice?.channelId;
        if (!botChannelId) {
            clearPending(timers, guildId);
            return;
        }
        const channel = guild.channels.cache.get(botChannelId);
        if ((channel && countHumans(channel) > 0) ||
            session.stay247) {
            clearPending(timers, guildId);
            return;
        }
        if (timers.has(guildId))
            return;
        const timer = setTimeout(async () => {
            timers.delete(guildId);
            const current = await client.db.get(`vc.${guildId}`);
            if (!current || current.stay247)
                return;
            const stillBotChannelId = guild.members.me?.voice?.channelId;
            const stillChannel = stillBotChannelId
                ? guild.channels.cache.get(stillBotChannelId)
                : null;
            if (!stillBotChannelId ||
                (stillChannel && countHumans(stillChannel) === 0)) {
                await (0, leaveVoice_1.default)(client, guildId);
                console.log(`auto-left empty channel in guild ${guildId}`);
            }
        }, config_1.default.voice.emptyLeaveMs);
        timers.set(guildId, timer);
    },
};
//# sourceMappingURL=VoiceStateUpdate.js.map