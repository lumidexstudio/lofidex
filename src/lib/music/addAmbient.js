const ambientList = require("../../ambient-sound");
const list = require("../../lofi");
const getCurrentlyPlayingTime = require("../getCurrentPlayingTime");
const { errorEmbed, successEmbed } = require("../embed");
const { playSong, playAmbientOnly } = require("../audio/playbackEngine");

const addAmbient = async (message, con, argsAmbient) => {
  if (!ambientList.find((item) => item.name === argsAmbient)) return message.replyWithoutMention({ embeds: [errorEmbed("Ambient not found!")] });

  let getdb = await message.client.db.get(`vc.${message.guild.id}`);
  if (getdb.ambients.includes(argsAmbient)) return message.replyWithoutMention({ embeds: [errorEmbed(`${argsAmbient} ambient already in use!`)] });

  getdb.ambients.push(argsAmbient);
  await message.client.db.set(`vc.${message.guild.id}.ambients`, getdb.ambients);

  const player = con.state.subscription.player;

  // Suppress the idle event that fires when the old mixer is killed
  if (typeof player.skipNextIdle === "function") player.skipNextIdle();

  if (getdb.ambientOnly) {
    // Ambient-only mode — restart mixer with updated ambient list
    playAmbientOnly(message.client, message.guild.id, player, getdb.ambients, {
      shouldSendEmbed: false,
    });
    return message.replyWithoutMention({ embeds: [successEmbed("Ambient added successfully!")] });
  }

  let song = list[player.state.resource.metadata.index];
  const startOffset = getCurrentlyPlayingTime(con, message.client, message.guild.id);
  if (startOffset === null) return message.replyWithoutMention({ embeds: [errorEmbed("No song were played!")] });

  playSong(message.client, message.guild.id, player, song, {
    ambientNames: getdb.ambients,
    songIndex: list.findIndex((item) => item.title === song.title),
    startOffsetSeconds: startOffset,
    shouldSendEmbed: false,
  });

  return message.replyWithoutMention({ embeds: [successEmbed("Ambient added successfully!")] });
};

module.exports = addAmbient;
