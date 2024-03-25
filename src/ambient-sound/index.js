const path = require("path");

module.exports = {
  rains: [
    {
      name: 'rains',
      emoji: "🌧",
      title: "Short Rain Loop",
      source: "https://pixabay.com/sound-effects/short-rain-loop-101550/",
      path: path.join(__dirname, "rains.mp3"),
    },
  ],
  campfire: [
    {
      name: 'campfire',
      emoji: "🔥",
      title: "Burning Fire Loop 1",
      source: "https://pixabay.com/sound-effects/burning-fire-loop-1-188211/",
      path: path.join(__dirname, "campfire.mp3"),
    },
  ],
};
