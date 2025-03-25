import { Tool, SchemaType, FunctionCallingMode } from "@google/generative-ai";
import { genAI } from "./bot.js";

export const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "getDate",
        description: "Get the current date",
      },
    ],
  },
];

function getDate() {
  return { date: new Date().toISOString() };
}

export const functions = {
  getDate,
};
