import type { Message } from "discord.js";

const stopCollector = async (
  collector: unknown
): Promise<void> => {
  const c = collector as { ended?: boolean; stop?: () => void } | undefined;
  if (c && c.ended === false && typeof c.stop === "function") {
    c.stop();
  }
};

const stopAllCollectors = async (message: Message): Promise<void> => {
  const collectors = {
    add: message.client.addAmbient.get(message.guild?.id ?? ""),
    remove: message.client.removeAmbient.get(message.guild?.id ?? ""),
    np: message.client.nowplaying.get(message.guild?.id ?? ""),
    volume: message.client.volume.get(message.guild?.id ?? ""),
  };

  const stopPromises = Object.values(collectors).map(stopCollector);
  await Promise.all(stopPromises);
};

export = stopAllCollectors;
