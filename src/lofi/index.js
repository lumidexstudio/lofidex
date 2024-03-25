const path = require('path');

module.exports = [
    {
        id: 1, // tidak terlalu digunakan mungkin? gunakan index ajah
        title: "Lazy Day",
        author: "Lofi Velvet",
        source: "https://soundcloud.com/lofivelvet/lazy-day",
        cover: "https://i1.sndcdn.com/artworks-0Hu58R3AY8YiIJ14-ixjYbA-t500x500.jpg",
        path: path.join(__dirname, '1.mp3')
    },
    { 
        id: 2,
        title: "Tears",
        author: "Envy",
        source: "https://soundcloud.com/nocopyrightlofi/no-copyright-chill-lofi-3",
        cover: "https://i1.sndcdn.com/artworks-aPHISzywKs08J2iv-JKUrOg-t500x500.jpg",
        path: path.join(__dirname, '2.mp3')
    },
    {
        id: 3,
        title: "Pearlescent",
        author: "Matxete prod.",
        source: "https://soundcloud.com/nocopyrightlofi/no-copyright-chill-lofi-hiphop-purlecent-by-matxete-prod",
        cover: "https://i1.sndcdn.com/artworks-000532101198-sgbgsr-t500x500.jpg",
        path: path.join(__dirname, '3.mp3')
    }
]