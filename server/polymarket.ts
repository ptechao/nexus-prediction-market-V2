/**
 * Polymarket API integration
 * Fetches live market data from the Polymarket Gamma API
 * and maps it to our internal Market interface.
 */

// ─── Types ─────────────────────────────────────────────────────────────

/** Our internal market representation */
export interface NexusMarket {
  id: string;
  title: string;
  description: string;
  category: string;
  eventType: string;
  endDate: string;
  image: string | null;
  yesOdds: number;
  noOdds: number;
  totalPool: number;
  volume24h: number;
  volume1wk: number;
  participants: number;
  isTrending: boolean;
  slug: string;
  polymarketUrl: string;
}

/** Raw Polymarket API types */
interface PolymarketTag {
  label: string;
  slug: string;
}

interface PolymarketSubMarket {
  question: string;
  outcomePrices: string; // JSON string like '["0.56", "0.44"]'
  outcomes: string;      // JSON string like '["Yes", "No"]'
  volume: string;
  volumeNum: number;
  active: boolean;
  image: string | null;
  slug: string;
}

interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string | null;
  icon: string | null;
  volume: number;
  volume1wk: number;
  volume1mo: number;
  endDate: string;
  startDate: string;
  active: boolean;
  closed: boolean;
  featured: boolean;
  tags: PolymarketTag[];
  markets: PolymarketSubMarket[];
  commentCount: number;
}

// ─── Category Mapping ──────────────────────────────────────────────────

const TAG_TO_CATEGORY: Record<string, { category: string; eventType: string }> = {
  politics: { category: 'Politics', eventType: 'politics' },
  elections: { category: 'Politics', eventType: 'politics' },
  'us election': { category: 'Politics', eventType: 'politics' },
  trump: { category: 'Politics', eventType: 'politics' },
  nba: { category: 'NBA', eventType: 'sports' },
  basketball: { category: 'Basketball', eventType: 'sports' },
  nfl: { category: 'NFL', eventType: 'sports' },
  football: { category: 'Football', eventType: 'sports' },
  soccer: { category: 'Soccer', eventType: 'sports' },
  sports: { category: 'Sports', eventType: 'sports' },
  crypto: { category: 'Crypto', eventType: 'crypto' },
  bitcoin: { category: 'Bitcoin', eventType: 'crypto' },
  ethereum: { category: 'Ethereum', eventType: 'crypto' },
  defi: { category: 'DeFi', eventType: 'crypto' },
  'fed funds': { category: 'Finance', eventType: 'finance' },
  economy: { category: 'Economy', eventType: 'finance' },
  'stock market': { category: 'Stock Market', eventType: 'finance' },
  science: { category: 'Science', eventType: 'science' },
  ai: { category: 'AI', eventType: 'tech' },
  technology: { category: 'Technology', eventType: 'tech' },
  entertainment: { category: 'Entertainment', eventType: 'entertainment' },
  oscars: { category: 'Entertainment', eventType: 'entertainment' },
  culture: { category: 'Culture', eventType: 'culture' },
};

function categorizeEvent(tags: PolymarketTag[]): { category: string; eventType: string } {
  for (const tag of tags) {
    const slug = tag.slug?.toLowerCase() || tag.label?.toLowerCase() || '';
    const label = tag.label?.toLowerCase() || '';
    const match = TAG_TO_CATEGORY[slug] || TAG_TO_CATEGORY[label];
    if (match) return match;
  }
  return { category: 'General', eventType: 'other' };
}

// ─── Data Mapping ──────────────────────────────────────────────────────

function parseOutcomePrices(pricesStr: string): { yes: number; no: number } {
  try {
    const prices = JSON.parse(pricesStr) as string[];
    if (prices.length >= 2) {
      const yes = Math.round(parseFloat(prices[0]) * 100);
      const no = Math.round(parseFloat(prices[1]) * 100);
      // Ensure they sum to ~100
      if (yes + no > 0) return { yes, no };
    }
  } catch {
    // fallback
  }
  return { yes: 50, no: 50 };
}

