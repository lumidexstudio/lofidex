import type { VoiceConnection } from "@discordjs/voice";
import type { Message } from "discord.js";
import leaveVoice from "../voice/leaveVoice";

const stop = async (
  _connection: VoiceConnection,
  message: Message
): Promise<void> => {
  await leaveVoice(message.client, message.guild!.id);
};

export = stop;
