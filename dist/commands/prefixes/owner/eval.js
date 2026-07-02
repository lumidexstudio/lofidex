"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const dotenv_1 = __importDefault(require("dotenv"));
const discord_js_1 = require("discord.js");
const embed_1 = require("../../../lib/embed");
const hastebin_1 = __importDefault(require("../../../lib/hastebin"));
dotenv_1.default.config();
function clean(text) {
    return text
        .replace(new RegExp(process.env.BOT_TOKEN ?? "", "g"), "[REDACTED]")
        .replace(/`/g, `\`${String.fromCharCode(8203)}`)
        .replace(/@/g, `@${String.fromCharCode(8203)}`);
}
module.exports = {
    name: "eval",
    category: "owner",
    async execute(message, args) {
        const code = args
            .join(" ")
            .replace(/```(?:[^\s]+\n)?(.*?)\n?```/gs, (_, a) => a);
        try {
            if (!code)
                return message.replyWithoutMention({
                    embeds: [
                        (0, embed_1.errorEmbed)("No code provided! use codeblock instead!"),
                    ],
                });
            const isAsync = /--async$/.test(code);
            const toExec = isAsync
                ? code.replace(/--async$/, "")
                : code;
            const evaled = require("util").inspect(await eval(isAsync
                ? `(async () => {\n${toExec}\n})()`
                : toExec), {
                depth: 0,
            });
            const cleaned = clean(evaled);
            const output = cleaned.length > 2000
                ? await (0, hastebin_1.default)(cleaned)
                : (0, discord_js_1.codeBlock)(cleaned);
            return message.replyWithoutMention({
                content: output,
            });
        }
        catch (err) {
            const cleaned = clean(String(err));
            const output = cleaned.length > 2000
                ? await (0, hastebin_1.default)(cleaned)
                : (0, discord_js_1.codeBlock)(cleaned);
            return message.replyWithoutMention({
                content: output,
            });
        }
    },
};
//# sourceMappingURL=eval.js.map