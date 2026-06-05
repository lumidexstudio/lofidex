const { successEmbed } = require("../../lib/embed");
const { playSong } = require("../audio/playbackEngine");

/**
 * Replays the song stored as the repeat target. Announces "Now repeating…" only
 * when a text channel is available (restored 24/7 sessions run silently).
 */
const loop = async (client, guildId, player, textChannel = null) => {
  let repeat = await client.db.get(`vc.${guildId}.repeat`);
  let ambients = await client.db.get(`vc.${guildId}.ambients`);

  playSong(client, guildId, player, repeat.song, {
    ambientNames: ambients ?? [],
    songIndex: repeat.song.index,
    startOffsetSeconds: 0,
    shouldSendEmbed: true,
  });

  if (textChannel) {
    return textChannel.send({ embeds: [successEmbed(`Now repeating ${repeat.song.title}`)] });
  }
};

module.exports = loop;
