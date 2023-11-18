# Daily Dall-E

Combining GitHub Actions, Google Trends, OpenAI ChatGPT, and Dall-E to Create Daily Artwork.

## How it Works

Once a day (via a GitHub Action running in this repo), this project queries [Google Trends](https://trends.google.com/trends/) and then uses [ChatGPT](https://chat.openai.com/) to produce a verbal description of artwork featuring one or more of the daily trends. That description is then input into [Dall-E](https://openai.com/research/dall-e) to produce unique artwork relevant for today.

The full log of daily artwork can be seen in this repo's [README](./README.md). Under each art piece is the description produced by ChatGPT and the top Google Trends used to seed the topic.
