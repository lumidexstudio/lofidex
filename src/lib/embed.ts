import { EmbedBuilder } from "discord.js";
import config from "../config";

export const errorEmbed = (message: string): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setDescription(`${config.emoji.noEntry} ` + message)
    .setColor("Red");

  return embed;
};

export const successEmbed = (message: string): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setDescription(`${config.emoji.check} ` + message)
    .setColor("Green");

  return embed;
};

export const dieEmbed = (message: string): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setDescription(`${config.emoji.skull} ` + message)
    .setColor("Red");

  return embed;
};

export const noteEmbed = (message: string): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setDescription(`${config.emoji.info} ` + message)
    .setColor("Fuchsia");

  return embed;
};

export const loadingEmbed = (message: string): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setDescription(`${config.emoji.hourglass} ` + message)
    .setColor("Fuchsia");

  return embed;
};

export const infoEmbed = (message: string): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setDescription(`${config.emoji.sparkles} ` + message)
    .setColor("Fuchsia");

  return embed;
};
