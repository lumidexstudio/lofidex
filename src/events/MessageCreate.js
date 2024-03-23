const { Events, Collection } = require("discord.js");

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        let args;
        let commands = Array.from(message.client.prefixes.values());
        let prefix = message.client.config.prefix.find((p) => message.content.startsWith(p));
        if (message.guild) {
          if (!prefix) return;
          args = message.content.slice(prefix.length).trim().split(/\s+/);
        } else {
          const slice = prefix ? prefix.length : 0;
          args = message.content.slice(slice).split(/\s+/);
        }

        const command = args.shift().toLowerCase();
        const commandData = commands.find(
          (c) =>
            c.name.toLowerCase() === command.toLowerCase() ||
            (c.aliases && typeof c.aliases === "object"
              ? c.aliases.includes(command.toLowerCase())
              : c.aliases === command.toLowerCase())
        );

        if(!commandData) return;
        message.used = { prefix, command };
        message.replyWithoutMention = ({ ...options }) => {
          let repliedUser = options.mention ? true : false;
          return message.reply({ ...options, allowedMentions: { repliedUser } });
        };

        // handle owner only
        if(commandData.category === "owner" && !message.client.config.ownerID.includes(message.author.id)) return;

        const { cooldowns } = message.client;
        if (!cooldowns.has(commandData.name)) {
          cooldowns.set(commandData.name, new Collection());
        }

        const now = Date.now();
        const timestamps = cooldowns.get(commandData.name);
        const defaultCooldownDuration = 3;
        const cooldownAmount = (commandData.cooldown ?? defaultCooldownDuration) * 1000;

        if (timestamps.has(message.author.id)) {
          const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

          if (now < expirationTime) {
            const expiredTimestamp = Math.round(expirationTime / 1000);
            const rep = await message.replyWithoutMention({ content: `⌛ ${message.author.username}, you are in cooldown! try again in <t:${expiredTimestamp}:R>` });
            setTimeout(() => rep.delete(), expirationTime - Date.now());
            return;
          }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        try {
          await commandData.execute(message, args);
        } catch (error) {
          console.error(`Error executing ${command}`);
          console.error(error);
        }
    }
}