import { OpenAI } from "https://deno.land/x/openai@v4.16.1/mod.ts";
import { config } from "./config.ts";
import { TrendFinder } from "./trends_finder.ts";

const TOP_TRENDS_COUNT = 10;
const LAST_POST_COUNT = 10;
const DATA_DIR = "./data";

const trendsFinder = new TrendFinder();
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

const trends = await trendsFinder.find({ geo: "US" });
const topTrends = trends.slice(0, TOP_TRENDS_COUNT);

const previousPosts = [];
for await (const post of await Deno.readDir(DATA_DIR)) {
  if (!post.isFile) continue;

  const path = `${DATA_DIR}/${post.name}`;
  const file = await Deno.stat(path);
  const createdAt = file.birthtime;

  if (createdAt === null) throw new Error("No birthtime");

  previousPosts.push({ path, createdAt });
}

previousPosts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

const previousImagePrompts = [];
for await (const { path } of previousPosts.slice(0, LAST_POST_COUNT)) {
  const contents = await Deno.readTextFile(path);
  previousImagePrompts.push(JSON.parse(contents).imagePrompt);
}

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
      content: "Do not feature sports or sports related topics.",
    },
    {
      role: "user",
      // OpenAI's safety system will reject these prompts
      content: "Do not feature famous female celebrities as a subject.",
    },
    {
      role: "user",
      content: "Output only the description of the artwork and nothing else.",
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
      content: `Here are your last ${LAST_POST_COUNT} art pieces: ${previousImagePrompts.join(
        ", "
      )}`,
    },
    {
      role: "user",
      content:
        "In the style of a new famous artist of your choosing, create and produce a new and concise one sentence description of a single piece of artwork that features one of the pop culture trends.",
    },
  ],
});

const imagePrompt = imagePromptChatCompletion.choices[0].message.content!;
console.log(`Generating image: ${imagePrompt}`);

if (imagePrompt.includes("language model")) {
  throw new Error(imagePrompt);
}

const image = await openai.images.generate({
  model: "dall-e-3",
  prompt: imagePrompt,
  n: 1,
  size: "1792x1024",
  quality: "hd",
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
