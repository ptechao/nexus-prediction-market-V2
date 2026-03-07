import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We test the module's mapping logic by mocking global fetch
const MOCK_POLYMARKET_RESPONSE = [
  {
    id: '903193',
    title: 'Presidential Election Winner 2024',
    slug: 'presidential-election-winner-2024',
    description: 'This is a market on predicting the winner of the 2024 presidential election.',
    image: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/test.png',
    icon: null,
    volume: 3686335059.295466,
    volume1wk: 50000000,
    volume1mo: 200000000,
    endDate: '2026-11-05T12:00:00Z',
    startDate: '2025-01-01T00:00:00Z',
    active: true,
    closed: false,
    featured: true,
    commentCount: 1500,
    tags: [
      { label: 'Politics', slug: 'politics' },
      { label: 'US Election', slug: 'us-election' },
    ],
    markets: [
      {
        question: 'Will Donald Trump win the 2024 US Presidential Election?',
        outcomePrices: '["0.56", "0.44"]',
        outcomes: '["Yes", "No"]',
        volume: '1531479284.504353',
        volumeNum: 1531479284.504353,
        active: true,
        image: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/trump.png',
        slug: 'will-trump-win',
      },
    ],
  },
  {
    id: '100200',
    title: 'NBA Champion',
    slug: 'nba-champion',
    description: 'Who will win the NBA championship?',
    image: 'https://polymarket-upload.s3.us-east-2.amazonaws.com/nba.png',
    icon: null,
    volume: 1712132663.96,
    volume1wk: 6823722.84,
    volume1mo: 14755795.85,
    endDate: '2026-06-23T12:00:00Z',
    startDate: '2025-09-24T00:00:00Z',
    active: true,
    closed: false,
    featured: false,
    commentCount: 800,
    tags: [
      { label: 'NBA', slug: 'nba' },
      { label: 'Basketball', slug: 'basketball' },
      { label: 'Sports', slug: 'sports' },
    ],
    markets: [
      {
        question: 'Will the LA Clippers win the 2025 NBA Finals?',
        outcomePrices: '["0.35", "0.65"]',
        outcomes: '["Yes", "No"]',
        volume: '69838997.39',
        volumeNum: 69838997.39,
        active: true,
        image: null,
        slug: 'clippers-nba-finals',
      },
    ],
  },
  {
    id: '999',
    title: 'Empty Market Event',
    slug: 'empty-market',
    description: 'No sub-markets',
    image: null,
    icon: null,
    volume: 100,
    volume1wk: 0,
    volume1mo: 0,
    endDate: '2025-12-31T00:00:00Z',
    startDate: '2025-01-01T00:00:00Z',
    active: true,
    closed: false,
    featured: false,
    commentCount: 0,
    tags: [],
    markets: [], // no sub-markets → should be filtered out
  },
];

