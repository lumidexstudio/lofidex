const axios = require("axios");
const config = require("../../config");

/**
 * Checks whether a user has voted for the bot on top.gg in the last 12 hours.
 * Returns false (and logs) when no token is configured or the request fails,
 * so a missing/broken integration never accidentally grants access.
 */
async function hasVoted(userId) {
  if (!config.topgg.token) {
    console.warn("[topgg] TOPGG_TOKEN is not set — vote checks always fail.");
    return false;
  }

  try {
    const { data } = await axios.get(`https://top.gg/api/bots/${config.topgg.botId}/check`, {
      params: { userId },
      headers: { Authorization: config.topgg.token },
    });

    return data?.voted === 1;
  } catch (error) {
    console.error(`[topgg] vote check failed: ${error.message}`);
    return false;
  }
}

module.exports = { hasVoted };
