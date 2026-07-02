"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const walk_1 = __importDefault(require("../lib/walk"));
const AUDIO_EXTENSIONS = new Set([
    ".mp3",
    ".ogg",
    ".wav",
    ".flac",
    ".m4a",
    ".aac",
]);
const CATEGORY_EMOJIS = {
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
const OVERRIDES = {
    [node_path_1.default.join("rain", "rains.mp3")]: {
        name: "rains",
        emoji: "\uD83C\uDF27\uFE0F",
        title: "Short Rain Loop",
        source: "https://pixabay.com/sound-effects/short-rain-loop-101550/",
        defaultVolume: 0.7,
    },
    [node_path_1.default.join("nature", "blizzard.ogg")]: {
        name: "blizzard",
        emoji: "\u2744\uFE0F",
        defaultVolume: 0.7,
    },
    [node_path_1.default.join("things", "alarm.mp3")]: {
        name: "alarm",
        emoji: "\u23F0",
        defaultVolume: 0.7,
    },
    [node_path_1.default.join("noise", "silence.wav")]: {
        name: "silence",
        emoji: "\uD83D\uDD07",
        defaultVolume: 1.0,
    },
    [node_path_1.default.join("urban", "siren.wav")]: {
        name: "siren",
        emoji: "\uD83D\uDEA8",
        title: "Siren Noise FX",
        source: "https://samplefocus.com/samples/siren-noise-fx",
        defaultVolume: 0.7,
    },
    [node_path_1.default.join("things", "vinyl-crackle.wav")]: {
        name: "vinyl-crackle",
        emoji: "\uD83D\uDCBF",
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
    const relativePath = node_path_1.default.relative(__dirname, filePath);
    const override = OVERRIDES[relativePath] ?? {};
    const normalizedRelative = relativePath.replace(node_path_1.default.extname(relativePath), "");
    const relativeParts = normalizedRelative.split(node_path_1.default.sep);
    const fileStem = relativeParts[relativeParts.length - 1];
    const category = relativeParts.length > 1 ? relativeParts[0] : "root";
    return {
        name: override.name ?? normalizedRelative.split(node_path_1.default.sep).join("-"),
        emoji: override.emoji ?? CATEGORY_EMOJIS[category] ?? "\uD83C\uDFB5",
        title: override.title ?? startCase(fileStem),
        source: override.source ?? "",
        defaultVolume: override.defaultVolume ?? 0.4,
        category,
        path: filePath,
    };
}
const items = [];
(0, walk_1.default)(__dirname, (filePath) => {
    if (!node_fs_1.default.statSync(filePath).isFile()) {
        return;
    }
    if (!AUDIO_EXTENSIONS.has(node_path_1.default.extname(filePath).toLowerCase())) {
        return;
    }
    items.push(buildAmbientItem(filePath));
});
items.sort((left, right) => left.name.localeCompare(right.name));
module.exports = items;
//# sourceMappingURL=index.js.map