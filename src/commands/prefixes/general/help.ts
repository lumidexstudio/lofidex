import { EmbedBuilder, inlineCode } from "discord.js";
import ms from "ms";
import { noteEmbed } from "../../../lib/embed";
import type { MessageWithReply, Config } from "../../../types";

export = {
  name: "help",
  description: "Bot command list or help menu.",
  aliases: ["menu", "?"],
  cooldown: 1,
  category: "general",
  args: ["<command?>"],
  async execute(message: MessageWithReply, args: string[]): Promise<unknown> {
    const client = message.client;
    if (args.length) {
      const info = client.prefixes.get(args[0]) as
        | {
            name: string;
            description?: string;
            aliases?: string[];
            cooldown?: number;
            category?: string;
            args?: string[];
          }
        | undefined;
      if (!info)
        return message.replyWithoutMention!({
          content: `${message.author.username}, Command ${inlineCode(args[0])} not found! try using the command name instead of command aliases!`,
        });
      const infoEmbed = new EmbedBuilder()
        .setAuthor({ name: info.name })
        .setDescription(info.description || "none")
        .addFields(
          { name: "Aliases", value: inlineCode(info.aliases ? info.aliases.join("`, `") : "none") },
          { name: "Cooldown", value: inlineCode(ms(Number(info.cooldown || 0) * 1000)) },
          { name: "Category", value: inlineCode(info.category || "none") },
          {
            name: "Usage",
            value: inlineCode(
              ((message.used?.prefix ?? "") + info.name + " " + (info.args ? info.args.join(" ") : "")).trim()
            ),
          }
        )
        .setColor("Fuchsia");

      const embeds = info.args
        ? [
            infoEmbed,
            noteEmbed(
              `If there is an argument like ${inlineCode("<argument?>")} at usage, This mean the argument are optional. Otherwise required argument will be marked like ${inlineCode("<argument>")}.`
            ),
          ]
        : [infoEmbed];
      return message.replyWithoutMention!({ embeds });
    }

    const fields: { name: string; value: string }[] = [];
    const data = Array.from(client.prefixes.values()) as { name: string; category: string }[];

    data.forEach(({ name, category }) => {
      const capitalized = category.charAt(0).toUpperCase() + category.slice(1);
      if (!(client.config as Config & { showOwnerCommandsAtHelpMenu?: boolean }).showOwnerCommandsAtHelpMenu && category === "owner") return;
      if (!fields.some((x) => x.name === capitalized)) {
        fields.push({ name: capitalized, value: inlineCode(name) });
      } else {
        const index = fields.findIndex((x) => x.name === capitalized);
        fields[index].value = fields[index].value.concat(`, ${inlineCode(name)}`);
      }
    });

    const embed = new EmbedBuilder({ fields })
      .setColor("Fuchsia")
      .setImage("https://cdn.affandra.id/lumidex/lofidex/image/embedsbanner.png")
      .setDescription(
        "Hellow, this bot is still in beta, and you may encounter some bugs. If you find any bugs, please report them with `ldxreport` command or join our support server... Your reports will really help the development of this bot \u2728\n\nYou can use the `ldxhelp <command>` command to display information from the given command name."
      )
      .setAuthor({
        name: client.user!.username + " Command List",
      })
      .setFooter({ text: "\uD83C\uDFB5\uD83C\uDFB5\uD83C\uDFB5" });

    return message.replyWithoutMention!({ embeds: [embed] });
  },
};
