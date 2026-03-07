import { describe, it, expect } from 'vitest';
import { getAllMockMarkets, getMockMarketsByCategory, getTrendingMockMarkets } from '@/lib/mockMarkets';

describe('useMarkets Hook - Underlying Functions', () => {
  it('should return mock markets', () => {
    const markets = getAllMockMarkets();
    expect(markets.length).toBeGreaterThan(0);
  });

  it('should have required market fields', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.id).toBeDefined();
      expect(market.title).toBeDefined();
      expect(market.poolSize).toBeGreaterThan(0);
      expect(market.yesOdds).toBeGreaterThanOrEqual(0);
      expect(market.noOdds).toBeGreaterThanOrEqual(0);
    });
  });

  it('should filter markets by category', () => {
    const sportsMarkets = getMockMarketsByCategory('sports');
    sportsMarkets.forEach((market) => {
      expect(market.category).toBe('sports');
    });
  });

  it('should get trending markets', () => {
    const trending = getTrendingMockMarkets(3);
    expect(trending.length).toBeLessThanOrEqual(3);
    
    for (let i = 1; i < trending.length; i++) {
      expect(trending[i - 1].volume24h).toBeGreaterThanOrEqual(trending[i].volume24h);
    }
  });

  it('should support different categories', () => {
    const categories = ['sports', 'politics', 'crypto', 'entertainment', 'other'] as const;
    
    categories.forEach((category) => {
      const markets = getMockMarketsByCategory(category);
      markets.forEach((market) => {
        expect(market.category).toBe(category);
      });
    });
  });

  it('should have valid odds percentages', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.yesOdds + market.noOdds).toBe(100);
      expect(market.yesOdds).toBeGreaterThanOrEqual(0);
      expect(market.yesOdds).toBeLessThanOrEqual(100);
    });
  });

  it('should have valid pool data', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.poolSize).toBeGreaterThan(0);
      expect(market.yesPool).toBeGreaterThan(0n);
      expect(market.noPool).toBeGreaterThan(0n);
    });
  });

  it('should have valid participant counts', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.participants).toBeGreaterThan(0);
    });
  });

  it('should have valid volume data', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.volume24h).toBeGreaterThanOrEqual(0);
    });
  });

  it('should have icons for all markets', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.icon).toBeDefined();
      expect(market.icon).toBeTruthy();
    });
  });

  it('should have unique market IDs', () => {
    const markets = getAllMockMarkets();
    const ids = markets.map((m) => m.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('should have active status for all markets', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.status).toBe('active');
    });
  });

  it('should have valid end dates', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.endDate).toBeInstanceOf(Date);
      expect(market.endDate.getTime()).toBeGreaterThan(0);
    });
  });

  it('should have descriptions', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.description).toBeDefined();
      expect(market.description.length).toBeGreaterThan(0);
    });
  });
});
