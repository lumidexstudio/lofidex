import { EmbedBuilder, resolveColor } from "discord.js";
import getArgument from "../../../lib/getArgument";
import type { MessageWithReply } from "../../../types";

export = {
  name: "sayembed",
  category: "owner",
  async execute(message: MessageWithReply, args: string[]): Promise<void> {
    const a = args.join(" ");
    if (!a) {
      await message.replyWithoutMention!({ content: "argument needed" });
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
    const objek: Record<string, unknown> = {};

    for (let i = 0; i < valid.length; i++) {
      const el = valid[i];
      const g = getArgument(a, `--${el}`);
      if (g) {
        const resolved = g.replace(/\\n/gm, "\n");
        if (el === "color") {
          objek[el] = resolveColor(resolved as Parameters<typeof resolveColor>[0]);
          continue;
        }
        if (el === "author") {
          objek.author = { name: resolved };
          continue;
        }
        objek[el] = resolved;
      }
    }

    const embed = new EmbedBuilder();
    // apply objek properties
    if (objek.color) embed.setColor(objek.color as number);
    if (objek.title) embed.setTitle(objek.title as string);
    if (objek.url) embed.setURL(objek.url as string);
    if (objek.author) embed.setAuthor(objek.author as { name: string });
    if (objek.description) embed.setDescription(objek.description as string);
    if (objek.thumbnail) embed.setThumbnail(objek.thumbnail as string);
    if (objek.image) embed.setImage(objek.image as string);
    if (objek.timestamp) embed.setTimestamp(new Date(objek.timestamp as string));
    if (objek.footer) embed.setFooter({ text: objek.footer as string });

    await (message.channel as unknown as { send: (opts: unknown) => Promise<unknown> }).send({ embeds: [embed] });
  },
};
