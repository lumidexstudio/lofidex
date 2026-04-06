const { successEmbed, errorEmbed } = require("../embed");
const getCurrentlyPlayingTime = require("../getCurrentPlayingTime");
const { playSong, playAmbientOnly } = require("../audio/playbackEngine");

const removeAmbient = async (message, con, argsAmbient) => {
  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);

  if (!ambients.includes(argsAmbient)) {
    return message.replyWithoutMention({ embeds: [errorEmbed("Ambient not found in the active list.")] });
  }

  let getdb = await message.client.db.get(`vc.${message.guild.id}`);

  ambients = ambients.filter((item) => item !== argsAmbient);
  await message.client.db.set(`vc.${message.guild.id}.ambients`, ambients);

  const player = con.state.subscription.player;

  // Suppress the idle event that fires when the old mixer is killed
  if (typeof player.skipNextIdle === "function") player.skipNextIdle();

  if (getdb.ambientOnly) {
    if (ambients.length === 0) {
      return message.replyWithoutMention({ embeds: [errorEmbed("Cannot remove the last ambient in ambient-only mode. Use stop instead.")] });
    }
    // Restart mixer with updated ambient list
    playAmbientOnly(message.client, message.guild.id, player, ambients, {
      shouldSendEmbed: false,
    });
    return message.replyWithoutMention({ embeds: [successEmbed("Ambient removed successfully!")] });
  }

  let list = require("../../lofi");

  let song = list[player.state.resource.metadata.index];
  const startOffset = getCurrentlyPlayingTime(con, message.client, message.guild.id);
  if (startOffset === null) return message.replyWithoutMention({ embeds: [errorEmbed("No song were played!")] });

  playSong(message.client, message.guild.id, player, song, {
    ambientNames: ambients,
    songIndex: list.findIndex((item) => item.title === song.title),
    startOffsetSeconds: startOffset,
    shouldSendEmbed: false,
  });

  return message.replyWithoutMention({ embeds: [successEmbed("Ambient removed successfully!")] });
};

module.exports = removeAmbient;
