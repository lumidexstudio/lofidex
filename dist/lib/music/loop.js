"use strict";
const embed_1 = require("../embed");
const playbackEngine_1 = require("../audio/playbackEngine");
const loop = async (client, guildId, player, textChannel = null) => {
    const repeat = (await client.db.get(`vc.${guildId}.repeat`));
    const ambients = await client.db.get(`vc.${guildId}.ambients`);
    (0, playbackEngine_1.playSong)(client, guildId, player, repeat.song, {
        ambientNames: ambients ?? [],
        songIndex: repeat.song.index,
        startOffsetSeconds: 0,
        shouldSendEmbed: true,
    });
    if (textChannel && "send" in textChannel) {
        await textChannel.send({
            embeds: [(0, embed_1.successEmbed)(`Now repeating ${repeat.song.title}`)],
        });
    }
};
module.exports = loop;
//# sourceMappingURL=loop.js.map