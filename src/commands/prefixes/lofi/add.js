const { getVoiceConnection } = require("@discordjs/voice");
const ambientList = require("../../../ambient-sound");
const { ActionRowBuilder, ButtonStyle, ButtonBuilder, ComponentType, inlineCode } = require("discord.js");
const { errorEmbed, infoEmbed } = require("../../../lib/embed");
const addAmbient = require("../../../lib/music/addAmbient");
const removeAmbient = require("../../../lib/music/removeAmbient");
const stopAllCollectors = require("../../../lib/stopAllCollectors");

module.exports = {
  name: "add",
  description: "Adds ambient to the currently playing song.",
  aliases: ["addambient", "ambient"],
  cooldown: 1,
  category: "lofi",
  args: ["<ambient?>"],
  async execute(message, args) {
    let isplaying = await message.client.db.has(`vc.${message.guild.id}.now`);
    if (!isplaying) return message.replyWithoutMention({ embeds: [errorEmbed("The bot is not playing music right now.")] });

    let host = await message.client.db.get(`vc.${message.guild.id}.master`);

    let getdb = await message.client.db.get(`vc.${message.guild.id}`);
    if (getdb.master !== message.member.user.id) return message.replyWithoutMention({ embeds: [errorEmbed("Only the DJ can control using this command.")] });
    if (getdb.channel !== message.member.voice.channelId) return message.replyWithoutMention({ embeds: [errorEmbed(`We are not in the same voice channel!`)] });

    const connection = getVoiceConnection(message.guild.id);
    if (!connection) return message.replyWithoutMention({ embeds: [errorEmbed("The bot is not playing music right now.")] });
    if (args[0]) {
      addAmbient(message, connection, args[0]);
    } else {
      let btns = {};
      let ambientsNow = await message.client.db.get(`vc.${message.guild.id}.ambients`);

      let rows = [];
      let row = new ActionRowBuilder();

      for (let i = 0; i < ambientList.length; i++) {
        const ambient = ambientList[i];
        btns[ambient.name] = new ButtonBuilder().setCustomId('add_'+ambient.name).setLabel(ambient.name).setEmoji(ambient.emoji);

        if (ambientsNow.includes(ambient.name)) {
          btns[ambient.name].setStyle(ButtonStyle.Primary);
        } else {
          btns[ambient.name].setStyle(ButtonStyle.Secondary);
        }

        row.addComponents(btns[ambient.name]);

        if ((i + 1) % 5 === 0 || i === ambientList.length - 1) {
          rows.push(row);
          row = new ActionRowBuilder();
        }
      }

      await stopAllCollectors(message);
      let msg = await message.channel.send({ embeds: [infoEmbed(`Add some ambients? use the buttons below...\n\nCurrent ambients: ${inlineCode(ambientsNow.length ? ambientsNow.join("`, `") : "none")}`)], components: rows });
      const collector = message.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });
      message.client.addAmbient.set(message.guild.id, collector)
      collector.on("collect", async (d) => {
        const set = async (x) => {
          let ambientsOld = await message.client.db.get(`vc.${message.guild.id}.ambients`);

          if (ambientsOld.includes(x.customId.split("_")[1])) {
            await removeAmbient(message, connection, x.customId.split("_")[1]);
          } else {
            await addAmbient(message, connection, x.customId.split("_")[1]);
          }

          let ambientsNow = await message.client.db.get(`vc.${message.guild.id}.ambients`);
          Object.keys(btns).map((x) => {
            if (ambientsNow.includes(x)) {
              btns[x].setStyle(ButtonStyle.Primary);
            } else {
              btns[x].setStyle(ButtonStyle.Secondary);
            }
          });

          msg.edit({ embeds: [infoEmbed(`Add some ambients? use the buttons below...\n\nCurrent ambients: ${inlineCode(ambientsNow.length ? ambientsNow.join("`, `") : "none")}`)], components: rows });
        };

        await d.deferUpdate();
        if (d.user.id !== host) {
          return d.followUp({
            content: `${d.user.username}, only host can use this button.`,
            ephemeral: true,
          });
        }

        set(d);
      });
    }
  },
};
