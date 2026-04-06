const { successEmbed } = require("../../lib/embed");
const { playSong } = require("../audio/playbackEngine");

const loop = async (message, player) => {
  let repeat = await message.client.db.get(`vc.${message.guild.id}.repeat`);
  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);

  playSong(message.client, message.guild.id, player, repeat.song, {
    ambientNames: ambients ?? [],
    songIndex: repeat.song.index,
    startOffsetSeconds: 0,
    shouldSendEmbed: true,
  });

  return message.replyWithoutMention({ embeds: [successEmbed(`Now repeating ${repeat.song.title}`)] });
};

module.exports = loop;
