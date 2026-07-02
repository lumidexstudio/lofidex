"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasVoted = hasVoted;
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
async function hasVoted(userId) {
    if (!config_1.default.topgg.token) {
        console.warn("[topgg] TOPGG_TOKEN is not set — vote checks always fail.");
        return false;
    }
    try {
        const { data } = await axios_1.default.get(`https://top.gg/api/bots/${config_1.default.topgg.botId}/check`, {
            params: { userId },
            headers: { Authorization: config_1.default.topgg.token },
        });
        return data?.voted === 1;
    }
    catch (error) {
        console.error(`[topgg] vote check failed: ${error.message}`);
        return false;
    }
}
//# sourceMappingURL=topgg.js.map