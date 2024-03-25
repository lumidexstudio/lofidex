function tS(n) {
    const s = n.toString();
    return s.length > 1 ? s : `0${s}`;
}

function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);

    return `${h > 0 ? `${tS(h)}:` : ""}${tS(m)}:${tS(s)}`;
}

module.exports = formatTime