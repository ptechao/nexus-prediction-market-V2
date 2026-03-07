// API-Football Data Adapter
// Fetches upcoming and completed matches from api-football.com

import axios, { AxiosError } from "axios";

export interface FootballMatch {
  id: string;
  league: string;
  season: number;
  homeTeam: {
    id: number;
    name: string;
    logo: string;
  };
  awayTeam: {
    id: number;
    name: string;
    logo: string;
  };
  startTime: string; // ISO 8601
  endTime?: string; // ISO 8601, only for completed matches
  status: "scheduled" | "live" | "finished" | "postponed" | "cancelled";
  score?: {
    home: number;
    away: number;
  };
  venue: {
    name: string;
    city: string;
  };
  referee?: string;
}

export interface MarketSeed {
  source: "api-football" | "polymarket";
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
  leagueTag: string;
}

const API_KEY = process.env.API_FOOTBALL_KEY || "";
const API_BASE = "https://api-football-v3.p.rapidapi.com";
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

/**
 * Fetch upcoming matches from API-Football
 */
export async function fetchUpcomingMatches(
  leagueId: number,
  daysAhead: number = 7,
  mockMode: boolean = false
): Promise<FootballMatch[]> {
  if (mockMode) {
    return getMockMatches();
  }

  const startDate = new Date();
  const endDate = new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    league: leagueId.toString(),
    season: new Date().getFullYear().toString(),
    from: startDate.toISOString().split("T")[0],
    to: endDate.toISOString().split("T")[0],
    status: "scheduled",
  });

  return fetchWithRetry(
    `${API_BASE}/fixtures?${params}`,
    parseFootballResponse
  );
}

/**
 * Fetch completed matches from API-Football
 */
export async function fetchCompletedMatches(
  leagueId: number,
  daysBack: number = 1,
  mockMode: boolean = false
): Promise<FootballMatch[]> {
  if (mockMode) {
    return getMockCompletedMatches();
  }

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    league: leagueId.toString(),
    season: new Date().getFullYear().toString(),
    from: startDate.toISOString().split("T")[0],
    to: endDate.toISOString().split("T")[0],
    status: "finished",
  });

  return fetchWithRetry(
    `${API_BASE}/fixtures?${params}`,
    parseFootballResponse
  );
}

/**
 * Fetch with retry logic and rate limiting
 */
async function fetchWithRetry(
  url: string,
  parser: (data: any) => any[],
  retries: number = 0
): Promise<any[]> {
  try {
    const response = await axios.get(url, {
      headers: {
        "x-rapidapi-key": API_KEY,
        "x-rapidapi-host": "api-football-v3.p.rapidapi.com",
      },
    });

    if (response.status === 429) {
      // Rate limited
      if (retries < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retries);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, parser, retries + 1);
      }
      throw new Error("Max retries exceeded due to rate limiting");
    }

    return parser(response.data);
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 429) {
      if (retries < MAX_RETRIES) {
        const delay = RETRY_DELAY * Math.pow(2, retries);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchWithRetry(url, parser, retries + 1);
      }
    }
    console.error("Error fetching from API-Football:", error);
    throw error;
  }
}

/**
 * Parse API-Football response
 */
function parseFootballResponse(data: any): FootballMatch[] {
  if (!data.response || !Array.isArray(data.response)) {
    return [];
  }

  return data.response.map((fixture: any) => ({
    id: `apif-${fixture.fixture.id}`,
    league: fixture.league.name,
    season: fixture.league.season,
    homeTeam: {
      id: fixture.teams.home.id,
      name: fixture.teams.home.name,
      logo: fixture.teams.home.logo,
    },
    awayTeam: {
      id: fixture.teams.away.id,
      name: fixture.teams.away.name,
      logo: fixture.teams.away.logo,
    },
    startTime: new Date(fixture.fixture.timestamp * 1000).toISOString(),
    endTime:
      fixture.fixture.status.short === "FT"
        ? new Date(fixture.fixture.timestamp * 1000).toISOString()
        : undefined,
    status: mapFixtureStatus(fixture.fixture.status.short),
    score:
      fixture.goals && fixture.goals.home !== null
        ? {
            home: fixture.goals.home,
            away: fixture.goals.away,
          }
        : undefined,
    venue: {
      name: fixture.fixture.venue.name || "Unknown",
      city: fixture.fixture.venue.city || "Unknown",
    },
    referee: fixture.fixture.referee,
  }));
}

