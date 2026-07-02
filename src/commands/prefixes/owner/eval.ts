import dotenv from "dotenv";
import { codeBlock } from "discord.js";
import {
  errorEmbed,
} from "../../../lib/embed";
import hastebin from "../../../lib/hastebin";
import type { MessageWithReply } from "../../../types";

dotenv.config();

function clean(text: string): string {
  return text
    .replace(
      new RegExp(process.env.BOT_TOKEN ?? "", "g"),
      "[REDACTED]"
    )
    .replace(/`/g, `\`${String.fromCharCode(8203)}`)
    .replace(/@/g, `@${String.fromCharCode(8203)}`);
}

export = {
  name: "eval",
  category: "owner",
  async execute(
    message: MessageWithReply,
    args: string[]
  ): Promise<unknown> {
    const code = args
      .join(" ")
      .replace(
        /```(?:[^\s]+\n)?(.*?)\n?```/gs,
        (_, a: string) => a
      );
    try {
      if (!code)
        return message.replyWithoutMention!({
          embeds: [
            errorEmbed(
              "No code provided! use codeblock instead!"
            ),
          ],
        });
      const isAsync = /--async$/.test(code);
      const toExec = isAsync
        ? code.replace(/--async$/, "")
        : code;
      const evaled = require("util").inspect(
        await eval(
          isAsync
            ? `(async () => {\n${toExec}\n})()`
            : toExec
        ),
        {
          depth: 0,
        }
      );

      const cleaned = clean(evaled);
      const output =
        cleaned.length > 2000
          ? await hastebin(cleaned)
          : codeBlock(cleaned);

      return message.replyWithoutMention!({
        content: output,
      });
    } catch (err: unknown) {
      const cleaned = clean(String(err));
      const output =
        cleaned.length > 2000
          ? await hastebin(cleaned)
          : codeBlock(cleaned);
      return message.replyWithoutMention!({
        content: output,
      });
    }
  },
};
