# Building Agents with Gemini

This workshop will give you an understanding of how to build GenAI powered agents as a developer. We will go from making an API call to an LLM to implementing tools and functions that the agent can use to retrieve other information that an LLM wouldn't know by itself.

You will leave with an application that gives you a basis to experiment with more tools to see the sorts of agents you can build.

- [Prerequisites](#prerequisites)
- [The Workshop](#the-workshop)
  - [Creating a working environment](#creating-a-working-environment)
  - [Setting up environment variables](#setting-up-environment-variables)
    - [Gemini API key](#gemini-api-key)
  - [Run the application](#run-the-application)
    - [Implementing Chat with Gemini](#implementing-chat-with-gemini)
    - [Our first tool](#our-first-tool)
    - [Adding more tools](#adding-more-tools)
    - [Multi-agent systems](#multi-agent-systems)
- [Well done!](#well-done)

## Prerequisites

To take part in this workshop you will need:

- a Google account (head to https://ai.google.dev/aistudio)
- Optional, but really useful, a GitHub account

## The Workshop

We are going to create a GenAI-powered agent that can answer questions using Google search and other tools. This repo contains a command line application (CLI) through which you can interact with the bot.

### Creating a working environment

We are going to work in a GitHub Codespace to ensure we all have the same environment.

This repo is a template repo, you can use it to create a new repo with the green _Use this template_ button at the top. Click on it and choose _Create a new repository_. Create the new repo in your own account.

Once you have done that, click on the green _Code_ button, then the _Codespaces_ tab and click _Create codespace on main_. This will generate a new environment you can work in, with all the required dependencies and a version of VS Code in the browser to view and edit files.

<details>
<summary>Advanced working environment setup</summary>
If you would prefer to run this application locally, you will need Node.js v22.2.* installed.

You can then clone the repo:

```bash
git clone https://github.com/philnash/agents-with-gemini.git
```

And carry on locally.

</details>

Once you have the repo loaded in VS Code, install the dependencies by opening the terminal and running:

```bash
npm install
```

### Setting up environment variables

To keep secrets and credentials out of the repo, we use a `.env` file. In the application, copy the existing file, called `.env.example` to `.env`.

#### Gemini API key

The first secret we need is an API key to interact with Gemini models. You can get that from [Google AI Studio](https://ai.google.dev/aistudio).

Copy your key into the `.env` file as the `GEMINI_API_KEY`.

### Run the application

You should now be ready to run the app with the following script in the terminal:

```bash
npm run dev
```

You will see a greeting message from the bot, however it is not hooked up yet, so you cannot yet interact with it.

#### Implementing Chat with Gemini

Open `./src/bot.ts`. You will find some setup code to create the Gemini 2.0 Flash model and provide it with some settings. These settings are the defaults from AI Studio, you can adjust them later to see the effects.

Open `./src/index.ts` and you will find the implementation of the CLI. There is a loop that gets `userInput` from the command line. This is the input you need to pass to the model to get a response.

You will need to:

- Remove the echo to the output
- Use the `bot` object to send a message
- Retrieve the response text from the result
- Ouput the text to the user

<details>
<summary>How to complete this section</summary>

We have the `bot` object already created, so we need to send it a message using the `sendMessage` function. This returns a `Promise` that resolves to the bot response. For now we will just use the text from the response, but later we will use other parts of this response to power out agent actions.

```ts
// ./src/index.ts
try {
  const result = await bot.sendMessage(userInput);
  const response = await result.response;
  output.write(response.text());

  userInput = await readline.question("\n> ");
} catch (error) {
  // handle errors
}
```

</details>

> [!Note]
> You can checkout the branch `1-basic-bot` to get to this stage

#### Our first tool

We saw earlier that the model can't tell us the correct date today. Let's build a function that the model can use as a tool to return the correct date or time.

Open `./src/tools.ts`. You can see that this file exports two empty objects: a list of tools and list of functions.

When Gemini receives the response from a tool, it needs it in the form of an object. So write a function that returns a response that looks like `{ date: '2025-03-25T04:34:50.340Z' }`.

You also need to write a description for this tool so that the model recognises the capabilities it has and can choose to use them. In this case the function takes no arguments, so we just need a name and description.

<details>
<summary>How to complete this section</summary>

In `./src/tools.ts` create a function to return the current date and add it to the functions object.

```ts
// ./src/tools.ts
function getDate() {
  return { date: new Date().toISOString() };
}

export const functions = {
  getDate,
};
```

Then in the functionDeclarations array, enter an object describing this function:

```ts
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
```

</details>

While the bot now has access to this tool, and can choose to use them, we have no current way for it to do so.

Open up `./src/index.ts`. After you output the response from calling the model you need to check whether any functions should be called.

- Check `response.functionCalls()` to see if it exists and has any functions that need to be called
- Get the first function call from the array (we only have one tool, so for now this is fine)
- The function call is an object with `name` and `args` properties
- Use the name to find the function in the object of `functions` that has been imported from `./src/tools.ts`
- Call the function with `args`
- Now, to let the model know the answer, we need to send the results back to it.
- Make a new call to the `bot` object's `sendMessage` function passing an array of objects like this: `{ functionResponse: { name, response } }`
- Get the text from this new response and output it to the terminal

<details>
<summary>How to complete this section</summary>

This time we are handling one function call, the code should look something like this:

```ts
// ./src/index.ts
try {
  const result = await bot.sendMessage(userInput);
  const response = await result.response;
  output.write(response.text());

  const functionCalls = response.functionCalls();
  if (functionCalls && functionCalls.length > 0) {
    const { name, args } = functionCalls[0] || {};
    // @ts-expect-error - typing name and args here is a pain
    const response = await functions[name](args);
    const newResult = await bot.sendMessage([
      {
        functionResponse: {
          name,
          response,
        },
      },
    ]);
    const newResponse = await newResult.response;
    output.write(newResponse.text());
  }

  userInput = await readline.question("\n> ");
} catch (error) {
  // handle errors
}
```

</details>

Now if you ask your bot for the current date it can use the tool to find it out

> [!Note]
> You can check out the branch `2-first-tool` to bring your application up to this state.

#### Adding more tools

To add more tools we need to handle two things:

1. The model asking to use more than one tool at a time
2. The model asking to use tools on subsequent responses

So, instead of taking just the first `functionCall` we need to:

- Call all the functions that the model responds with
- Once we have responses for each function call, send them back to the bot
- Detect whether the model wants to call any more functions and loop this process
- Once the model is done, then show the user prompt again

<details>
<summary>How to complete this section</summary>

We need to turn the conditional we wrote last time into a loop that completes once the model stops asking for `functionCalls`.

```ts
// ./src/index.ts

try {
  const result = await bot.sendMessage(userInput);
  const response = await result.response;
  output.write(response.text());

  let functionCalls = response.functionCalls();

  while (functionCalls && functionCalls.length > 0) {
    const functionResponses = await Promise.all(
      functionCalls.map(async (call) => {
        const { name, args } = call;
        // @ts-expect-error - typing name and args here is a pain
        const response = await functions[name](args);
        return {
          functionResponse: {
            name,
            response,
          },
        };
      })
    );
    const newResult = await bot.sendMessage(functionResponses);
    const newResponse = await newResult.response;
    output.write(newResponse.text());
    functionCalls = newResponse.functionCalls();
  }

  userInput = await readline.question("\n> ");
} catch (error) {
  // handle errors
}
```

</details>

Now add some more tools. Simple ones make it easy to test, so I recommend some mathematical tools like addition and subtraction. This time you will need to define the arguments that the functions expect too.

Sometimes with tools it takes way more effort to describe the tool than it does to write the function itself.

<details>
<summary>Check here for those example tool descriptions and implementations</summary>

```ts
// ./src/tools.ts

export const tools: Tool[] = [
  {
    functionDeclarations: [
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

export const functions = {
  getDateAndTime,
  add,
  multiply,
};
```

</details>

Now you can ask the agent for a few things that models are pretty bad at, including maths questions and the current date.

> [!Note]
> You can checkout the branch `3-more-tools` to get to this stage

#### Multi-agent systems

I wanted to give this agent even more capability. Google provides Google Search as a built-in tool to Gemini, so this would be useful. However, you can't use other tools at the same time.

This gives us an opportunity to look at a multi-agent system. Right now we have one agent that does all the work, but we could build a system in which one agent is in charge of telling other agents what to do based on their capabilities.

We'll start this by implementing a second agent that can use Google Search as a tool, and allow the first agent to delegate search tasks to this agent.

In `./src/tools.ts` create one final tool that receives a prompt string as an argument, creates a model with access to the `googleSearch` tool, and gets the response from that model. Don't forget to create a description in the `tools` object too.

The `googleSearch` tool is a special object that you can pass to the model tools as:

```ts
tools: [{ googleSearch: {} }],
```

Since this tool is for searching, we can ensure it always uses its tool by setting the `toolConfig` function calling mode to "ANY", which means that it will always choose a tool to use.

<details>
<summary>Create the second agent</summary>

```ts
// ./src/tools.ts
export const tools: Tool[] = [
  {
    functionDeclarations: [
      // ... existing descriptions
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
```

</details>

Now you can ask the agent things that it may not know about but can find out through search.

> [!Note]
> You can check out the branch `4-multi-agent` to bring your application up to this state.

## Well done!

You now have a basic CLI agent application that you can experiment with.

To keep working on agents like this, take a look at some more documentation and tools to experiment with:

- [Langflow - build agents visually](https://www.langflow.org/)
- [The Gemini API docs](https://ai.google.dev/gemini-api/docs)
- [Function calling with Gemini](https://ai.google.dev/gemini-api/docs/function-calling)
- [Agentic RAG explained - give your agent private data](https://www.youtube.com/watch?v=MYPDsV_825U)
- [Top 3 mistakes I made while building AI agents](https://www.datastax.com/blog/top-three-mistakes-building-agents)
-
