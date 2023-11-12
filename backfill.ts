const posts = [];
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

  const contents = await Deno.readTextFile(`${dataDir}/${file.name}`);

  const data: {
    topThree: string[];
    imagePrompt: string;
    imageURL: string;
  } = JSON.parse(contents);

  const date = file.name.replace("daily-dall-e-", "").replace(".json", "");

  const archiveImageFile = archiveImageFileLookup[getDatePrefix(date)];

  if (!archiveImageFile) continue;

  const readmeContents = `
## ${date} 

![Daily Dall-E](${archiveImageFile})

> ${data.imagePrompt}

${data.topThree.map((t) => `1. ${t}`).join("\n")}
`;

  posts.push({ date: new Date(date), readmeContents });
}

posts.sort((a, b) => b.date.getTime() - a.date.getTime());

Deno.writeTextFile(
  outputFile,
  posts.map((p) => p.readmeContents).join("---\n")
);
