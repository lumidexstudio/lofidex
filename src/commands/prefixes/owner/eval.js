require('dotenv').config();
const { codeBlock } = require('discord.js');
const { errorEmbed, infoEmbed } = require('../../../lib/embed');
const hastebin = require('../../../lib/hastebin');

function clean(text) {
    return text
        .replace(new RegExp(process.env.TOKEN, "g"), "[REDACTED]")
        .replace(/`/g, `\`${String.fromCharCode(8203)}`)
        .replace(/@/g, `@${String.fromCharCode(8203)}`);
}

module.exports = {
    name: "eval",
    category: "owner",
    async execute(message, args) {
        let code = args.join(" ").replace(/```(?:[^\s]+\n)?(.*?)\n?```/gs, (_, a) => a);
        try {
            if(!code) return message.replyWithoutMention({ embeds: [errorEmbed('No code provided! use codeblock instead!')] })
            let isAsync = /--async$/.test(code);
            let toExec = isAsync ? code.replace(/--async$/, "") : code;
            console.log(toExec)
            let evaled = require("util").inspect(await eval(isAsync ? `(async () => {\n${toExec}\n})()` : toExec), {
                depth: 0
            });

            const cleaned = clean(evaled);
            const output = cleaned.length > 2000 ? await hastebin(cleaned) : codeBlock(cleaned);
            
            return message.replyWithoutMention({ content: output });
        } catch (err) {
            const cleaned = clean(String(err));
            const output = cleaned.length > 2000 ? await hastebin(cleaned) : codeBlock(cleaned);
            return message.replyWithoutMention({ content: output });
        }
    }
}