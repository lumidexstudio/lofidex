const { codeBlock } = require('discord.js');

module.exports = {
    name: "eval",
    category: "owner",
    async execute(message, args) {
        try {
            var evaled = await eval(args.join(" "));
            return message.replyWithoutMention({ content: codeBlock(require("util").inspect(evaled, { depth: 0 })) });
        } catch (err) {
            return message.replyWithoutMention({ content: codeBlock(err) });
        }
    }
}