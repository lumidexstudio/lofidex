const { playSong } = require("../audio/playbackEngine");

async function skipMusic(message, player, shouldSendEmbed = true) {
  let guildData = await message.client.db.get(`vc.${message.guild.id}`);
  if (guildData?.ambientOnly) {
    const { errorEmbed } = require("../embed");
    return message.replyWithoutMention({ embeds: [errorEmbed("Cannot skip in ambient-only mode.")] });
  }

  let list = require("../../lofi");
  let now = await message.client.db.get(`vc.${message.guild.id}.now`);

  let song = list[now + 1];

  if (!song) {
    song = list[0];
    await message.client.db.set(`vc.${message.guild.id}.now`, 0);
  } else {
    await message.client.db.set(`vc.${message.guild.id}.now`, now + 1);
  }

  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);

  playSong(message.client, message.guild.id, player, song, {
    ambientNames: ambients ?? [],
    songIndex: list.findIndex((item) => item.title === song.title),
    startOffsetSeconds: 0,
    shouldSendEmbed,
  });
}

module.exports = skipMusic;
