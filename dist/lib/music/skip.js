"use strict";
const playbackEngine_1 = require("../audio/playbackEngine");
async function skipMusic(message, player, shouldSendEmbed = true) {
    const guildData = (await message.client.db.get(`vc.${message.guild.id}`));
    if (guildData?.ambientOnly) {
        const { errorEmbed } = require("../embed");
        await message.replyWithoutMention({
            embeds: [errorEmbed("Cannot skip in ambient-only mode.")],
        });
        return;
    }
    const list = require("../../lofi");
    const now = await message.client.db.get(`vc.${message.guild.id}.now`);
    let song;
    let nextIndex;
    if (now != null && now + 1 < list.length) {
        song = list[now + 1];
        nextIndex = now + 1;
        await message.client.db.set(`vc.${message.guild.id}.now`, now + 1);
    }
    else {
        song = list[0];
        nextIndex = 0;
        await message.client.db.set(`vc.${message.guild.id}.now`, 0);
    }
    const ambients = await message.client.db.get(`vc.${message.guild.id}.ambients`);
    (0, playbackEngine_1.playSong)(message.client, message.guild.id, player, song, {
        ambientNames: ambients ?? [],
        songIndex: nextIndex,
        startOffsetSeconds: 0,
        shouldSendEmbed,
    });
}
module.exports = skipMusic;
//# sourceMappingURL=skip.js.map