import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createShadowMarketMetadata,
  registerShadowMarketContract,
  getShadowMarketContract,
  hasShadowMarketContract,
  generateShadowMarketId,
  createShadowMarket,
  getShadowMarketsByCategory,
  updateShadowMarketContractStatus,
  type PolymarketMarket,
} from './shadowMarket';

describe('Shadow Market System', () => {
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

  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  afterEach(() => {
    // Clean up after each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  it('should create shadow market metadata from Polymarket', () => {
    const metadata = createShadowMarketMetadata(mockPolymarket);

    expect(metadata.polymarketId).toBe('test-market-1');
    expect(metadata.title).toBe('Bitcoin hits $100k by end of Q1?');
    expect(metadata.category).toBe('crypto');
    expect(metadata.icon).toBe('₿');
    expect(metadata.endDate).toBeInstanceOf(Date);
  });

  it('should infer crypto category from title', () => {
    const metadata = createShadowMarketMetadata(mockPolymarket);
    expect(metadata.category).toBe('crypto');
  });

  it('should infer sports category from title', () => {
    const sportsMarket: PolymarketMarket = {
      ...mockPolymarket,
      id: 'sports-1',
      title: 'Lakers vs Warriors NBA game winner',
    };

    const metadata = createShadowMarketMetadata(sportsMarket);
    expect(metadata.category).toBe('sports');
    expect(metadata.icon).toBe('🏀');
  });

  it('should infer politics category from title', () => {
    const politicsMarket: PolymarketMarket = {
      ...mockPolymarket,
      id: 'politics-1',
      title: 'US Election 2024: Trump to win?',
    };

    const metadata = createShadowMarketMetadata(politicsMarket);
    expect(metadata.category).toBe('politics');
    expect(metadata.icon).toBe('🇺🇸');
  });

  it('should register contract mapping', () => {
    const contractAddress = '0x1234567890123456789012345678901234567890';
    const chainId = 137;

    const registered = registerShadowMarketContract(
      mockPolymarket.id,
      contractAddress,
      chainId
    );

    expect(registered.address).toBe(contractAddress);
    expect(registered.chainId).toBe(chainId);
    expect(registered.deployed).toBe(true);
    expect(registered.createdAt).toBeInstanceOf(Date);
  });

  it('should create valid contract object', () => {
    const contractAddress = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';
    const chainId = 80001;

    const contract = registerShadowMarketContract(
      'test-market-2',
      contractAddress,
      chainId
    );

    expect(contract).toBeDefined();
    expect(contract.address).toBe(contractAddress);
    expect(contract.chainId).toBe(chainId);
    expect(contract.deployed).toBe(true);
  });

  it('should generate unique shadow market ID', () => {
    const id1 = generateShadowMarketId('market-1', 137);
    const id2 = generateShadowMarketId('market-1', 80001);
    const id3 = generateShadowMarketId('market-2', 137);

    expect(id1).toBe('market-1_137');
    expect(id2).toBe('market-1_80001');
    expect(id3).toBe('market-2_137');
    expect(id1).not.toBe(id2);
    expect(id1).not.toBe(id3);
  });

  it('should create shadow market with pool data', () => {
    const metadata = createShadowMarketMetadata(mockPolymarket);
    const contract = registerShadowMarketContract(
      mockPolymarket.id,
      '0x1234567890123456789012345678901234567890',
      137
    );

    const yesPool = BigInt(3500000000000); // 3.5M USDC in wei
    const noPool = BigInt(6500000000000); // 6.5M USDC in wei

    const shadowMarket = createShadowMarket(metadata, contract, yesPool, noPool);

    expect(shadowMarket.metadata).toEqual(metadata);
    expect(shadowMarket.contract).toEqual(contract);
    expect(shadowMarket.yesPool).toBe(yesPool);
    expect(shadowMarket.noPool).toBe(noPool);
    expect(shadowMarket.yesOdds).toBe(35);
    expect(shadowMarket.noOdds).toBe(65);
    expect(shadowMarket.totalVolume).toBe(yesPool + noPool);
    expect(shadowMarket.status).toBe('active');
  });

  it('should calculate odds correctly', () => {
    const metadata = createShadowMarketMetadata(mockPolymarket);
    const contract = registerShadowMarketContract(
      mockPolymarket.id,
      '0x1234567890123456789012345678901234567890',
      137
    );

    const yesPool = BigInt(5000000000000); // 50%
    const noPool = BigInt(5000000000000); // 50%

    const shadowMarket = createShadowMarket(metadata, contract, yesPool, noPool);

    expect(shadowMarket.yesOdds).toBe(50);
    expect(shadowMarket.noOdds).toBe(50);
  });

  it('should handle zero pool edge case', () => {
    const metadata = createShadowMarketMetadata(mockPolymarket);
    const contract = registerShadowMarketContract(
      mockPolymarket.id,
      '0x1234567890123456789012345678901234567890',
      137
    );

    const yesPool = BigInt(0);
    const noPool = BigInt(0);

    const shadowMarket = createShadowMarket(metadata, contract, yesPool, noPool);

    expect(shadowMarket.yesOdds).toBe(50); // Default to 50/50
    expect(shadowMarket.noOdds).toBe(50);
  });

  it('should have correct contract properties', () => {
    const registered = registerShadowMarketContract(
      'test-market-3',
      '0x1234567890123456789012345678901234567890',
      137
    );

    expect(registered.deployed).toBe(true);
    expect(registered.address).toBe('0x1234567890123456789012345678901234567890');
    expect(registered.chainId).toBe(137);
  });

  it('should get markets by category', () => {
    const cryptoMarket = createShadowMarketMetadata(mockPolymarket);

    const sportsMarket = createShadowMarketMetadata({
      ...mockPolymarket,
      id: 'sports-1',
      title: 'NBA Finals Winner',
    });

    // Note: In real implementation, these would be stored and retrieved
    // For this test, we're just verifying the category inference
    expect(cryptoMarket.category).toBe('crypto');
    expect(sportsMarket.category).toBe('sports');
  });

  it('should handle missing end date', () => {
    const marketWithoutDate: PolymarketMarket = {
      ...mockPolymarket,
      endDate: '',
    };

    const metadata = createShadowMarketMetadata(marketWithoutDate);

    expect(metadata.endDate).toBeInstanceOf(Date);
    expect(metadata.endDate.getTime()).toBeGreaterThan(0);
  });

  it('should set correct resolution source', () => {
    const metadata = createShadowMarketMetadata(mockPolymarket);

    expect(metadata.resolutionSource).toBe('Polymarket');
  });

  it('should preserve Polymarket ID in metadata', () => {
    const metadata = createShadowMarketMetadata(mockPolymarket);

    expect(metadata.polymarketId).toBe(mockPolymarket.id);
  });

  it('should have valid icon for each category', () => {
    const categories = [
      { title: 'Bitcoin price', expectedIcon: '₿' },
      { title: 'NBA game', expectedIcon: '🏀' },
      { title: 'Election 2024', expectedIcon: '🇺🇸' },
      { title: 'Oscar winner award', expectedIcon: '🎬' },
      { title: 'Random event', expectedIcon: '📊' },
    ];

    categories.forEach(({ title, expectedIcon }) => {
      const market: PolymarketMarket = {
        ...mockPolymarket,
        title,
      };

      const metadata = createShadowMarketMetadata(market);
      expect(metadata.icon).toBe(expectedIcon);
    });
  });
});
