import { env } from "node:process";
import type { ParseArgsConfig } from "node:util";

interface Options {
  "gemini-api-key"?: string;
}

export interface Config {
  geminiApiKey: string;
}

export function parseConfig(args: string[]): ParseArgsConfig {
  return {
    args,
    options: {
      "gemini-api-key": {
        type: "string",
      },
    },
  };
}

function isOptions(options: Partial<Config>): options is Config {
  return typeof options.geminiApiKey === "string";
}

export function getConfig(options: Options): Config {
  const config: Partial<Config> = {
    geminiApiKey: options["gemini-api-key"] ?? env["GEMINI_API_KEY"],
  };

  if (!isOptions(config)) {
    const errors: string[] = [];
    Object.entries(config).forEach(([key, value]) => {
      if (typeof value !== "string") {
        errors.push(key);
      }
    });

    throw new Error(`Missing configuration values: ${errors.join(", ")}`);
  }

  return config;
}
