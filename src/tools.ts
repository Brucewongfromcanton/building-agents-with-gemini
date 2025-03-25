import { Tool, SchemaType, FunctionCallingMode } from "@google/generative-ai";
import { genAI } from "./bot.js";

export const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "getDate",
        description: "Get the current date",
      },
      {
        name: "add",
        description:
          "Add two numbers together. Use this for accurate addition.",
        parameters: {
          type: SchemaType.OBJECT,
          description: "The numbers to add together",
          required: ["a", "b"],
          properties: {
            a: {
              type: SchemaType.NUMBER,
              description: "The first number",
            },
            b: {
              type: SchemaType.NUMBER,
              description: "The second number",
            },
          },
        },
      },
      {
        name: "multiply",
        description:
          "Multiply two numbers together. Use this for accurate multiplication.",
        parameters: {
          type: SchemaType.OBJECT,
          description: "The numbers to multiply together",
          required: ["a", "b"],
          properties: {
            a: {
              type: SchemaType.NUMBER,
              description: "The first number",
            },
            b: {
              type: SchemaType.NUMBER,
              description: "The second number",
            },
          },
        },
      },
      {
        name: "callSearchAgent",
        description:
          "Perform a web search to retrieve information that you don't know or that you think will take part in the future.",
        parameters: {
          type: SchemaType.OBJECT,
          description: "Query the web with these properties.",
          required: ["prompt"],
          properties: {
            prompt: {
              type: SchemaType.STRING,
              description: "The search query",
            },
          },
        },
      },
    ],
  },
];

function getDate() {
  return { date: new Date().toISOString() };
}

function add({ a, b }: { a: number; b: number }) {
  return { additionResult: a + b };
}

function multiply({ a, b }: { a: number; b: number }) {
  return { multiplicationResult: a * b };
}

async function callSearchAgent({ prompt }: { prompt: string }) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // @ts-expect-error The latest google search tool isn't typed properly yet.
    tools: [{ googleSearch: {} }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingMode.ANY,
      },
    },
  });

  const result = await model.generateContent(prompt);
  return { searchResults: result.response.text() };
}

export const functions = {
  add,
  multiply,
  getDate,
  callSearchAgent,
};
