const path = require("path");

module.exports = [
  {
    name: "rains",
    emoji: "🌧",
    title: "Short Rain Loop",
    source: "https://pixabay.com/sound-effects/short-rain-loop-101550/",
    defaultVolume: 0.7,
    path: path.join(__dirname, "rains.mp3"),
  },
  {
    name: "campfire",
    emoji: "🔥",
    title: "",
    source: "",
    defaultVolume: 0.7,
    path: path.join(__dirname, "campfire.ogg"),
  },

  {
    name: "birds",
    emoji: "🐦",
    title: "",
    source: "",
    defaultVolume: 0.7,
    path: path.join(__dirname, "birds.ogg"),
  },

  {
    name: "blizzard",
    emoji: "❄",
    title: "",
    source: "",
    defaultVolume: 0.7,
    path: path.join(__dirname, "blizzard.ogg"),
  },
];
