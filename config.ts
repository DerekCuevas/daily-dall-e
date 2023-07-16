import * as dotenv from "https://deno.land/x/dotenv/mod.ts";

export interface Config {
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
}

// deno-lint-ignore no-explicit-any
export const config = dotenv.config() as any as Config;
