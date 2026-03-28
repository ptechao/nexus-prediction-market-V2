import axios from "axios";

/**
 * Common interface for market seeds across different sources
 */
export interface GenericMarketSeed {
  source: string;
  sourceId: string;
  title: string;
  description: string;
  category: string;
  eventType: string;
  startTime: string;
  endTime: string;
  image?: string;
  tags: string[];
  yesOdds?: number;
  noOdds?: number;
  totalPool?: number;
  volume24h?: number;
  participants?: number;
}

/**
 * Fetch markets from Kalshi
 * Endpoint: https://api.elections.kalshi.com/trade-api/v2/get_markets
 */
export async function fetchKalshiMarkets(): Promise<GenericMarketSeed[]> {
  try {
    const response = await axios.get("https://api.elections.kalshi.com/trade-api/v2/get_markets", {
      params: { limit: 20, status: "open" },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!response.data || !response.data.markets) return [];

    return response.data.markets.map((m: any) => ({
      source: "kalshi",
      sourceId: m.ticker,
      title: m.title,
      description: m.subtitle || m.rules_primary || "",
      category: mapKalshiCategory(m.category),
      eventType: "finance",
      startTime: m.open_time || new Date().toISOString(),
      endTime: m.close_time || m.expiration_time,
      image: undefined,
      tags: [m.category, "Kalshi"],
      yesOdds: m.yes_bid ? Math.round(m.yes_bid) : 50,
      noOdds: m.no_bid ? Math.round(m.no_bid) : 50,
    }));
  } catch (error) {
    console.error("Error fetching from Kalshi:", error);
    return [];
  }
}

function mapKalshiCategory(cat: string): string {
  const c = (cat || "").toLowerCase();
  if (c.includes("politics") || c.includes("election")) return "politics";
  if (c.includes("crypto") || c.includes("bitcoin")) return "crypto";
  if (c.includes("sports")) return "sports";
  if (c.includes("entertainment") || c.includes("culture")) return "entertainment";
  return "other";
}

/**
 * Fetch markets from PredictIt
 * Endpoint: https://www.predictit.org/api/marketdata/all/
 */
export async function fetchPredictItMarkets(): Promise<GenericMarketSeed[]> {
  try {
    // PredictIt returns a large list of all markets
    const response = await axios.get("https://www.predictit.org/api/marketdata/all/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!response.data || !response.data.markets) return [];

    // Filter for a few interesting ones to avoid bloating
    return response.data.markets.slice(0, 20).map((m: any) => ({
      source: "predictit",
      sourceId: String(m.id),
      title: m.name,
      description: m.shortName,
      category: "politics",
      eventType: "politics",
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // PredictIt API doesn't always show end date easily in this list
      image: m.image,
      tags: ["Politics", "PredictIt"],
      // PredictIt odds are in cents (0.01 to 0.99)
      yesOdds: m.contracts && m.contracts[0] ? Math.round(m.contracts[0].lastTradePrice * 100) : 50,
      noOdds: m.contracts && m.contracts[0] ? Math.round((1 - m.contracts[0].lastTradePrice) * 100) : 50,
    }));
  } catch (error) {
    console.error("Error fetching from PredictIt:", error);
    return [];
  }
}

/**
 * Fetch markets from Manifold Markets
 * Endpoint: https://api.manifold.markets/v0/markets
 */
export async function fetchManifoldMarkets(): Promise<GenericMarketSeed[]> {
  try {
    const response = await axios.get("https://api.manifold.markets/v0/markets", {
      params: { limit: 100 },
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json"
      }
    });

    if (!Array.isArray(response.data)) return [];

    return response.data.map((m: any) => ({
      source: "manifold",
      sourceId: m.id,
      title: m.question,
      description: typeof m.description === "string" ? m.description : (m.description?.content?.[0]?.content?.[0]?.text || ""),
      category: mapManifoldCategory(m.groupSlugs, m.question),
      eventType: "social",
      startTime: new Date(m.createdTime).toISOString(),
      endTime: new Date(m.closeTime || Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      image: undefined,
      tags: [...(m.groupSlugs || []), "Manifold"],
      yesOdds: m.probability ? Math.round(m.probability * 100) : 50,
      noOdds: m.probability ? Math.round((1 - m.probability) * 100) : 50,
    }));
  } catch (error) {
    console.error("Error fetching from Manifold:", error);
    return [];
  }
}

function mapManifoldCategory(slugs: string[] = [], title: string = ""): string {
  const s = ((slugs || []).join(" ") + " " + (title || "")).toLowerCase();
  
  if (s.includes("politics") || s.includes("election") || s.includes("usa") || s.includes("trump") || s.includes("biden") || s.includes("johnson") || s.includes("duma")) return "politics";
  if (s.includes("sports") || s.includes("nfl") || s.includes("nba") || s.includes("soccer") || s.includes("football") || s.includes("mlb") || s.includes("gaa")) return "sports";
  if (s.includes("crypto") || s.includes("bitcoin") || s.includes("eth") || s.includes("btc") || s.includes("finance") || s.includes("business") || s.includes("coin")) return "crypto";
  if (s.includes("entertainment") || s.includes("movies") || s.includes("tv") || s.includes("gaming") || s.includes("celebrity") || s.includes("hermano")) return "entertainment";
  if (s.includes("tech") || s.includes("ai") || s.includes("science")) return "other";
  return "other";
}
