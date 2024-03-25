function humanizeTime(sec) {
    const ms = sec * 1000;
    const milliseconds = parseInt(ms, 10);
    const d = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
    const h = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
    const m = Math.floor((milliseconds / (1000 * 60)) % 60);
    const s = Math.floor((milliseconds / 1000) % 60);

    return `${(d ? (d + ' Days ') : '')}${(h ? (h + ' Hour ') : '')}${(m ? m : '0')} Minutes ${(s ? s: '0')} Seconds`; 
}

module.exports = humanizeTime;