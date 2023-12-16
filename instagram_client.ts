// www.instagram.com/artdailydalle

import { IgApiClient } from "npm:instagram-private-api@1.44.0";
import pngToJpeg from "npm:png-to-jpeg@1.0.1";

export interface InstagramClientConfig {
  username: string;
  password: string;
}

export class InstagramClient {
  config: InstagramClientConfig;
  client: IgApiClient;

  constructor(config: InstagramClientConfig) {
    this.config = config;
    this.client = new IgApiClient();
  }

  async login(): Promise<void> {
    const { username, password } = this.config;
    this.client.state.generateDevice(username);
    // this.client.state.proxyUrl = process.env.IG_PROXY;
    await this.client.simulate.preLoginFlow();
    await this.client.account.login(username, password);
    await this.client.simulate.postLoginFlow();
  }

  async uploadPhoto(
    imageFilepath: string,
    caption: string,
    hashtags: string[]
  ): Promise<void> {
    await this.login();

    const imageContents = await Deno.readFile(imageFilepath);
    const jpegContents = await pngToJpeg({ quality: 90 })(imageContents);

    await this.client.publish.photo({
      file: jpegContents,
      caption: `${caption}\n\n${hashtags.map((h) => `#${h}`).join(" ")}`,
    });
  }
}
