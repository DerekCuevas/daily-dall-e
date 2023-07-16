import { OpenAI } from "https://deno.land/x/openai/mod.ts";
import { config } from "./config.ts";
import { TrendFinder } from "./trends_finder.ts";

const trendsFinder = new TrendFinder();
const openai = new OpenAI(config.OPENAI_API_KEY);

const trends = await trendsFinder.find({ geo: "US" });
const topThree = trends.slice(0, 3).map((t) => t.query);

const imagePrompt = `An image featuring: ${topThree.join(", ")}`;
console.log(`Generating image: ${imagePrompt}`);

const image = await openai.createImage({
  prompt: imagePrompt,
  n: 1,
  size: "1024x1024",
});
const imageURL = image.data[0].url;

console.log(`Generated: ${imageURL}`);

const archiveFilepath = `./archive/daily-dall-e-${new Date().toISOString()}.png`;
const archiveFile = await Deno.open(archiveFilepath, {
  write: true,
  create: true,
});

const imageResponse = await fetch(imageURL);
if (imageResponse.body) {
  await imageResponse.body.pipeTo(archiveFile.writable);
}

const dailyFilepath = `./daily-dall-e.png`;
await Deno.copyFile(archiveFilepath, dailyFilepath);

console.log("Complete.");
