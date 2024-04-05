const path = require("path");

module.exports = {
  rains: [
    {
      name: 'rains',
      emoji: "🌧",
      title: "Short Rain Loop",
      source: "https://pixabay.com/sound-effects/short-rain-loop-101550/",
      defaultVolume: 0.7,
      path: path.join(__dirname, "rains.mp3"),
    },
  ],
  campfire: [
    {
      name: 'campfire',
      emoji: "🔥",
      title: "",
      source: "",
      defaultVolume: 0.7,
      path: path.join(__dirname, "campfire.ogg"),
    },
  ],
  birds: [
    {
      name: 'birds',
      emoji: "🐦",
      title: "",
      source: "",
      defaultVolume: 0.7,
      path: path.join(__dirname, "birds.ogg"),
    },
  ],
  blizzard: [
    {
      name: 'blizzard',
      emoji: "❄",
      title: "",
      source: "",
      defaultVolume: 0.7,
      path: path.join(__dirname, "blizzard.ogg"),
    },
  ],
};
