"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const stopAllCollectors_1 = __importDefault(require("./stopAllCollectors"));
async function createButtonCollector(message, options) {
    const { key, masterId, embeds, components, onCollect, onEnd, timeout = 120000 } = options;
    await (0, stopAllCollectors_1.default)(message);
    const msg = await message.channel.send({ embeds, components });
    const collector = message.channel.createMessageComponentCollector({
        componentType: discord_js_1.ComponentType.Button,
        time: timeout,
    });
    message.client[key].set(message.guild.id, collector);
    collector.on("collect", async (d) => {
        await d.deferUpdate();
        if (masterId && d.user.id !== masterId) {
            await d.followUp({ content: `${d.user.username}, only host can use this button.`, ephemeral: true });
            return;
        }
        await onCollect(d, msg);
    });
    if (onEnd) {
        collector.on("end", async (_d, r) => {
            await onEnd(r, msg);
        });
    }
    return msg;
}
module.exports = createButtonCollector;
//# sourceMappingURL=createButtonCollector.js.map