import { describe, it, expect } from 'vitest';
import { mapPolymarketToNexus, type PolymarketMarket } from './polymarketApi';

describe('Polymarket API Integration', () => {
  it('should map Polymarket market to NEXUS format', () => {
    const mockPolymarket: PolymarketMarket = {
      id: 'test-market-1',
      title: 'Bitcoin hits $100k by end of Q1?',
      description: 'Will Bitcoin reach $100,000 USD by March 31, 2026?',
      outcomes: [
        { name: 'Yes', probability: 0.35 },
        { name: 'No', probability: 0.65 },
      ],
      volume: 5000000,
      volume24h: 250000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T23:59:59Z',
      active: true,
    };

    const mapped = mapPolymarketToNexus(mockPolymarket);

    expect(mapped).toBeDefined();
    expect(mapped?.id).toBe('test-market-1');
    expect(mapped?.title).toBe('Bitcoin hits $100k by end of Q1?');
    expect(mapped?.category).toBe('crypto');
    expect(mapped?.yesOdds + mapped?.noOdds).toBe(100);
    expect(mapped?.poolSize).toBe(5000000);
    expect(mapped?.volume24h).toBe(250000);
    expect(mapped?.source).toBe('polymarket');
  });

  it('should infer crypto category from title', () => {
    const mockMarket: PolymarketMarket = {
      id: 'test-1',
      title: 'Bitcoin price prediction',
      description: 'Test',
      outcomes: [
        { name: 'Yes', probability: 0.5 },
        { name: 'No', probability: 0.5 },
      ],
      volume: 1000000,
      volume24h: 100000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T23:59:59Z',
      active: true,
    };

    const mapped = mapPolymarketToNexus(mockMarket);
    expect(mapped?.category).toBe('crypto');
  });

  it('should infer sports category from title', () => {
    const mockMarket: PolymarketMarket = {
      id: 'test-2',
      title: 'Lakers vs Warriors NBA game winner',
      description: 'Test',
      outcomes: [
        { name: 'Lakers', probability: 0.45 },
        { name: 'Warriors', probability: 0.55 },
      ],
      volume: 1000000,
      volume24h: 100000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2026-02-20T23:59:59Z',
      active: true,
    };

    const mapped = mapPolymarketToNexus(mockMarket);
    expect(mapped?.category).toBe('sports');
  });

  it('should infer politics category from title', () => {
    const mockMarket: PolymarketMarket = {
      id: 'test-3',
      title: 'US Election 2024: Trump to win?',
      description: 'Test',
      outcomes: [
        { name: 'Yes', probability: 0.52 },
        { name: 'No', probability: 0.48 },
      ],
      volume: 55000000,
      volume24h: 2500000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2024-11-05T23:59:59Z',
      active: true,
    };

    const mapped = mapPolymarketToNexus(mockMarket);
    expect(mapped?.category).toBe('politics');
  });

  it('should infer entertainment category from title', () => {
    const mockMarket: PolymarketMarket = {
      id: 'test-4',
      title: 'Will Taylor Swift perform at Super Bowl?',
      description: 'Test',
      outcomes: [
        { name: 'Yes', probability: 0.75 },
        { name: 'No', probability: 0.25 },
      ],
      volume: 2800000,
      volume24h: 180000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2026-02-09T23:59:59Z',
      active: true,
    };

    const mapped = mapPolymarketToNexus(mockMarket);
    expect(mapped?.category).toBe('entertainment');
  });

  it('should normalize odds to sum to 100', () => {
    const mockMarket: PolymarketMarket = {
      id: 'test-5',
      title: 'Test market',
      description: 'Test',
      outcomes: [
        { name: 'Yes', probability: 0.333 },
        { name: 'No', probability: 0.667 },
      ],
      volume: 1000000,
      volume24h: 100000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T23:59:59Z',
      active: true,
    };

    const mapped = mapPolymarketToNexus(mockMarket);
    expect(mapped?.yesOdds + mapped?.noOdds).toBe(100);
  });

  it('should return null for market with less than 2 outcomes', () => {
    const mockMarket: PolymarketMarket = {
      id: 'test-6',
      title: 'Invalid market',
      description: 'Test',
      outcomes: [{ name: 'Yes', probability: 1.0 }],
      volume: 1000000,
      volume24h: 100000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T23:59:59Z',
      active: true,
    };

    const mapped = mapPolymarketToNexus(mockMarket);
    expect(mapped).toBeNull();
  });

  it('should handle missing end date gracefully', () => {
    const mockMarket: PolymarketMarket = {
      id: 'test-7',
      title: 'Test market',
      description: 'Test',
      outcomes: [
        { name: 'Yes', probability: 0.5 },
        { name: 'No', probability: 0.5 },
      ],
      volume: 1000000,
      volume24h: 100000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '',
      active: true,
    };

    const mapped = mapPolymarketToNexus(mockMarket);
    expect(mapped?.endDate).toBeDefined();
    expect(mapped?.endDate.getTime()).toBeGreaterThan(0);
  });

  it('should calculate pool sizes based on probabilities', () => {
    const mockMarket: PolymarketMarket = {
      id: 'test-8',
      title: 'Test market',
      description: 'Test',
      outcomes: [
        { name: 'Yes', probability: 0.6 },
        { name: 'No', probability: 0.4 },
      ],
      volume: 1000000,
      volume24h: 100000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T23:59:59Z',
      active: true,
    };

    const mapped = mapPolymarketToNexus(mockMarket);
    const yesPoolAmount = Number(mapped?.yesPool || 0n) / 1e6;
    const noPoolAmount = Number(mapped?.noPool || 0n) / 1e6;
    const totalPool = yesPoolAmount + noPoolAmount;

    expect(totalPool).toBeCloseTo(1000000, 0);
  });

  it('should set correct status based on active flag', () => {
    const activeMarket: PolymarketMarket = {
      id: 'test-9',
      title: 'Active market',
      description: 'Test',
      outcomes: [
        { name: 'Yes', probability: 0.5 },
        { name: 'No', probability: 0.5 },
      ],
      volume: 1000000,
      volume24h: 100000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T23:59:59Z',
      active: true,
    };

    const mapped = mapPolymarketToNexus(activeMarket);
    expect(mapped?.status).toBe('active');
  });

  it('should set resolved status for inactive market', () => {
    const inactiveMarket: PolymarketMarket = {
      id: 'test-10',
      title: 'Resolved market',
      description: 'Test',
      outcomes: [
        { name: 'Yes', probability: 0.5 },
        { name: 'No', probability: 0.5 },
      ],
      volume: 1000000,
      volume24h: 100000,
      createdAt: '2026-01-01T00:00:00Z',
      endDate: '2026-03-31T23:59:59Z',
      active: false,
    };

    const mapped = mapPolymarketToNexus(inactiveMarket);
    expect(mapped?.status).toBe('resolved');
  });

  it('should have icon for each category', () => {
    const categories = ['crypto', 'sports', 'politics', 'entertainment', 'other'] as const;

    categories.forEach((category) => {
      let title = 'Test';
      if (category === 'crypto') title = 'Bitcoin price';
      if (category === 'sports') title = 'NBA game';
      if (category === 'politics') title = 'Election 2024';
      if (category === 'entertainment') title = 'Oscar winner';

      const mockMarket: PolymarketMarket = {
        id: `test-${category}`,
        title,
        description: 'Test',
        outcomes: [
          { name: 'Yes', probability: 0.5 },
          { name: 'No', probability: 0.5 },
        ],
        volume: 1000000,
        volume24h: 100000,
        createdAt: '2026-01-01T00:00:00Z',
        endDate: '2026-03-31T23:59:59Z',
        active: true,
      };

      const mapped = mapPolymarketToNexus(mockMarket);
      expect(mapped?.icon).toBeDefined();
      expect(mapped?.icon).toBeTruthy();
    });
  });
});
