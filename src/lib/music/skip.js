const { createAudioResource } = require("@discordjs/voice");

async function skipMusic(message, player, shouldSendEmbed = true) {
  let list = require("../../lofi");
  let now = await message.client.db.get(`vc.${message.guild.id}.now`);

  let song = list[now + 1];

  if (!song) {
    song = list[0];
    await message.client.db.set(`vc.${message.guild.id}.now`, 0);
  } else {
    await message.client.db.set(`vc.${message.guild.id}.now`, now + 1);
  }

  const res = createAudioResource(song.path, {
    metadata: {
      ...song,
      shouldSendEmbed,
      index: list.findIndex((item) => item.title == song.title),
    },
    inlineVolume: true,
  });

  player.play(res);
}

module.exports = skipMusic;
