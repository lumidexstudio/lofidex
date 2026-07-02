"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const config_1 = __importDefault(require("../config"));
const axios_1 = __importDefault(require("axios"));
async function hastebin(text) {
    const result = await (0, axios_1.default)(config_1.default.hasteServer + "/documents", {
        method: "POST",
        data: text,
    });
    return `${config_1.default.hasteServer}/${result.data.key}`;
}
module.exports = hastebin;
//# sourceMappingURL=hastebin.js.map