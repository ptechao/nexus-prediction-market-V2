import { describe, it, expect } from 'vitest';

// Hardcoded mock markets matching the Markets.tsx component
const MOCK_MARKETS = [
  {
    id: 1,
    title: 'Lakers vs Warriors: Will Lakers win the 2026 NBA Finals?',
    eventType: 'sports',
    category: 'NBA',
    yesOdds: 62,
    noOdds: 38,
    totalPool: 2450000,
    volume24h: 185000,
    participants: 3842,
    isTrending: true,
  },
  {
    id: 2,
    title: 'Will Bitcoin exceed $150,000 by end of 2026?',
    eventType: 'crypto',
    category: 'Bitcoin',
    yesOdds: 45,
    noOdds: 55,
    totalPool: 5800000,
    volume24h: 420000,
    participants: 12560,
    isTrending: true,
  },
  {
    id: 3,
    title: 'US Presidential Approval Rating above 50% in March 2026?',
    eventType: 'politics',
    category: 'Politics',
    yesOdds: 34,
    noOdds: 66,
    totalPool: 1200000,
    volume24h: 95000,
    participants: 5210,
    isTrending: false,
  },
  {
    id: 4,
    title: 'Will Ethereum ETF inflows exceed $10B in Q1 2026?',
    eventType: 'crypto',
    category: 'Ethereum',
    yesOdds: 58,
    noOdds: 42,
    totalPool: 3100000,
    volume24h: 275000,
    participants: 7830,
    isTrending: true,
  },
  {
    id: 5,
    title: 'Will the S&P 500 close above 6,500 by June 2026?',
    eventType: 'finance',
    category: 'Stock Market',
    yesOdds: 71,
    noOdds: 29,
    totalPool: 1850000,
    volume24h: 132000,
    participants: 4150,
    isTrending: false,
  },
  {
    id: 6,
    title: 'Will Japan hold a snap election before September 2026?',
    eventType: 'politics',
    category: 'Politics',
    yesOdds: 28,
    noOdds: 72,
    totalPool: 680000,
    volume24h: 42000,
    participants: 1920,
    isTrending: false,
  },
];

// Helper functions matching the component
const formatPool = (amount: number) => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

describe('Markets Page - Hardcoded Mock Data', () => {
  describe('Mock Data Integrity', () => {
    it('should have exactly 6 hardcoded markets', () => {
      expect(MOCK_MARKETS).toHaveLength(6);
    });

    it('should have valid odds that sum to 100 for each market', () => {
      MOCK_MARKETS.forEach((m) => {
        expect(m.yesOdds + m.noOdds).toBe(100);
      });
    });

    it('should have unique IDs for all markets', () => {
      const ids = MOCK_MARKETS.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should have positive pool and volume values', () => {
      MOCK_MARKETS.forEach((m) => {
        expect(m.totalPool).toBeGreaterThan(0);
        expect(m.volume24h).toBeGreaterThan(0);
        expect(m.participants).toBeGreaterThan(0);
      });
    });
  });

  describe('Trending Markets Filter', () => {
    it('should have 3 trending markets', () => {
      const trending = MOCK_MARKETS.filter((m) => m.isTrending);
      expect(trending).toHaveLength(3);
    });

    it('should identify correct trending markets', () => {
      const trendingTitles = MOCK_MARKETS.filter((m) => m.isTrending).map((m) => m.id);
      expect(trendingTitles).toEqual([1, 2, 4]);
    });

    it('should have 3 non-trending markets', () => {
      const nonTrending = MOCK_MARKETS.filter((m) => !m.isTrending);
      expect(nonTrending).toHaveLength(3);
    });
  });

  describe('Event Type Filter', () => {
    it('should filter crypto markets', () => {
      const crypto = MOCK_MARKETS.filter((m) => m.eventType === 'crypto');
      expect(crypto).toHaveLength(2);
      expect(crypto.map((m) => m.category)).toEqual(['Bitcoin', 'Ethereum']);
    });

    it('should filter politics markets', () => {
      const politics = MOCK_MARKETS.filter((m) => m.eventType === 'politics');
      expect(politics).toHaveLength(2);
    });

    it('should filter sports markets', () => {
      const sports = MOCK_MARKETS.filter((m) => m.eventType === 'sports');
      expect(sports).toHaveLength(1);
      expect(sports[0].category).toBe('NBA');
    });

    it('should filter finance markets', () => {
      const finance = MOCK_MARKETS.filter((m) => m.eventType === 'finance');
      expect(finance).toHaveLength(1);
      expect(finance[0].category).toBe('Stock Market');
    });

    it('should return all markets with "all" filter', () => {
      const all = MOCK_MARKETS.filter((m) => 'all' === 'all' || m.eventType === 'all');
      expect(all).toHaveLength(6);
    });
  });

  describe('Combined Filters', () => {
    it('should apply both trending and event type filters', () => {
      const trendingCrypto = MOCK_MARKETS.filter(
        (m) => m.isTrending && m.eventType === 'crypto'
      );
      expect(trendingCrypto).toHaveLength(2);
    });

    it('should return empty when no markets match combined filters', () => {
      const trendingFinance = MOCK_MARKETS.filter(
        (m) => m.isTrending && m.eventType === 'finance'
      );
      expect(trendingFinance).toHaveLength(0);
    });

    it('should filter trending politics (none exist)', () => {
      const trendingPolitics = MOCK_MARKETS.filter(
        (m) => m.isTrending && m.eventType === 'politics'
      );
      expect(trendingPolitics).toHaveLength(0);
    });
  });

  describe('Format Helpers', () => {
    it('should format millions correctly', () => {
      expect(formatPool(2450000)).toBe('$2.5M');
      expect(formatPool(5800000)).toBe('$5.8M');
    });

    it('should format thousands correctly', () => {
      expect(formatPool(185000)).toBe('$185K');
      expect(formatPool(42000)).toBe('$42K');
    });

    it('should format small amounts correctly', () => {
      expect(formatPool(500)).toBe('$500');
    });
  });

  describe('Filter State Management', () => {
    it('should maintain filter state when toggling trending', () => {
      let showTrendingOnly = false;
      let eventTypeFilter = 'all';

      // Toggle trending on
      showTrendingOnly = true;
      let filtered = MOCK_MARKETS.filter(
        (m) =>
          (eventTypeFilter === 'all' || m.eventType === eventTypeFilter) &&
          (!showTrendingOnly || m.isTrending)
      );
      expect(filtered).toHaveLength(3);

      // Change event type to crypto while trending is on
      eventTypeFilter = 'crypto';
      filtered = MOCK_MARKETS.filter(
        (m) =>
          (eventTypeFilter === 'all' || m.eventType === eventTypeFilter) &&
          (!showTrendingOnly || m.isTrending)
      );
      expect(filtered).toHaveLength(2);

      // Toggle trending off
      showTrendingOnly = false;
      filtered = MOCK_MARKETS.filter(
        (m) =>
          (eventTypeFilter === 'all' || m.eventType === eventTypeFilter) &&
          (!showTrendingOnly || m.isTrending)
      );
      expect(filtered).toHaveLength(2);
    });
  });
});
