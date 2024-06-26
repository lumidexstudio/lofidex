const { getVoiceConnection } = require("@discordjs/voice");
const ambientList = require("../../../ambient-sound");
const { ActionRowBuilder, ButtonStyle, ButtonBuilder, ComponentType, inlineCode } = require("discord.js");
const { infoEmbed, errorEmbed } = require("../../../lib/embed");
const removeAmbient = require("../../../lib/music/removeAmbient");
const addAmbient = require("../../../lib/music/addAmbient");
const stopAllCollectors = require("../../../lib/stopAllCollectors");

module.exports = {
  name: "remove",
  description: "Removes ambient on the currently playing song.",
  aliases: ["removeambient"],
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

    let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);

    if (args[0]) {
      if (!ambients.length) return message.replyWithoutMention({ embeds: [errorEmbed("No ambients found!")] });
      await removeAmbient(message, connection, args[0]);
    } else {
      let btns = {};
      let ambientsNow = await message.client.db.get(`vc.${message.guild.id}.ambients`);

      let rows = [];
      let row = new ActionRowBuilder();

      for (let i = 0; i < ambientList.length; i++) {
        const ambient = ambientList[i];
        btns[ambient.name] = new ButtonBuilder().setCustomId("remove_"+ambient.name).setLabel(ambient.name).setEmoji(ambient.emoji);

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
      let msg = await message.channel.send({ embeds: [infoEmbed(`Remove some ambients? use the buttons below...\n\nCurrent ambients: ${inlineCode(ambientsNow.length ? ambientsNow.join("`, `") : "none")}`)], components: rows });
      const collector = message.channel.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120000 });
      message.client.removeAmbient.set(message.guild.id, collector)
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
