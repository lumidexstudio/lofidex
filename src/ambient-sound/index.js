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
    defaultVolume: 1.7,
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
  {
    name: "siren",
    emoji: "🚨",
    title: "Siren Noise FX",
    source: "https://samplefocus.com/samples/siren-noise-fx",
    defaultVolume: 0.7,
    path: path.join(__dirname, "siren.wav"),
  },
  {
    name: "vinyl-crackle",
    emoji: "💿",
    title: "Lo-Fi Vinyl Crackle",
    source: "https://samplefocus.com/samples/lo-fi-vinyl-crackle",
    defaultVolume: 0.7,
    path: path.join(__dirname, "vinyl-crackle.wav"),
  },
  {
    name: "waves",
    emoji: "🌊",
    title: "Lo-Fi Soft Beach Waves",
    source: "https://pixabay.com/sound-effects/sandy-beach-calm-waves-water-nature-sounds-8052/",
    defaultVolume: 0.7,
    path: path.join(__dirname, "waves.mp3"),
  },
];
