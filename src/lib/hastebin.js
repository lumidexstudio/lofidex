const config = require("../../config");
const axios = require('axios')

async function hastebin(text) {
    const result = await axios(config.hasteServer + '/documents', {
        method: 'POST',
        data: text
    });

    return `${config.hasteServer}/${result.data.key}`;
}

module.exports = hastebin;