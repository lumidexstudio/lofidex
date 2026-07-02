import fs from "node:fs";
import path from "node:path";
import walk from "../lib/walk";
import type { AmbientItem } from "../types";

const AUDIO_EXTENSIONS = new Set([
  ".mp3",
  ".ogg",
  ".wav",
  ".flac",
  ".m4a",
  ".aac",
]);

const CATEGORY_EMOJIS: Record<string, string> = {
  animals: "\uD83D\uDC3E",
  binaural: "\uD83E\uDDE0",
  nature: "\uD83C\uDF3F",
  noise: "\uD83D\uDCFB",
  places: "\uD83C\uDFD9\uFE0F",
  rain: "\uD83C\uDF27\uFE0F",
  things: "\uD83C\uDF9B\uFE0F",
  transport: "\uD83D\uDE86",
  urban: "\uD83D\uDEA6",
};

interface Override {
  name?: string;
  emoji?: string;
  title?: string;
  source?: string;
  defaultVolume?: number;
}

const OVERRIDES: Record<string, Override> = {
  [path.join("rain", "rains.mp3")]: {
    name: "rains",
    emoji: "\uD83C\uDF27\uFE0F",
    title: "Short Rain Loop",
    source: "https://pixabay.com/sound-effects/short-rain-loop-101550/",
    defaultVolume: 0.7,
  },
  [path.join("nature", "blizzard.ogg")]: {
    name: "blizzard",
    emoji: "\u2744\uFE0F",
    defaultVolume: 0.7,
  },
  [path.join("things", "alarm.mp3")]: {
    name: "alarm",
    emoji: "\u23F0",
    defaultVolume: 0.7,
  },
  [path.join("noise", "silence.wav")]: {
    name: "silence",
    emoji: "\uD83D\uDD07",
    defaultVolume: 1.0,
  },
  [path.join("urban", "siren.wav")]: {
    name: "siren",
    emoji: "\uD83D\uDEA8",
    title: "Siren Noise FX",
    source: "https://samplefocus.com/samples/siren-noise-fx",
    defaultVolume: 0.7,
  },
  [path.join("things", "vinyl-crackle.wav")]: {
    name: "vinyl-crackle",
    emoji: "\uD83D\uDCBF",
    title: "Lo-Fi Vinyl Crackle",
    source: "https://samplefocus.com/samples/lo-fi-vinyl-crackle",
    defaultVolume: 0.7,
  },
};

function startCase(input: string): string {
  return input
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildAmbientItem(filePath: string): AmbientItem {
  const relativePath = path.relative(__dirname, filePath);
  const override = OVERRIDES[relativePath] ?? {};
  const normalizedRelative = relativePath.replace(
    path.extname(relativePath),
    ""
  );
  const relativeParts = normalizedRelative.split(path.sep);
  const fileStem = relativeParts[relativeParts.length - 1];
  const category = relativeParts.length > 1 ? relativeParts[0] : "root";

  return {
    name:
      override.name ?? normalizedRelative.split(path.sep).join("-"),
    emoji: override.emoji ?? CATEGORY_EMOJIS[category] ?? "\uD83C\uDFB5",
    title: override.title ?? startCase(fileStem),
    source: override.source ?? "",
    defaultVolume: override.defaultVolume ?? 0.4,
    category,
    path: filePath,
  };
}

const items: AmbientItem[] = [];

walk(__dirname, (filePath: string) => {
  if (!fs.statSync(filePath).isFile()) {
    return;
  }

  if (!AUDIO_EXTENSIONS.has(path.extname(filePath).toLowerCase())) {
    return;
  }

  items.push(buildAmbientItem(filePath));
});

items.sort((left, right) => left.name.localeCompare(right.name));

export = items;
