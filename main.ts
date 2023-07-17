import { OpenAI } from "https://deno.land/x/openai/mod.ts";
import { config } from "./config.ts";
import { TrendFinder } from "./trends_finder.ts";

const trendsFinder = new TrendFinder();
const openai = new OpenAI(config.OPENAI_API_KEY);

const trends = await trendsFinder.find({ geo: "US" });
const topThree = trends.slice(0, 3).map((t) => t.query);

const imagePromptChatCompletion = await openai.createChatCompletion({
  model: config.OPENAI_MODEL,
  messages: [
    {
      role: "user",
      content:
        "You are a pop culture artist that describes artwork verbally in the style of a famous artist of your choosing.",
    },
    {
      role: "user",
      content: `Here are 3 current pop culture trends: ${topThree.join(", ")}`,
    },
    {
      role: "user",
      content:
        "Create and produce a concise one sentence description of a single piece of artwork that either features, highlights, or incorporates the pop culture trends.",
    },
  ],
});

const imagePrompt = imagePromptChatCompletion.choices[0].message.content!;
console.log(`Generating image: ${imagePrompt}`);

if (imagePrompt.startsWith("As a language model")) {
  throw new Error(imagePrompt);
}

const image = await openai.createImage({
  prompt: imagePrompt,
  n: 1,
  size: "1024x1024",
});
const imageURL = image.data[0].url;

console.log(`Generated: ${imageURL}`);

await Deno.writeTextFile(
  `./data/daily-dall-e-${new Date().toISOString()}.json`,
  JSON.stringify({ topThree, imagePrompt, imageURL }, null, 2)
);

const archiveFilepath = `./archive/daily-dall-e-${new Date().toISOString()}.png`;
const archiveFile = await Deno.open(archiveFilepath, {
  write: true,
  create: true,
});

const imageResponse = await fetch(imageURL);
if (imageResponse.body) {
  await imageResponse.body.pipeTo(archiveFile.writable);
}

const readmeContents = `
# Daily Dall-E

![Daily Dall-E](${archiveFilepath})

> ${imagePrompt}

${topThree.map((t) => `1. ${t}`).join("\n")}
`;

await Deno.writeTextFile("./README.md", readmeContents);
console.log("Complete.");
