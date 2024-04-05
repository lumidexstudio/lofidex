const { EmbedBuilder, inlineCode } = require("discord.js");
const ms = require('ms');
const { noteEmbed } = require("../../../lib/embed");

module.exports = {
    name: "help",
    description: "Bot command list or help menu.",
    aliases: ['menu', '?'],
    cooldown: 1,
    category: "general",
    args: ["<command?>"],
    async execute(message, args) {
        let client = message.client;
        if(args.length) {
          let info = client.prefixes.get(args[0]);
          if(!info) return message.replyWithoutMention({ content: `${message.author.username}, Command ${inlineCode(args[0])} not found! try using the command name instead of command aliases!` });
          let infoEmbed = new EmbedBuilder()
            .setAuthor({ name: info.name })
            .setDescription(info.description || 'none')
            .addFields(
              { name: 'Aliases', value: inlineCode(info.aliases? info.aliases.join('`, `') : 'none')  },
              { name: 'Cooldown', value: inlineCode(ms(Number(info.cooldown || 0) * 1000)) },
              { name: 'Category', value: inlineCode(info.category || 'none') },
              { name: 'Usage', value: inlineCode((message.used.prefix + info.name + ' ' + (info.args? info.args.join(' ') : '')).trim()) }
            )
            .setColor('Purple');

          let embeds = info.args ? [infoEmbed, noteEmbed(`If there is an argument like ${inlineCode('<argument?>')} at usage, This mean the argument are optional. Otherwise required argument will be marked like ${inlineCode('<argument>')}.`)] : [infoEmbed];
          return message.replyWithoutMention({ embeds })
        }

        const fields = [];
        const data = Array.from(client.prefixes.values());
      
        data.map(({ name, category }) => {
          let capitalized = category.charAt(0).toUpperCase() + category.slice(1);
          if(!client.config.showOwnerCommandsAtHelpMenu && category === "owner") return; 
          if (!fields.some((x) => x.name === capitalized)) {
            fields.push({ name: capitalized, value: inlineCode(name) });
          } else {
            let index = fields.findIndex((x) => x.name === capitalized);
            fields[index].value = fields[index].value.concat(
              `, ${inlineCode(name)}`
            );
          }
        });


        const embed = new EmbedBuilder({ fields })
          .setColor('Random')
          .setDescription('Hellow, this bot is still in beta, and you may encounter some bugs. If you find any bugs, please report them with `ldxreport` command or join our support server... Your reports will really help the development of this bot ✨\n\nYou can use the `ldxhelp <command>` command to display information from the given command name.')
          .setAuthor({
            name:
              client.user.username +
              " Command List",
          });

        return message.replyWithoutMention({ embeds: [embed] });
    }
}