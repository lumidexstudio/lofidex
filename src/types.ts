import type {
  Client,
  Collection,
  Message,
  VoiceBasedChannel,
  TextBasedChannel,
} from "discord.js";
import type { ChildProcessWithoutNullStreams } from "node:child_process";
import type SimpleJsonDb from "./lib/SimpleJsonDb";

export interface Config {
  port: number;
  token: string;
  clientID: string;
  ownerID: string[];
  prefix: string[];
  hasteServer: string;
  supportServer: string;
  activity: { name: string; type: number };
  topgg: { token: string; botId: string; voteUrl: string };
  voice: { emptyLeaveMs: number };
  reportTo: { guild: string; channel: string };
  errorTo: { guild: string; channel: string };
  emoji: {
    noEntry: string;
    check: string;
    skull: string;
    info: string;
    hourglass: string;
    sparkles: string;
  };
}

export interface AmbientItem {
  name: string;
  emoji: string;
  title: string;
  source: string;
  defaultVolume: number;
  category: string;
  path: string;
}

export interface LofiSong {
  id: number;
  title: string;
  author: string;
  source: string;
  cover: string;
  path: string;
}

export interface GuildSession {
  channel?: string;
  master?: string;
  ambients?: string[];
  ambientOnly?: boolean;
  stay247?: boolean;
  repeat?: {
    state: boolean;
    song: Record<string, unknown> | null;
  };
  now?: number;
}

export interface MixerOptions {
  songPath?: string;
  songVolume?: number;
  startOffsetSeconds?: number;
  ambients?: AmbientLayer[];
}

export interface AmbientLayer {
  name?: string;
  path: string;
  volume: number;
}

export interface PlaybackOptions {
  startOffsetSeconds?: number;
  ambientNames?: string[];
  songIndex?: number;
  shouldSendEmbed?: boolean;
  songVolume?: number;
}

export interface MixerSession {
  process: ChildProcessWithoutNullStreams;
  startOffsetSeconds: number;
  songIndex: number | null;
  ambientOnly?: boolean;
}

export interface PrefixCommandData {
  name: string;
  description?: string;
  aliases?: string[];
  cooldown?: number;
  category: string;
  args?: string[];
  execute: (message: Message, args: string[]) => unknown;
}

export interface MessageWithReply extends Message {
  used?: { prefix: string; command: string };
  replyWithoutMention?: (options: {
    content?: string;
    embeds?: unknown[];
    components?: unknown[];
    allowedMentions?: { repliedUser: boolean };
  }) => ReturnType<Message["reply"]>;
}

declare module "discord.js" {
  interface Client {
    config: Config;
    slash: Collection<string, unknown>;
    prefixes: Collection<string, unknown>;
    cooldowns: Collection<string, Collection<string, number>>;
    db: SimpleJsonDb;
    ffmpeg: typeof import("fluent-ffmpeg").FfmpegCommand;
    nowplaying: Collection<string, unknown>;
    addAmbient: Collection<string, unknown>;
    removeAmbient: Collection<string, unknown>;
    volume: Collection<string, unknown>;
    mixerSessions: Map<string, MixerSession>;
    leaveTimers: Map<string, NodeJS.Timeout>;
  }
}
