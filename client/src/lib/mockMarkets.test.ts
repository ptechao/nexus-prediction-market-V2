import { describe, it, expect } from 'vitest';
import {
  getAllMockMarkets,
  getMockMarketById,
  getMockMarketsByCategory,
  getTrendingMockMarkets,
  getActiveMockMarkets,
  formatPoolSize,
  formatEndDate,
  getCategoryLabel,
} from './mockMarkets';

describe('Mock Markets', () => {
  it('should return all mock markets', () => {
    const markets = getAllMockMarkets();
    expect(markets.length).toBeGreaterThan(0);
  });

  it('should have required fields for each market', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.id).toBeDefined();
      expect(market.title).toBeDefined();
      expect(market.description).toBeDefined();
      expect(market.category).toBeDefined();
      expect(market.endDate).toBeDefined();
      expect(market.poolSize).toBeGreaterThan(0);
      expect(market.yesOdds).toBeGreaterThanOrEqual(0);
      expect(market.yesOdds).toBeLessThanOrEqual(100);
      expect(market.noOdds).toBeGreaterThanOrEqual(0);
      expect(market.noOdds).toBeLessThanOrEqual(100);
    });
  });

  it('should have odds that sum to 100', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.yesOdds + market.noOdds).toBe(100);
    });
  });

  it('should get market by ID', () => {
    const markets = getAllMockMarkets();
    const firstMarket = markets[0];
    const found = getMockMarketById(firstMarket.id);
    expect(found).toEqual(firstMarket);
  });

  it('should return undefined for non-existent market ID', () => {
    const found = getMockMarketById('non-existent-id');
    expect(found).toBeUndefined();
  });

  it('should get markets by category', () => {
    const sportsMarkets = getMockMarketsByCategory('sports');
    sportsMarkets.forEach((market) => {
      expect(market.category).toBe('sports');
    });
  });

  it('should get trending markets sorted by volume', () => {
    const trending = getTrendingMockMarkets(3);
    expect(trending.length).toBeLessThanOrEqual(3);

    for (let i = 1; i < trending.length; i++) {
      expect(trending[i - 1].volume24h).toBeGreaterThanOrEqual(trending[i].volume24h);
    }
  });

  it('should get only active markets', () => {
    const active = getActiveMockMarkets();
    active.forEach((market) => {
      expect(market.status).toBe('active');
    });
  });

  it('should format pool size correctly', () => {
    const formatted1 = formatPoolSize(1250000);
    expect(formatted1).toMatch(/\$1\.[0-9]M/);
    expect(formatPoolSize(55000000)).toBe('$55.0M');
    expect(formatPoolSize(8400000)).toBe('$8.4M');
    expect(formatPoolSize(500)).toBe('$500');
  });

  it('should format end date correctly', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const formatted = formatEndDate(futureDate);
    expect(formatted).toContain('d');
    expect(formatted).toContain('h');
  });

  it('should get category labels', () => {
    expect(getCategoryLabel('sports')).toBe('Sports');
    expect(getCategoryLabel('politics')).toBe('Politics');
    expect(getCategoryLabel('crypto')).toBe('Crypto');
    expect(getCategoryLabel('entertainment')).toBe('Entertainment');
    expect(getCategoryLabel('other')).toBe('Other');
  });

  it('should have valid pool sizes', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      const yesPoolAmount = Number(market.yesPool) / 1e6;
      const noPoolAmount = Number(market.noPool) / 1e6;
      const totalPool = yesPoolAmount + noPoolAmount;
      expect(totalPool).toBeCloseTo(market.poolSize, 0);
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

  it('should have valid end dates', () => {
    const markets = getAllMockMarkets();
    markets.forEach((market) => {
      expect(market.endDate).toBeInstanceOf(Date);
      expect(market.endDate.getTime()).toBeGreaterThan(0);
    });
  });
});