/**
 * Map API-Football status to standard status
 */
function mapFixtureStatus(
  status: string
): "scheduled" | "live" | "finished" | "postponed" | "cancelled" {
  const statusMap: Record<string, any> = {
    NS: "scheduled",
    TBD: "scheduled",
    "1H": "live",
    HT: "live",
    "2H": "live",
    ET: "live",
    BT: "live",
    P: "postponed",
    SUSP: "postponed",
    INT: "live",
    FT: "finished",
    AET: "finished",
    PEN: "finished",
    CANC: "cancelled",
    ABD: "cancelled",
    AWD: "cancelled",
    WO: "cancelled",
  };
  return statusMap[status] || "scheduled";
}

/**
 * Convert FootballMatch to MarketSeed
 */
export function convertToMarketSeed(match: FootballMatch): MarketSeed {
  const title = `${match.homeTeam.name} vs ${match.awayTeam.name}`;
  const description = `${match.league} - ${match.homeTeam.name} vs ${match.awayTeam.name} at ${match.venue.name}`;

  return {
    source: "api-football",
    sourceId: match.id,
    title,
    description,
    category: match.league,
    eventType: "sports",
    startTime: match.startTime,
    endTime: match.endTime || new Date(new Date(match.startTime).getTime() + 3 * 60 * 60 * 1000).toISOString(),
    image: match.homeTeam.logo,
    tags: [match.league, "Football", match.venue.city],
    leagueTag: match.league.toLowerCase().replace(/\s+/g, "-"),
  };
}

/**
 * Mock data for testing without API calls
 */
function getMockMatches(): FootballMatch[] {
  const now = new Date();
  return [
    {
      id: "apif-mock-1",
      league: "Premier League",
      season: 2025,
      homeTeam: {
        id: 1,
        name: "Manchester United",
        logo: "https://media.api-sports.io/teams/33.png",
      },
      awayTeam: {
        id: 2,
        name: "Liverpool",
        logo: "https://media.api-sports.io/teams/40.png",
      },
      startTime: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      status: "scheduled",
      venue: {
        name: "Old Trafford",
        city: "Manchester",
      },
    },
    {
      id: "apif-mock-2",
      league: "La Liga",
      season: 2025,
      homeTeam: {
        id: 3,
        name: "Real Madrid",
        logo: "https://media.api-sports.io/teams/541.png",
      },
      awayTeam: {
        id: 4,
        name: "Barcelona",
        logo: "https://media.api-sports.io/teams/529.png",
      },
      startTime: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
      status: "scheduled",
      venue: {
        name: "Santiago Bernabéu",
        city: "Madrid",
      },
    },
  ];
}

/**
 * Mock completed matches for testing
 */
function getMockCompletedMatches(): FootballMatch[] {
  const now = new Date();
  return [
    {
      id: "apif-mock-completed-1",
      league: "Premier League",
      season: 2025,
      homeTeam: {
        id: 1,
        name: "Manchester United",
        logo: "https://media.api-sports.io/teams/33.png",
      },
      awayTeam: {
        id: 2,
        name: "Liverpool",
        logo: "https://media.api-sports.io/teams/40.png",
      },
      startTime: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString(),
      status: "finished",
      score: {
        home: 2,
        away: 1,
      },
      venue: {
        name: "Old Trafford",
        city: "Manchester",
      },
    },
  ];
}
