"use strict";
const stopCollector = async (collector) => {
    const c = collector;
    if (c && c.ended === false && typeof c.stop === "function") {
        c.stop();
    }
};
const stopAllCollectors = async (message) => {
    const collectors = {
        add: message.client.addAmbient.get(message.guild?.id ?? ""),
        remove: message.client.removeAmbient.get(message.guild?.id ?? ""),
        np: message.client.nowplaying.get(message.guild?.id ?? ""),
        volume: message.client.volume.get(message.guild?.id ?? ""),
    };
    const stopPromises = Object.values(collectors).map(stopCollector);
    await Promise.all(stopPromises);
};
module.exports = stopAllCollectors;
//# sourceMappingURL=stopAllCollectors.js.map