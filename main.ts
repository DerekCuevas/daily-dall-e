import { OpenAI } from "https://deno.land/x/openai@v4.16.1/mod.ts";
import { config } from "./config.ts";
import { TrendFinder } from "./trends_finder.ts";

const TOP_TRENDS_COUNT = 5;

const trendsFinder = new TrendFinder();
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

const trends = await trendsFinder.find({ geo: "US" });
const topTrends = trends.slice(0, TOP_TRENDS_COUNT);

const imagePromptChatCompletion = await openai.chat.completions.create({
  model: config.OPENAI_MODEL,
  messages: [
    {
      role: "user",
      content:
        "You are a pop culture artist that describes artwork verbally in the style of a famous artist of your choosing.",
    },
    {
      role: "user",
      content: `Here are the ${TOP_TRENDS_COUNT} current pop culture trends for today: ${topTrends
        .map((t) => t.query)
        .join(", ")}`,
    },
    {
      role: "user",
      content: `Here are the trending news articles for context: ${topTrends
        .flatMap((t) => t.articles)
        .map((a) => a.title)
        .join(", ")}`,
    },
    {
      role: "user",
      content:
        "Create and produce a very short and concise one sentence description of a single piece of artwork that either features, highlights, or incorporates one or more of pop culture trends.",
    },
    {
      role: "user",
      content: "Avoid sports related trends as a subject.",
    },
    {
      role: "user",
      content: "Output only the description of the artwork and nothing else.",
    },
  ],
});

const imagePrompt = imagePromptChatCompletion.choices[0].message.content!;
console.log(`Generating image: ${imagePrompt}`);

if (imagePrompt.startsWith("As a language model")) {
  throw new Error(imagePrompt);
}

const image = await openai.images.generate({
  prompt: imagePrompt,
  n: 1,
  size: "1024x1024",
});
const imageURL = image.data[0].url;

console.log(`Generated: ${imageURL}`);

const date = new Date().toISOString();

const archiveFilepath = `./archive/daily-dall-e-${date}.png`;
const archiveFile = await Deno.open(archiveFilepath, {
  write: true,
  create: true,
});

if (imageURL) {
  const imageResponse = await fetch(imageURL);
  if (imageResponse.body) {
    await imageResponse.body.pipeTo(archiveFile.writable);
  }
}

await Deno.writeTextFile(
  `./data/daily-dall-e-${date}.json`,
  JSON.stringify({ topTrends, imagePrompt, imageURL, archiveFilepath }, null, 2)
);

const outputFile = "./README.md";
const contents = await Deno.readTextFile(outputFile);

const readmeContents = `
## ${date.substring(0, 10)}

![Daily Dall-E](${archiveFilepath})

> ${imagePrompt}

${topTrends.map((t) => `1. ${t.query}`).join("\n")}
`;

await Deno.writeTextFile(outputFile, [readmeContents, contents].join("---\n"));
console.log("Complete.");
