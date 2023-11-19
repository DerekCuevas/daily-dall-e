# Daily Dall-E

Combining GitHub Actions, Google Trends, OpenAI ChatGPT, and Dall-E to Create Daily Artwork.

## How it Works

Once a day (via a GitHub Action running in this repo), this project queries [Google Trends](https://trends.google.com/trends/) and then uses [ChatGPT](https://chat.openai.com/) and [Dall-E](https://openai.com/research/dall-e) to produce unique artwork relevant for today.

The full log of daily artwork can be seen in this repo's [README](./README.md). Under each art piece is the caption produced by ChatGPT and the top Google Trends used to generate it.
