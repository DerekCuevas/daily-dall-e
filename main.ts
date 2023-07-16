import { OpenAI } from "https://deno.land/x/openai/mod.ts";
import { config } from "./config.ts";

export async function dailyDalle(): Promise<void> {
  const openai = new OpenAI(config.OPENAI_API_KEY);

  const imagePrompt = "Kelly Slater surfing on the moon, photo realistic.";
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
}

// Learn more at https://deno.land/manual/examples/module_metadata#concepts
if (import.meta.main) {
  await dailyDalle();
  console.log("Complete.");
}