function mapEventToMarket(event: PolymarketEvent): NexusMarket | null {
  // Skip events with no active sub-markets
  const activeMarkets = event.markets?.filter(m => m.active) || [];
  const primaryMarket = activeMarkets[0] || event.markets?.[0];
  if (!primaryMarket) return null;

  const { category, eventType } = categorizeEvent(event.tags || []);
  const odds = parseOutcomePrices(primaryMarket.outcomePrices);

  // Estimate participants from comment count + volume heuristic
  const estimatedParticipants = Math.max(
    event.commentCount || 0,
    Math.round((event.volume || 0) / 500) // rough estimate: avg $500 per participant
  );

  return {
    id: event.id,
    title: event.title,
    description: event.description?.slice(0, 300) || '',
    category,
    eventType,
    endDate: event.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    image: event.image || primaryMarket.image || null,
    yesOdds: odds.yes,
    noOdds: odds.no,
    totalPool: event.volume || 0,
    volume24h: event.volume1wk ? event.volume1wk / 7 : 0, // approximate daily from weekly
    volume1wk: event.volume1wk || 0,
    participants: estimatedParticipants,
    isTrending: (event.volume1wk || 0) > 1000000 || event.featured,
    slug: event.slug,
    polymarketUrl: `https://polymarket.com/event/${event.slug}`,
  };
}

/** Extended detail for a single market (includes sub-markets) */
export interface NexusMarketDetail extends NexusMarket {
  fullDescription: string;
  startDate: string;
  volume1mo: number;
  tags: string[];
  subMarkets: {
    question: string;
    yesOdds: number;
    noOdds: number;
    volume: number;
    active: boolean;
    image: string | null;
  }[];
  resolutionSource: string;
  commentCount: number;
  isActive: boolean;
  isClosed: boolean;
}

function mapEventToMarketDetail(event: PolymarketEvent): NexusMarketDetail | null {
  const base = mapEventToMarket(event);
  if (!base) return null;

  const subMarkets = (event.markets || []).map((m) => {
    const odds = parseOutcomePrices(m.outcomePrices);
    return {
      question: m.question,
      yesOdds: odds.yes,
      noOdds: odds.no,
      volume: m.volumeNum || 0,
      active: m.active,
      image: m.image,
    };
  });

  return {
    ...base,
    fullDescription: event.description || '',
    startDate: event.startDate || '',
    volume1mo: event.volume1mo || 0,
    tags: (event.tags || []).map((t) => t.label),
    subMarkets,
    resolutionSource: (event as any).resolutionSource || '',
    commentCount: event.commentCount || 0,
    isActive: event.active,
    isClosed: event.closed,
  };
}

// ─── API Fetch ─────────────────────────────────────────────────────────

const POLYMARKET_API_BASE = 'https://gamma-api.polymarket.com';

export async function fetchTopMarkets(limit = 10): Promise<NexusMarket[]> {
  const fetchLimit = limit * 3;
  const url = `${POLYMARKET_API_BASE}/events?limit=${fetchLimit}&order=volume&ascending=false`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(10000), // 10s timeout
  });

  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
  }

  const events = (await response.json()) as PolymarketEvent[];
  const now = new Date();
  const minEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const markets = events
    .filter(event => {
      if (!event.active || event.closed) return false;
      const endDate = new Date(event.endDate);
      if (endDate < minEndDate) return false;
      const hasActiveMarket = (event.markets || []).some(m => m.active);
      if (!hasActiveMarket) return false;
      if ((event.volume || 0) < 100) return false;
      return true;
    })
    .map(mapEventToMarket)
    .filter((m): m is NexusMarket => m !== null)
    .slice(0, limit);

  return markets;
}

export async function fetchMarketById(id: string): Promise<NexusMarketDetail | null> {
  const url = `${POLYMARKET_API_BASE}/events/${id}`;

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
  }

  const event = (await response.json()) as PolymarketEvent;
  return mapEventToMarketDetail(event);
}

export async function fetchMarketsByTag(tag: string, limit = 10): Promise<NexusMarket[]> {
  const fetchLimit = limit * 3;
  const url = `${POLYMARKET_API_BASE}/events?limit=${fetchLimit}&order=volume&ascending=false&tag=${encodeURIComponent(tag)}`;

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status} ${response.statusText}`);
  }

  const events = (await response.json()) as PolymarketEvent[];
  const now = new Date();
  const minEndDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return events
    .filter(event => {
      if (!event.active || event.closed) return false;
      const endDate = new Date(event.endDate);
      if (endDate < minEndDate) return false;
      const hasActiveMarket = (event.markets || []).some(m => m.active);
      if (!hasActiveMarket) return false;
      if ((event.volume || 0) < 100) return false;
      return true;
    })
    .map(mapEventToMarket)
    .filter((m): m is NexusMarket => m !== null)
    .slice(0, limit);
}
