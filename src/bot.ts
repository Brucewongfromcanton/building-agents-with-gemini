import { GoogleGenerativeAI, Part } from "@google/generative-ai";
import { Config } from "./config.js";
import { tools } from "./tools.js";
import { systemPrompt } from "./prompts.js";

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

export let genAI: GoogleGenerativeAI;

export function createBot(config: Config) {
  genAI = new GoogleGenerativeAI(config.geminiApiKey);

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    tools: [...tools],
  });

  const chat = model.startChat({
    generationConfig,
    systemInstruction: { role: "system", parts: [{ text: systemPrompt }] },
  });

  return {
    async sendMessage(input: string | Part[]) {
      return chat.sendMessage(input);
    },

    async sendMessageStream(input: string) {
      return chat.sendMessageStream(input);
    },
  };
}
