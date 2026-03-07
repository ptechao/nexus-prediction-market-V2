// World Cup 2026 - Data mapping and API functions
import type { NexusMarket, NexusMarketDetail } from "./polymarket";
import type { WorldCupMatch } from "./data/worldcupMatches";
import { WORLD_CUP_MATCHES } from "./data/worldcupMatches";

/**
 * Map a World Cup match to NexusMarket format
 */
export function mapMatchToMarket(match: WorldCupMatch): NexusMarket {
  return {
    id: match.id,
    title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    description: `${match.stage}${match.group ? ` - ${match.group}` : ""}`,
    category: "World Cup ★",
    eventType: "world-cup",
    endDate: match.kickoffUtc,
    image: match.heroImage,
    yesOdds: match.yesOdds,
    noOdds: match.noOdds,
    totalPool: match.totalPool,
    volume24h: match.volume24h,
    volume1wk: match.volume24h * 7,
    participants: match.participants,
    isTrending: match.isTrending,
    slug: match.slug,
    polymarketUrl: `https://polymarket.com/market/${match.id}`,
  };
}

/**
 * Map a World Cup match to NexusMarketDetail format
 */
export function mapMatchToDetail(match: WorldCupMatch): NexusMarketDetail {
  const startDate = new Date(
    new Date(match.kickoffUtc).getTime() - 24 * 60 * 60 * 1000
  ).toISOString();

  return {
    id: match.id,
    title: `${match.homeTeam.name} vs ${match.awayTeam.name}`,
    description: match.analysis,
    category: "World Cup ★",
    eventType: "world-cup",
    endDate: match.kickoffUtc,
    image: match.heroImage,
    yesOdds: match.yesOdds,
    noOdds: match.noOdds,
    totalPool: match.totalPool,
    volume24h: match.volume24h,
    volume1wk: match.volume24h * 7,
    volume1mo: match.volume24h * 30,
    participants: match.participants,
    isTrending: match.isTrending,
    slug: match.slug,
    polymarketUrl: `https://polymarket.com/market/${match.id}`,
    fullDescription: match.analysis,
    startDate,
    tags: [match.stage, match.group || "Knockout", "World Cup"],
    subMarkets: [
      {
        question: `Will ${match.homeTeam.name} win?`,
        yesOdds: match.yesOdds,
        noOdds: match.noOdds,
        volume: match.totalPool,
        active: true,
        image: match.homeTeam.flag,
      },
    ],
    resolutionSource: "FIFA Official",
    commentCount: Math.floor(match.participants / 10),
    isActive: true,
    isClosed: false,
  };
}

/**
 * Fetch all World Cup matches
 */
export async function fetchWorldCupMarkets(): Promise<NexusMarket[]> {
  // Filter out TBD knockout matches for now
  const activeMatches = WORLD_CUP_MATCHES.filter(
    (m) => m.homeTeam.code !== "TBD"
  );
  return activeMatches.map(mapMatchToMarket);
}

/**
 * Fetch a specific World Cup match by ID
 */
export async function fetchWorldCupMarketById(
  id: string
): Promise<NexusMarketDetail | null> {
  const match = WORLD_CUP_MATCHES.find((m) => m.id === id);
  if (!match) return null;
  return mapMatchToDetail(match);
}

/**
 * Fetch World Cup matches by stage (Group Stage, Knockout, etc.)
 */
export async function fetchWorldCupMarketsByStage(
  stage: string
): Promise<NexusMarket[]> {
  const matches = WORLD_CUP_MATCHES.filter(
    (m) => m.stage === stage && m.homeTeam.code !== "TBD"
  );
  return matches.map(mapMatchToMarket);
}

/**
 * Fetch trending World Cup matches
 */
export async function fetchTrendingWorldCupMarkets(): Promise<NexusMarket[]> {
  const matches = WORLD_CUP_MATCHES.filter(
    (m) => m.isTrending && m.homeTeam.code !== "TBD"
  );
  return matches.map(mapMatchToMarket);
}

/**
 * Get World Cup match statistics
 */
export async function getWorldCupStats() {
  const activeMatches = WORLD_CUP_MATCHES.filter(
    (m) => m.homeTeam.code !== "TBD"
  );

  return {
    totalMatches: activeMatches.length,
    totalVolume: activeMatches.reduce((sum, m) => sum + m.totalPool, 0),
    totalParticipants: activeMatches.reduce((sum, m) => sum + m.participants, 0),
    groupStageMatches: activeMatches.filter(
      (m) => m.stage === "Group Stage"
    ).length,
    knockoutMatches: activeMatches.filter((m) => m.stage !== "Group Stage")
      .length,
  };
}
