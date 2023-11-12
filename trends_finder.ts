import googleTrends from "npm:google-trends-api";

interface TrendingSearch {
  title: { query: string };
  articles: { title: string }[];
}

interface TrendingSearchesDay {
  trendingSearches: TrendingSearch[];
}

interface GoogleTrendsResponse {
  trendingSearchesDays: TrendingSearchesDay[];
}

export interface Filter {
  geo: string;
}

export interface TrendArticle {
  title: string;
}

export interface Trend {
  query: string;
  articles: TrendArticle[];
}

export class TrendFinder {
  async find(filter: Filter): Promise<Trend[]> {
    const response = await googleTrends.dailyTrends({ geo: filter.geo });
    const parsed = JSON.parse(response).default as GoogleTrendsResponse;

    // console.log(JSON.stringify(parsed, null, 2));

    return parsed.trendingSearchesDays
      .flatMap((t) => t.trendingSearches)
      .map((t) => ({
        query: t.title.query,
        articles: t.articles.map((a) => ({ title: a.title })),
      }));
  }
}

Deno.test(async function testClient() {
  const client = new TrendFinder();
  const trends = await client.find({ geo: "US" });
  console.log(trends);
});