describe('Polymarket API Integration', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.resetModules();
  });

  it('fetchTopMarkets maps Polymarket events to NexusMarket format', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(MOCK_POLYMARKET_RESPONSE),
    }) as any;

    const { fetchTopMarkets } = await import('./polymarket');
    const markets = await fetchTopMarkets(10);

    // Should filter out the empty market event (no sub-markets)
    expect(markets.length).toBe(2);

    // First market: Politics
    const politics = markets[0];
    expect(politics.id).toBe('903193');
    expect(politics.title).toBe('Presidential Election Winner 2024');
    expect(politics.category).toBe('Politics');
    expect(politics.eventType).toBe('politics');
    expect(politics.yesOdds).toBe(56);
    expect(politics.noOdds).toBe(44);
    expect(politics.totalPool).toBe(3686335059.295466);
    expect(politics.image).toBe('https://polymarket-upload.s3.us-east-2.amazonaws.com/test.png');
    expect(politics.slug).toBe('presidential-election-winner-2024');
    expect(politics.polymarketUrl).toBe('https://polymarket.com/event/presidential-election-winner-2024');
    expect(politics.isTrending).toBe(true); // volume1wk > 1M or featured

    // Second market: NBA
    const nba = markets[1];
    expect(nba.id).toBe('100200');
    expect(nba.title).toBe('NBA Champion');
    expect(nba.category).toBe('NBA');
    expect(nba.eventType).toBe('sports');
    expect(nba.yesOdds).toBe(35);
    expect(nba.noOdds).toBe(65);
    expect(nba.isTrending).toBe(true); // volume1wk > 1M
  });

  it('fetchTopMarkets passes correct URL parameters with increased fetch limit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    globalThis.fetch = mockFetch as any;

    const { fetchTopMarkets } = await import('./polymarket');
    await fetchTopMarkets(15);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('limit=45'); // 15 * 3 for filtering
    expect(calledUrl).toContain('order=volume');
    expect(calledUrl).toContain('ascending=false');
  });

  it('fetchTopMarkets throws on non-OK response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    }) as any;

    const { fetchTopMarkets } = await import('./polymarket');
    await expect(fetchTopMarkets()).rejects.toThrow('Polymarket API error: 500');
  });

  it('handles malformed outcomePrices gracefully', async () => {
    const malformedEvent = {
      ...MOCK_POLYMARKET_RESPONSE[0],
      id: 'malformed-1',
      markets: [
        {
          ...MOCK_POLYMARKET_RESPONSE[0].markets[0],
          outcomePrices: 'invalid-json',
        },
      ],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([malformedEvent]),
    }) as any;

    const { fetchTopMarkets } = await import('./polymarket');
    const markets = await fetchTopMarkets();

    expect(markets.length).toBe(1);
    // Should fallback to 50/50
    expect(markets[0].yesOdds).toBe(50);
    expect(markets[0].noOdds).toBe(50);
  });

  it('categorizes unknown tags as General/other', async () => {
    const unknownTagEvent = {
      ...MOCK_POLYMARKET_RESPONSE[0],
      id: 'unknown-tag-1',
      tags: [{ label: 'SomethingRandom', slug: 'something-random' }],
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([unknownTagEvent]),
    }) as any;

    const { fetchTopMarkets } = await import('./polymarket');
    const markets = await fetchTopMarkets();

    expect(markets[0].category).toBe('General');
    expect(markets[0].eventType).toBe('other');
  });

  it('fetchMarketsByTag includes tag parameter with increased fetch limit', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });
    globalThis.fetch = mockFetch as any;

    const { fetchMarketsByTag } = await import('./polymarket');
    await fetchMarketsByTag('politics', 5);

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('tag=politics');
    expect(calledUrl).toContain('limit=15'); // 5 * 3 for filtering
  });

  it('estimates participants from volume when commentCount is low', async () => {
    const highVolumeEvent = {
      ...MOCK_POLYMARKET_RESPONSE[0],
      id: 'high-vol-1',
      commentCount: 5, // very low
      volume: 5000000, // $5M → 5000000/500 = 10000 estimated
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([highVolumeEvent]),
    }) as any;

    const { fetchTopMarkets } = await import('./polymarket');
    const markets = await fetchTopMarkets();

    // Should use volume-based estimate (10000) since it's higher than commentCount (5)
    expect(markets[0].participants).toBe(10000);
  });

  it('description is truncated to 300 characters', async () => {
    const longDescEvent = {
      ...MOCK_POLYMARKET_RESPONSE[0],
      id: 'long-desc-1',
      description: 'A'.repeat(500),
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([longDescEvent]),
    }) as any;

    const { fetchTopMarkets } = await import('./polymarket');
    const markets = await fetchTopMarkets();

    expect(markets[0].description.length).toBe(300);
  });

  it('filters out expired events (end date < 24h from now)', async () => {
    const expiredEvent = {
      ...MOCK_POLYMARKET_RESPONSE[0],
      id: 'expired-1',
      endDate: new Date(Date.now() - 1000).toISOString(), // Already ended
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([expiredEvent, MOCK_POLYMARKET_RESPONSE[1]]),
    }) as any;

    const { fetchTopMarkets } = await import('./polymarket');
    const markets = await fetchTopMarkets();

    // Should only return NBA market, not the expired one
    expect(markets.length).toBe(1);
    expect(markets[0].id).toBe('100200');
  });

  it('filters out low-volume markets (< $100)', async () => {
    const lowVolumeEvent = {
      ...MOCK_POLYMARKET_RESPONSE[0],
      id: 'low-vol-1',
      volume: 50, // Less than 100
    };

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([lowVolumeEvent, MOCK_POLYMARKET_RESPONSE[1]]),
    }) as any;

    const { fetchTopMarkets } = await import('./polymarket');
    const markets = await fetchTopMarkets();

    // Should only return NBA market, not the low-volume one
    expect(markets.length).toBe(1);
    expect(markets[0].id).toBe('100200');
  });
});
