import { Tool, SchemaType, FunctionCallingMode } from "@google/generative-ai";
import { genAI } from "./bot.js";
// ./src/tools.ts

export const tools: Tool[] = [
    {
      functionDeclarations: [
        {
            name: "callSearchAgent",
            description: "Call the search agent",
            parameters: {
              type: SchemaType.OBJECT,
                description: "The prompt to call the search agent with",
                required: ["prompt"],
                properties: {
                  prompt: {
                    type: SchemaType.STRING,
                    description: "The prompt to call the search agent with",
                  },
                },
            },
        },
        {
          name: "getDateAndTime",
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
      ],
    },
  ];
  
  function getDateAndTime() {
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
    return { searchResults: result };
 }


  export const functions = {
    getDateAndTime,
    add,
    multiply,
    callSearchAgent,
  };