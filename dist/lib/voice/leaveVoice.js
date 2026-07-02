"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const node_fs_1 = __importDefault(require("node:fs"));
const voice_1 = require("@discordjs/voice");
const playbackEngine_1 = require("../audio/playbackEngine");
async function leaveVoice(client, guildId) {
    (0, playbackEngine_1.destroyGuildMixer)(client, guildId);
    const connection = (0, voice_1.getVoiceConnection)(guildId);
    if (connection) {
        connection.destroy();
    }
    const timer = client.leaveTimers?.get(guildId);
    if (timer) {
        clearTimeout(timer);
        client.leaveTimers.delete(guildId);
    }
    client.nowplaying.delete(guildId);
    try {
        node_fs_1.default.rmSync(`temp/${guildId}`, { recursive: true, force: true });
    }
    catch {
        // temp dir may not exist — nothing to clean up
    }
    await client.db.delete(`vc.${guildId}`);
}
module.exports = leaveVoice;
//# sourceMappingURL=leaveVoice.js.map