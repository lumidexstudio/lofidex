"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const getArgument_1 = __importDefault(require("../../../lib/getArgument"));
module.exports = {
    name: "sayembed",
    category: "owner",
    async execute(message, args) {
        const a = args.join(" ");
        if (!a) {
            await message.replyWithoutMention({ content: "argument needed" });
            return;
        }
        const valid = [
            "color",
            "title",
            "url",
            "author",
            "description",
            "thumbnail",
            "fields",
            "image",
            "timestamp",
            "footer",
        ];
        const objek = {};
        for (let i = 0; i < valid.length; i++) {
            const el = valid[i];
            const g = (0, getArgument_1.default)(a, `--${el}`);
            if (g) {
                const resolved = g.replace(/\\n/gm, "\n");
                if (el === "color") {
                    objek[el] = (0, discord_js_1.resolveColor)(resolved);
                    continue;
                }
                if (el === "author") {
                    objek.author = { name: resolved };
                    continue;
                }
                objek[el] = resolved;
            }
        }
        const embed = new discord_js_1.EmbedBuilder();
        // apply objek properties
        if (objek.color)
            embed.setColor(objek.color);
        if (objek.title)
            embed.setTitle(objek.title);
        if (objek.url)
            embed.setURL(objek.url);
        if (objek.author)
            embed.setAuthor(objek.author);
        if (objek.description)
            embed.setDescription(objek.description);
        if (objek.thumbnail)
            embed.setThumbnail(objek.thumbnail);
        if (objek.image)
            embed.setImage(objek.image);
        if (objek.timestamp)
            embed.setTimestamp(new Date(objek.timestamp));
        if (objek.footer)
            embed.setFooter({ text: objek.footer });
        await message.channel.send({ embeds: [embed] });
    },
};
//# sourceMappingURL=sayembed.js.map