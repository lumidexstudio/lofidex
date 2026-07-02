import config from "../config";
import axios from "axios";

async function hastebin(text: string): Promise<string> {
  const result = await axios(config.hasteServer + "/documents", {
    method: "POST",
    data: text,
  });

  return `${config.hasteServer}/${result.data.key}`;
}

export = hastebin;
