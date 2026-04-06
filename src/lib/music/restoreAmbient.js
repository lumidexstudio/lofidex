const list = require("../../lofi");
const { createTrackResource } = require("../audio/playbackEngine");

const restoreAmbient = async (message, songIndex, options = {}) => {
  let ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);
  let song = list[songIndex];

  const { resource } = createTrackResource(message.client, message.guild.id, song, {
    ambientNames: ambients ?? [],
    songIndex,
    startOffsetSeconds: options.startOffsetSeconds ?? 0,
    shouldSendEmbed: options.shouldSendEmbed ?? true,
  });

  return resource;
};

module.exports = restoreAmbient;
