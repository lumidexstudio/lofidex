import axios from "axios";
import config from "../config";

async function hasVoted(userId: string): Promise<boolean> {
  if (!config.topgg.token) {
    console.warn("[topgg] TOPGG_TOKEN is not set — vote checks always fail.");
    return false;
  }

  try {
    const { data } = await axios.get(
      `https://top.gg/api/bots/${config.topgg.botId}/check`,
      {
        params: { userId },
        headers: { Authorization: config.topgg.token },
      }
    );

    return data?.voted === 1;
  } catch (error: unknown) {
    console.error(
      `[topgg] vote check failed: ${(error as Error).message}`
    );
    return false;
  }
}

export { hasVoted };
