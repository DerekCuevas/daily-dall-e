const posts: { [k in string]: { date: Date; contents: string } } = {};
const outputFile = "./README.md";

const dataDir = "./data";
const archiveDir = "./archive";
const archiveImageFileLookup: { [k in string]: string } = {};

function getDatePrefix(date: string): string {
  return date.substring(0, date.length - 6);
}

for await (const file of Deno.readDir(archiveDir)) {
  if (!file.isFile) continue;

  const date = file.name.replace("daily-dall-e-", "").replace(".png", "");

  archiveImageFileLookup[getDatePrefix(date)] = `${archiveDir}/${file.name}`;
}

for await (const file of Deno.readDir(dataDir)) {
  if (!file.isFile) continue;

  const fileContents = await Deno.readTextFile(`${dataDir}/${file.name}`);

  const data: {
    topThree: string[];
    imagePrompt: string;
    imageURL: string;
  } = JSON.parse(fileContents);

  const date = file.name.replace("daily-dall-e-", "").replace(".json", "");
  const datePrefix = getDatePrefix(date);

  const archiveImageFile = archiveImageFileLookup[datePrefix];

  if (!archiveImageFile) continue;

  const day = date.substring(0, 10);

  const contents = `
## ${day} 

![Daily Dall-E](${archiveImageFile})

> ${data.imagePrompt}

${data.topThree.map((t) => `1. ${t}`).join("\n")}
`;

  posts[day] = { date: new Date(date), contents };
}

const postsArray = Object.values(posts);

postsArray.sort((a, b) => b.date.getTime() - a.date.getTime());

Deno.writeTextFile(outputFile, postsArray.map((p) => p.contents).join("---\n"));
