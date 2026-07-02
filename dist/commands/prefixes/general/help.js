"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const discord_js_1 = require("discord.js");
const ms_1 = __importDefault(require("ms"));
const embed_1 = require("../../../lib/embed");
module.exports = {
    name: "help",
    description: "Bot command list or help menu.",
    aliases: ["menu", "?"],
    cooldown: 1,
    category: "general",
    args: ["<command?>"],
    async execute(message, args) {
        const client = message.client;
        if (args.length) {
            const info = client.prefixes.get(args[0]);
            if (!info)
                return message.replyWithoutMention({
                    content: `${message.author.username}, Command ${(0, discord_js_1.inlineCode)(args[0])} not found! try using the command name instead of command aliases!`,
                });
            const infoEmbed = new discord_js_1.EmbedBuilder()
                .setAuthor({ name: info.name })
                .setDescription(info.description || "none")
                .addFields({ name: "Aliases", value: (0, discord_js_1.inlineCode)(info.aliases ? info.aliases.join("`, `") : "none") }, { name: "Cooldown", value: (0, discord_js_1.inlineCode)((0, ms_1.default)(Number(info.cooldown || 0) * 1000)) }, { name: "Category", value: (0, discord_js_1.inlineCode)(info.category || "none") }, {
                name: "Usage",
                value: (0, discord_js_1.inlineCode)(((message.used?.prefix ?? "") + info.name + " " + (info.args ? info.args.join(" ") : "")).trim()),
            })
                .setColor("Fuchsia");
            const embeds = info.args
                ? [
                    infoEmbed,
                    (0, embed_1.noteEmbed)(`If there is an argument like ${(0, discord_js_1.inlineCode)("<argument?>")} at usage, This mean the argument are optional. Otherwise required argument will be marked like ${(0, discord_js_1.inlineCode)("<argument>")}.`),
                ]
                : [infoEmbed];
            return message.replyWithoutMention({ embeds });
        }
        const fields = [];
        const data = Array.from(client.prefixes.values());
        data.forEach(({ name, category }) => {
            const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
            if (!client.config.showOwnerCommandsAtHelpMenu && category === "owner")
                return;
            if (!fields.some((x) => x.name === capitalized)) {
                fields.push({ name: capitalized, value: (0, discord_js_1.inlineCode)(name) });
            }
            else {
                const index = fields.findIndex((x) => x.name === capitalized);
                fields[index].value = fields[index].value.concat(`, ${(0, discord_js_1.inlineCode)(name)}`);
            }
        });
        const embed = new discord_js_1.EmbedBuilder({ fields })
            .setColor("Fuchsia")
            .setImage("https://cdn.affandra.id/lumidex/lofidex/image/embedsbanner.png")
            .setDescription("Hellow, this bot is still in beta, and you may encounter some bugs. If you find any bugs, please report them with `ldxreport` command or join our support server... Your reports will really help the development of this bot \u2728\n\nYou can use the `ldxhelp <command>` command to display information from the given command name.")
            .setAuthor({
            name: client.user.username + " Command List",
        })
            .setFooter({ text: "\uD83C\uDFB5\uD83C\uDFB5\uD83C\uDFB5" });
        return message.replyWithoutMention({ embeds: [embed] });
    },
};
//# sourceMappingURL=help.js.map