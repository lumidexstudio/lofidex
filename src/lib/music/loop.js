const { createAudioPlayer } = require("@discordjs/voice");
const { createAudioResource } = require("@discordjs/voice");
const { successEmbed } = require("../../lib/embed");
const list = require("../../lofi");

const loop = async (message, player) => {
  let repeat = await message.client.db.get(`vc.${message.guild.id}.repeat`);

  const res = createAudioResource(repeat.path, {
    metadata: {
      ...repeat.song,
      shouldSendEmbed: true,
      index: list.findIndex((item) => item.title == repeat.song.title),
    },
    inlineVolume: true,
  });


  player.play(res);
  return message.replyWithoutMention({ embeds: [successEmbed(`Now repeating ${repeat.song.title}`)] });
};

module.exports = loop;
