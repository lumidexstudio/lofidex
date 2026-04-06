const fs = require('fs');
const { destroyGuildMixer } = require("../audio/playbackEngine");

const stop = async(connection, message) => {
    destroyGuildMixer(message.client, message.guild.id);
    connection.disconnect();
    fs.rmSync(`temp/${message.guild.id}`, { recursive: true, force: true });
    message.client.nowplaying.delete(message.guild.id);
    
    await message.client.db.delete(`vc.${message.guild.id}`);
}

module.exports = stop;
