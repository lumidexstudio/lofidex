"use strict";
const discord_js_1 = require("discord.js");
const ErrorModule = require("../lib/Error");
module.exports = {
    name: discord_js_1.Events.MessageCreate,
    async execute(message) {
        if (message.author.bot)
            return;
        let args;
        const commands = Array.from(message.client.prefixes.values());
        const prefix = message.client.config.prefix.find((p) => message.content.startsWith(p));
        if (message.guild) {
            if (!prefix)
                return;
            args = message.content.slice(prefix.length).trim().split(/\s+/);
        }
        else {
            const slice = prefix ? prefix.length : 0;
            args = message.content.slice(slice).split(/\s+/);
        }
        const commandName = args.shift()?.toLowerCase();
        if (!commandName)
            return;
        const commandData = commands.find((c) => {
            const cmd = c;
            return (cmd.name.toLowerCase() === commandName ||
                (cmd.aliases && typeof cmd.aliases === "object"
                    ? cmd.aliases.includes(commandName)
                    : cmd.aliases === commandName));
        });
        if (!commandData)
            return;
        const cmd = commandData;
        const msg = message;
        msg.used = { prefix: prefix ?? "", command: commandName };
        msg.replyWithoutMention = (opts) => {
            const repliedUser = opts.mention ? true : false;
            const { mention: _m, ...rest } = opts;
            return message.reply({
                ...rest,
                allowedMentions: { repliedUser },
            });
        };
        if (cmd.category === "owner" && !message.client.config.ownerID.includes(message.author.id))
            return;
        const { cooldowns } = message.client;
        if (!cooldowns.has(cmd.name)) {
            cooldowns.set(cmd.name, new discord_js_1.Collection());
        }
        const now = Date.now();
        const timestamps = cooldowns.get(cmd.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (cmd.cooldown ?? defaultCooldownDuration) * 1000;
        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
            if (now < expirationTime) {
                const expiredTimestamp = Math.round(expirationTime / 1000);
                const rep = await msg.replyWithoutMention({
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
        }
        catch (error) {
            console.error(`Error executing ${cmd.name}`);
            await ErrorModule.execute(error, msg);
            console.error(error);
        }
    },
};
//# sourceMappingURL=MessageCreate.js.map