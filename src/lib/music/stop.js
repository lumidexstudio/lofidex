const fs = require('fs');

const stop = async(connection, message) => {
    connection.disconnect();
    fs.rmSync(`temp/${message.guild.id}`, { recursive: true, force: true });
    message.client.nowplaying.delete(message.guild.id);
    
    await message.client.db.delete(`vc.${message.guild.id}`);
}

module.exports = stop;