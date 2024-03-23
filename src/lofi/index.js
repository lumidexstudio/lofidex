const path = require('path');

module.exports = [
    {
        id: 1, // tidak terlalu digunakan mungkin? gunakan index ajah
        title: "Chill Lofi Hiphop - ‘Kimochi’",
        author: 'FrKA2',
        source: 'https://soundcloud.com/nocopyrightlofi/lofaki',
        path: path.join(__dirname, '1.mp3')
    },
    { 
        id: 2,
        title: "Chill Lofi Hiphop - ‘Tears’",
        author: 'Envy',
        source: 'https://soundcloud.com/nocopyrightlofi/no-copyright-chill-lofi-3',
        path: path.join(__dirname, '2.mp3')
    }
]