/**
 * Mock Market Data for Demo Purposes
 * Used when live contract data is not available
 */

export interface MockMarket {
  id: string;
  title: string;
  description: string;
  category: 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other';
  endDate: Date;
  poolSize: number; // in USDC
  yesOdds: number; // 0-100 percentage
  noOdds: number; // 0-100 percentage
  yesPool: bigint; // in wei (6 decimals)
  noPool: bigint; // in wei (6 decimals)
  volume24h: number; // in USDC
  participants: number;
  status: 'active' | 'resolved' | 'cancelled';
  image?: string;
  icon?: string;
}

/**
 * Sample markets for demo
 */
export const MOCK_MARKETS: MockMarket[] = [
  {
    id: 'market-1',
    title: 'Lakers vs Warriors: Who wins?',
    description: 'Will the Los Angeles Lakers beat the Golden State Warriors in their next matchup?',
    category: 'sports',
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    poolSize: 1250000,
    yesOdds: 45,
    noOdds: 55,
    yesPool: BigInt(562500000000), // 562,500 USDC in wei
    noPool: BigInt(687500000000), // 687,500 USDC in wei
    volume24h: 125000,
    participants: 3421,
    status: 'active',
    icon: '🏀',
  },
  {
    id: 'market-2',
    title: 'US Election 2024: Trump to win?',
    description: 'Will Donald Trump win the 2024 US Presidential Election?',
    category: 'politics',
    endDate: new Date('2024-11-05T23:59:59Z'),
    poolSize: 55000000,
    yesOdds: 52,
    noOdds: 48,
    yesPool: BigInt(28600000000000), // 28.6M USDC in wei
    noPool: BigInt(26400000000000), // 26.4M USDC in wei
    volume24h: 2500000,
    participants: 89234,
    status: 'active',
    icon: '🇺🇸',
  },
  {
    id: 'market-3',
    title: 'Bitcoin hits $100k by end of Q1?',
    description: 'Will Bitcoin reach or exceed $100,000 USD by March 31, 2026?',
    category: 'crypto',
    endDate: new Date('2026-03-31T23:59:59Z'),
    poolSize: 8400000,
    yesOdds: 30,
    noOdds: 70,
    yesPool: BigInt(2520000000000), // 2.52M USDC in wei
    noPool: BigInt(5880000000000), // 5.88M USDC in wei
    volume24h: 450000,
    participants: 12543,
    status: 'active',
    icon: '₿',
  },
  {
    id: 'market-4',
    title: 'Will Taylor Swift perform at Super Bowl LVIII?',
    description: 'Will Taylor Swift perform at the Super Bowl LVIII halftime show?',
    category: 'entertainment',
    endDate: new Date('2024-02-11T23:59:59Z'),
    poolSize: 2800000,
    yesOdds: 75,
    noOdds: 25,
    yesPool: BigInt(2100000000000), // 2.1M USDC in wei
    noPool: BigInt(700000000000), // 700K USDC in wei
    volume24h: 180000,
    participants: 5234,
    status: 'active',
    icon: '🎤',
  },
  {
    id: 'market-5',
    title: 'S&P 500 closes above 5,500 by end of 2024?',
    description: 'Will the S&P 500 index close above 5,500 points by December 31, 2024?',
    category: 'other',
    endDate: new Date('2024-12-31T23:59:59Z'),
    poolSize: 12500000,
    yesOdds: 68,
    noOdds: 32,
    yesPool: BigInt(8500000000000), // 8.5M USDC in wei
    noPool: BigInt(4000000000000), // 4M USDC in wei
    volume24h: 850000,
    participants: 18765,
    status: 'active',
    icon: '📈',
  },
];

/**
 * Get all mock markets
 */
export function getAllMockMarkets(): MockMarket[] {
  return MOCK_MARKETS;
}

/**
 * Get mock market by ID
 */
export function getMockMarketById(id: string): MockMarket | undefined {
  return MOCK_MARKETS.find((market) => market.id === id);
}

/**
 * Get mock markets by category
 */
export function getMockMarketsByCategory(category: MockMarket['category']): MockMarket[] {
  return MOCK_MARKETS.filter((market) => market.category === category);
}

/**
 * Get trending mock markets (sorted by volume)
 */
export function getTrendingMockMarkets(limit: number = 5): MockMarket[] {
  return [...MOCK_MARKETS].sort((a, b) => b.volume24h - a.volume24h).slice(0, limit);
}

/**
 * Get active mock markets
 */
export function getActiveMockMarkets(): MockMarket[] {
  return MOCK_MARKETS.filter((market) => market.status === 'active');
}

/**
 * Format market pool size for display
 */
export function formatPoolSize(poolSize: number): string {
  if (poolSize >= 1000000) {
    return `$${(poolSize / 1000000).toFixed(1)}M`;
  }
  if (poolSize >= 1000) {
    return `$${(poolSize / 1000).toFixed(1)}K`;
  }
  return `$${poolSize}`;
}

/**
 * Format end date for display
 */
export function formatEndDate(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diffDays > 0) {
    return `${diffDays}d ${diffHours}h`;
  }
  return `${diffHours}h`;
}

/**
 * Get category label
 */
export function getCategoryLabel(category: MockMarket['category']): string {
  const labels: Record<MockMarket['category'], string> = {
    sports: 'Sports',
    politics: 'Politics',
    crypto: 'Crypto',
    entertainment: 'Entertainment',
    other: 'Other',
  };
  return labels[category];
}

/**
 * Get category color
 */
export function getCategoryColor(category: MockMarket['category']): string {
  const colors: Record<MockMarket['category'], string> = {
    sports: 'bg-blue-100 text-blue-800',
    politics: 'bg-red-100 text-red-800',
    crypto: 'bg-orange-100 text-orange-800',
    entertainment: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[category];
}
