"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const leaveVoice_1 = __importDefault(require("../voice/leaveVoice"));
const stop = async (_connection, message) => {
    await (0, leaveVoice_1.default)(message.client, message.guild.id);
};
module.exports = stop;
//# sourceMappingURL=stop.js.map