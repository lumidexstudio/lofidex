const { EmbedBuilder, resolveColor } = require("discord.js");
const getArgument = require("../../../lib/getArgument");

module.exports = {
    name: "sayembed",
    category: "owner",
    async execute(message, args) {
        let a = args.join(" ");
        if(!a) return message.replyWithoutMention({ content: 'argument needed' });

        let valid = ['color', 'title', 'url', 'author', 'description', 'thumbnail', 'fields', 'image', 'timestamp', 'footer'];
        let objek = {};

        for (let i = 0; i < valid.length; i++) {
            const el = valid[i];
            let g = getArgument(a, `--${el}`);
            if(g) {
                g = g.replace(/\\n/gm, "\n");
                if(el === "color") {
                    objek[el] = resolveColor(g);
                    continue;
                }

                if(el === 'author') {
                    objek.author = { name: g };
                    continue
                }

                objek[el] = g;
            }
        }

        let embed = new EmbedBuilder(objek);
        message.channel.send({ embeds: [embed] });
    }
}