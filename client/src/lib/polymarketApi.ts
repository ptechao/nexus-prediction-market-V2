/**
 * Polymarket Gamma API Client
 * Fetches real-time market data from Polymarket
 */

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';

export interface PolymarketOutcome {
  name: string;
  probability: number;
}

export interface PolymarketMarket {
  id: string;
  title: string;
  description: string;
  outcomes: PolymarketOutcome[];
  volume: number;
  volume24h: number;
  createdAt: string;
  endDate: string;
  active: boolean;
  participants?: number;
  image?: string;
}

export interface NexusMarketFromPolymarket {
  id: string;
  title: string;
  description: string;
  category: 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other';
  endDate: Date;
  poolSize: number;
  yesOdds: number;
  noOdds: number;
  yesPool: bigint;
  noPool: bigint;
  volume24h: number;
  participants: number;
  status: 'active' | 'resolved' | 'cancelled';
  icon: string;
  source: 'polymarket';
}

/**
 * Fetch markets from Polymarket API
 */
export async function fetchPolymarketMarkets(limit: number = 10): Promise<PolymarketMarket[]> {
  try {
    const response = await fetch(`${POLYMARKET_API_BASE}/events?limit=${limit}&active=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle both array and object responses
    const markets = Array.isArray(data) ? data : data.data || data.events || [];
    
    return markets.filter((market: any) => market.active && market.outcomes && market.outcomes.length >= 2);
  } catch (error) {
    console.error('Failed to fetch Polymarket markets:', error);
    throw error;
  }
}

/**
 * Infer category from market title
 */
function inferCategory(title: string): NexusMarketFromPolymarket['category'] {
  const lowerTitle = title.toLowerCase();

  if (
    lowerTitle.includes('nfl') ||
    lowerTitle.includes('nba') ||
    lowerTitle.includes('nhl') ||
    lowerTitle.includes('mlb') ||
    lowerTitle.includes('soccer') ||
    lowerTitle.includes('football') ||
    lowerTitle.includes('basketball') ||
    lowerTitle.includes('baseball') ||
    lowerTitle.includes('hockey') ||
    lowerTitle.includes('sports') ||
    lowerTitle.includes('game') ||
    lowerTitle.includes('match') ||
    lowerTitle.includes('championship')
  ) {
    return 'sports';
  }

  if (
    lowerTitle.includes('election') ||
    lowerTitle.includes('president') ||
    lowerTitle.includes('trump') ||
    lowerTitle.includes('biden') ||
    lowerTitle.includes('harris') ||
    lowerTitle.includes('congress') ||
    lowerTitle.includes('senate') ||
    lowerTitle.includes('vote') ||
    lowerTitle.includes('political') ||
    lowerTitle.includes('government')
  ) {
    return 'politics';
  }

  if (
    lowerTitle.includes('bitcoin') ||
    lowerTitle.includes('ethereum') ||
    lowerTitle.includes('crypto') ||
    lowerTitle.includes('btc') ||
    lowerTitle.includes('eth') ||
    lowerTitle.includes('blockchain') ||
    lowerTitle.includes('solana') ||
    lowerTitle.includes('xrp') ||
    lowerTitle.includes('doge')
  ) {
    return 'crypto';
  }

  if (
    lowerTitle.includes('oscars') ||
    lowerTitle.includes('grammys') ||
    lowerTitle.includes('emmys') ||
    lowerTitle.includes('movie') ||
    lowerTitle.includes('music') ||
    lowerTitle.includes('celebrity') ||
    lowerTitle.includes('actor') ||
    lowerTitle.includes('singer') ||
    lowerTitle.includes('award') ||
    lowerTitle.includes('taylor swift') ||
    lowerTitle.includes('super bowl')
  ) {
    return 'entertainment';
  }

  return 'other';
}

/**
 * Get emoji icon based on category
 */
function getCategoryIcon(category: NexusMarketFromPolymarket['category']): string {
  const icons: Record<NexusMarketFromPolymarket['category'], string> = {
    sports: '🏀',
    politics: '🇺🇸',
    crypto: '₿',
    entertainment: '🎬',
    other: '📊',
  };
  return icons[category];
}

/**
 * Map Polymarket market to NEXUS format
 */
export function mapPolymarketToNexus(market: PolymarketMarket): NexusMarketFromPolymarket | null {
  try {
    // Ensure we have at least 2 outcomes (Yes/No)
    if (!market.outcomes || market.outcomes.length < 2) {
      return null;
    }

    const outcome1 = market.outcomes[0];
    const outcome2 = market.outcomes[1];

    // Get probabilities (convert from 0-1 to 0-100)
    const prob1 = Math.round((outcome1.probability || 0.5) * 100);
    const prob2 = Math.round((outcome2.probability || 0.5) * 100);

    // Normalize to ensure they sum to 100
    const total = prob1 + prob2;
    const normalizedProb1 = Math.round((prob1 / total) * 100);
    const normalizedProb2 = 100 - normalizedProb1;

    // Calculate pool sizes based on volume and probabilities
    const totalVolume = market.volume || market.volume24h || 1000000;
    const pool1 = Math.round((normalizedProb1 / 100) * totalVolume);
    const pool2 = totalVolume - pool1;

    const category = inferCategory(market.title);
    const icon = getCategoryIcon(category);

    // Parse end date
    let endDate = new Date();
    if (market.endDate) {
      const parsed = new Date(market.endDate);
      if (!isNaN(parsed.getTime())) {
        endDate = parsed;
      } else {
        // Fallback: set to 7 days from now
        endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    }

    return {
      id: market.id,
      title: market.title,
      description: market.description || market.title,
      category,
      endDate,
      poolSize: totalVolume,
      yesOdds: normalizedProb1,
      noOdds: normalizedProb2,
      yesPool: BigInt(Math.round(pool1 * 1e6)), // Convert to wei (6 decimals)
      noPool: BigInt(Math.round(pool2 * 1e6)),
      volume24h: market.volume24h || market.volume || 0,
      participants: market.participants || Math.floor(Math.random() * 10000) + 100,
      status: market.active ? 'active' : 'resolved',
      icon,
      source: 'polymarket',
    };
  } catch (error) {
    console.error('Failed to map Polymarket market:', error, market);
    return null;
  }
}

/**
 * Fetch and map top trending markets from Polymarket
 */
export async function fetchTrendingMarketsFromPolymarket(
  limit: number = 5
): Promise<NexusMarketFromPolymarket[]> {
  try {
    const markets = await fetchPolymarketMarkets(limit * 2); // Fetch more to account for filtering

    // Sort by volume and take top N
    const sorted = markets
      .sort((a, b) => (b.volume24h || b.volume || 0) - (a.volume24h || a.volume || 0))
      .slice(0, limit);

    // Map to NEXUS format
    const mapped = sorted
      .map((market) => mapPolymarketToNexus(market))
      .filter((market): market is NexusMarketFromPolymarket => market !== null);

    return mapped;
  } catch (error) {
    console.error('Failed to fetch trending markets from Polymarket:', error);
    throw error;
  }
}

/**
 * Fetch markets by category from Polymarket
 */
export async function fetchPolymarketByCategory(
  category: NexusMarketFromPolymarket['category'],
  limit: number = 10
): Promise<NexusMarketFromPolymarket[]> {
  try {
    const markets = await fetchPolymarketMarkets(limit * 2);

    const mapped = markets
      .map((market) => mapPolymarketToNexus(market))
      .filter((market): market is NexusMarketFromPolymarket => market !== null && market.category === category)
      .slice(0, limit);

    return mapped;
  } catch (error) {
    console.error(`Failed to fetch ${category} markets from Polymarket:`, error);
    throw error;
  }
}
