require('dotenv').config();

module.exports = {
    port: 3000,
    token: process.env.TOKEN,
    clientID: process.env.CLIENT_ID,
    ownerID: process.env.OWNER_ID.split(", "),
    prefix: ['ldx', 'ldx '],
}