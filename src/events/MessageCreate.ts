import { Events, Collection, type Message } from "discord.js";
import ErrorModule = require("../lib/Error");

export = {
  name: Events.MessageCreate,
  async execute(message: Message): Promise<void> {
    if (message.author.bot) return;

    let args: string[];
    const commands = Array.from(message.client.prefixes.values());
    const prefix = message.client.config.prefix.find((p) => message.content.startsWith(p));
    if (message.guild) {
      if (!prefix) return;
      args = message.content.slice(prefix.length).trim().split(/\s+/);
    } else {
      const slice = prefix ? prefix.length : 0;
      args = message.content.slice(slice).split(/\s+/);
    }

    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const commandData = commands.find((c: unknown) => {
      const cmd = c as { name: string; aliases?: string | string[] };
      return (
        cmd.name.toLowerCase() === commandName ||
        (cmd.aliases && typeof cmd.aliases === "object"
          ? (cmd.aliases as string[]).includes(commandName)
          : cmd.aliases === commandName)
      );
    });

    if (!commandData) return;

    const cmd = commandData as {
      name: string;
      category: string;
      cooldown?: number;
      execute: (msg: Message, a: string[]) => unknown;
    };

    const msg = message as Message & {
      used?: { prefix: string; command: string };
      replyWithoutMention?: (opts: Record<string, unknown>) => ReturnType<Message["reply"]>;
    };
    msg.used = { prefix: prefix ?? "", command: commandName };
    msg.replyWithoutMention = (opts: Record<string, unknown>) => {
      const repliedUser = opts.mention ? true : false;
      const { mention: _m, ...rest } = opts;
      return message.reply({
        ...rest,
        allowedMentions: { repliedUser },
      } as Parameters<Message["reply"]>[0]);
    };

    if (cmd.category === "owner" && !message.client.config.ownerID.includes(message.author.id)) return;

    const { cooldowns } = message.client;
    if (!cooldowns.has(cmd.name)) {
      cooldowns.set(cmd.name, new Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(cmd.name)!;
    const defaultCooldownDuration = 3;
    const cooldownAmount = (cmd.cooldown ?? defaultCooldownDuration) * 1000;

    if (timestamps.has(message.author.id)) {
      const expirationTime = timestamps.get(message.author.id)! + cooldownAmount;

      if (now < expirationTime) {
        const expiredTimestamp = Math.round(expirationTime / 1000);
        const rep = await msg.replyWithoutMention!({
          content: `⌛ ${message.author.username}, you are in cooldown! try again in <t:${expiredTimestamp}:R>`,
        });
        setTimeout(() => rep.delete(), expirationTime - Date.now());
        return;
      }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
      await cmd.execute(msg, args);
    } catch (error) {
      const errorCtx = `guild=${message.guild?.id} user=${message.author.tag} cmd=${cmd.name} args=${args.join(" ")}`;
      console.error(`[MessageCreate] Error executing ${cmd.name} (${errorCtx})`);
      await ErrorModule.execute(error as Error, msg as never);
      console.error(error);
    }
  },
};
