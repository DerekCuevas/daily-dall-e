import { OpenAI } from "https://deno.land/x/openai@v4.16.1/mod.ts";
import { config } from "./config.ts";
import { TrendFinder } from "./trends_finder.ts";
import { InstagramClient } from "./instagram_client.ts";

const TOP_TRENDS_COUNT = 5;

const trendsFinder = new TrendFinder();
const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY });

const instagramClient = new InstagramClient({
  username: config.INSTAGRAM_USERNAME,
  password: config.INSTAGRAM_PASSWORD,
});

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
      content:
        "Create and produce a very short and concise one sentence description of a single piece of artwork that either features, highlights, or incorporates one of the pop culture trends.",
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
  style: "vivid",
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

// await instagramClient.uploadPhoto(
//   archiveFilepath,
//   imagePrompt,
//   topTrends.map((t) => t.query)
// );

console.log("Complete.");
