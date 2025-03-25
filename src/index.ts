import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { getConfig, parseConfig, Config } from "./config.js";
import { usage } from "./docs.js";
import { welcomeMessage } from "./prompts.js";
import { createBot } from "./bot.js";
import { functions } from "./tools.js";

export async function main(args: string[]) {
  if (args.includes("--help") || args.includes("-h") || args.includes("help")) {
    console.error(usage);
    return;
  }

  const { values } = parseArgs(parseConfig(args));

  let config: Config;
  try {
    config = getConfig(values);
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message + "\n");

      console.error(usage);
    }
    return;
  }
  const bot = createBot(config);

  const readline = createInterface({ input, output });

  let userInput = await readline.question(`${welcomeMessage}\n\n> `);

  while (userInput.toLowerCase() !== ".exit") {
    if (userInput.trim() === "") {
      userInput = await readline.question("> ");
      continue;
    }
    try {
      const result = await bot.sendMessage(userInput);
      const response = await result.response;
      output.write(response.text());

      userInput = await readline.question("\n> ");
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      } else {
        console.error(error);
      }
      userInput = await readline.question(
        "\nSomething went wrong, try asking again\n\n> "
      );
    }
  }

  readline.close();
}
