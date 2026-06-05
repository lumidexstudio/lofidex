const leaveVoice = require("../voice/leaveVoice");

// Kept the (connection, message) signature for existing callers (stop command,
// nowplaying buttons); the actual teardown lives in leaveVoice.
const stop = async (connection, message) => {
  await leaveVoice(message.client, message.guild.id);
};

module.exports = stop;
