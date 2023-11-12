const posts = [];
const outputFile = "./ARCHIVE.md";

const dataDir = "./data";
const archiveDir = "./archive";

for await (const file of Deno.readDir(dataDir)) {
  if (!file.isFile) continue;

  console.log(file.name);

  const contents = await Deno.readTextFile(`${dataDir}/${file.name}`);

  const data: {
    topThree: string[];
    imagePrompt: string;
    imageURL: string;
  } = JSON.parse(contents);

  const archiveFilepath = `${archiveDir}/${file.name.replace(".json", ".png")}`;

  console.log(archiveFilepath);

  const date = new Date(
    file.name.replace("daily-dall-e-", "").replace(".json", "")
  );

  const readmeContents = `
## ${date.toISOString()} 

![Daily Dall-E](${archiveFilepath})

> ${data.imagePrompt}

${data.topThree.map((t) => `1. ${t}`).join("\n")}
`;

  posts.push({ date, readmeContents });
}

posts.sort((a, b) => b.date.getTime() - a.date.getTime());

Deno.writeTextFile(
  outputFile,
  posts.map((p) => p.readmeContents).join("---\n")
);
