const fs = require("node:fs");
const path = require("node:path");
const walk = require("../lib/walk");

const AUDIO_EXTENSIONS = new Set([".mp3", ".ogg", ".wav", ".flac", ".m4a", ".aac"]);
const CATEGORY_EMOJIS = {
  animals: "🐾",
  binaural: "🧠",
  nature: "🌿",
  noise: "📻",
  places: "🏙️",
  rain: "🌧️",
  things: "🎛️",
  transport: "🚆",
  urban: "🚦",
};

const OVERRIDES = {
  [path.join("rain", "rains.mp3")]: {
    name: "rains",
    emoji: "🌧️",
    title: "Short Rain Loop",
    source: "https://pixabay.com/sound-effects/short-rain-loop-101550/",
    defaultVolume: 0.7,
  },
  [path.join("nature", "blizzard.ogg")]: {
    name: "blizzard",
    emoji: "❄️",
    defaultVolume: 0.7,
  },
  [path.join("things", "alarm.mp3")]: {
    name: "alarm",
    emoji: "⏰",
    defaultVolume: 0.7,
  },
  [path.join("noise", "silence.wav")]: {
    name: "silence",
    emoji: "🔇",
    defaultVolume: 1.0,
  },
  [path.join("urban", "siren.wav")]: {
    name: "siren",
    emoji: "🚨",
    title: "Siren Noise FX",
    source: "https://samplefocus.com/samples/siren-noise-fx",
    defaultVolume: 0.7,
  },
  [path.join("things", "vinyl-crackle.wav")]: {
    name: "vinyl-crackle",
    emoji: "💿",
    title: "Lo-Fi Vinyl Crackle",
    source: "https://samplefocus.com/samples/lo-fi-vinyl-crackle",
    defaultVolume: 0.7,
  },
};

function startCase(input) {
  return input
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildAmbientItem(filePath) {
  const relativePath = path.relative(__dirname, filePath);
  const override = OVERRIDES[relativePath] ?? {};
  const normalizedRelative = relativePath.replace(path.extname(relativePath), "");
  const relativeParts = normalizedRelative.split(path.sep);
  const fileStem = relativeParts[relativeParts.length - 1];
  const category = relativeParts.length > 1 ? relativeParts[0] : "root";

  return {
    name: override.name ?? normalizedRelative.split(path.sep).join("-"),
    emoji: override.emoji ?? CATEGORY_EMOJIS[category] ?? "🎵",
    title: override.title ?? startCase(fileStem),
    source: override.source ?? "",
    defaultVolume: override.defaultVolume ?? 0.4,
    category,
    path: filePath,
  };
}

const items = [];

walk(__dirname, (filePath) => {
  if (!fs.statSync(filePath).isFile()) {
    return;
  }

  if (!AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
    return;
  }

  items.push(buildAmbientItem(filePath));
});

items.sort((left, right) => left.name.localeCompare(right.name));

module.exports = items;
