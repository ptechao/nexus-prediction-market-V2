import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Flame, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { MarketCard, MarketCardSkeleton, type Market } from '@/components/MarketCard';

// ─── Fallback Mock Markets ─────────────────────────────────────────────
const FALLBACK_MARKETS: Market[] = [
  {
    id: 'fallback-1',
    title: 'Lakers vs Warriors: Will Lakers win the 2026 NBA Finals?',
    description:
      'Predict whether the Los Angeles Lakers will defeat the Golden State Warriors and win the 2026 NBA Championship Finals.',
    category: 'NBA',
    endDate: '2026-06-20T00:00:00Z',
    yesOdds: 62,
    noOdds: 38,
    totalPool: 2450000,
    volume24h: 185000,
    participants: 3842,
    isTrending: true,
  },
  {
    id: 'fallback-2',
    title: 'Will Bitcoin exceed $150,000 by end of 2026?',
    description:
      'Predict whether Bitcoin (BTC) will reach a price above $150,000 USD on any major exchange before December 31, 2026.',
    category: 'Bitcoin',
    endDate: '2026-12-31T00:00:00Z',
    yesOdds: 45,
    noOdds: 55,
    totalPool: 5800000,
    volume24h: 420000,
    participants: 12560,
    isTrending: true,
  },
  {
    id: 'fallback-3',
    title: 'US Presidential Approval Rating above 50% in March 2026?',
    description:
      'Will the sitting US President maintain an approval rating above 50% in major polling averages during March 2026?',
    category: 'Politics',
    endDate: '2026-03-31T00:00:00Z',
    yesOdds: 34,
    noOdds: 66,
    totalPool: 1200000,
    volume24h: 95000,
    participants: 5210,
    isTrending: false,
  },
  {
    id: 'fallback-4',
    title: 'Will Ethereum ETF inflows exceed $10B in Q1 2026?',
    description:
      'Predict whether cumulative net inflows into all spot Ethereum ETFs will surpass $10 billion by end of Q1 2026.',
    category: 'Ethereum',
    endDate: '2026-03-31T00:00:00Z',
    yesOdds: 58,
    noOdds: 42,
    totalPool: 3100000,
    volume24h: 275000,
    participants: 7830,
    isTrending: true,
  },
  {
    id: 'fallback-5',
    title: 'Will the S&P 500 close above 6,500 by June 2026?',
    description:
      'Predict whether the S&P 500 index will close above 6,500 points on any trading day before June 30, 2026.',
    category: 'Stock Market',
    endDate: '2026-06-30T00:00:00Z',
    yesOdds: 71,
    noOdds: 29,
    totalPool: 1850000,
    volume24h: 132000,
    participants: 4150,
    isTrending: false,
  },
  {
    id: 'fallback-6',
    title: 'Will Japan hold a snap election before September 2026?',
    description:
      'Predict whether the Japanese Prime Minister will dissolve the House of Representatives and call a snap general election before September 2026.',
    category: 'Politics',
    endDate: '2026-09-01T00:00:00Z',
    yesOdds: 28,
    noOdds: 72,
    totalPool: 680000,
    volume24h: 42000,
    participants: 1920,
    isTrending: false,
  },
];

// ─── Markets Page ──────────────────────────────────────────────────────
export default function Markets() {
  const [filter, setFilter] = useState<string>('all');
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);

  const {
    data: liveMarkets,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = trpc.markets.top.useQuery(
    { limit: 20 },
    {
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  // Use live data if available, otherwise fallback
  const allMarkets: Market[] =
    liveMarkets && liveMarkets.length > 0 ? liveMarkets : FALLBACK_MARKETS;
  const isLive = !isError && liveMarkets && liveMarkets.length > 0;

  // Derive unique event types from data
  const eventTypes = [
    { key: 'all', label: 'All Markets' },
    ...Array.from(
      new Set(allMarkets.map((m) => ('eventType' in m ? (m as any).eventType : 'other')))
    )
      .filter((t) => t !== 'other')
      .map((t) => ({
        key: t as string,
        label: (t as string).charAt(0).toUpperCase() + (t as string).slice(1),
      })),
  ];

  // Filter markets
  const filteredMarkets = allMarkets.filter((m) => {
    const eventType = 'eventType' in m ? (m as any).eventType : 'other';
    const matchesFilter = filter === 'all' || eventType === filter;
    const matchesTrending = !showTrendingOnly || m.isTrending;
    return matchesFilter && matchesTrending;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              Prediction Markets
            </h1>
            <p className="text-lg text-slate-400">
              Bet on real-world events with transparent odds and instant settlement
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Live/Offline indicator */}
            {isLive ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Wifi className="w-3 h-3" />
                Live Data
              </span>
            ) : isError ? (
              <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                <WifiOff className="w-3 h-3" />
                Offline Mode
              </span>
            ) : null}
            {/* Refresh button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="space-y-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {eventTypes.map((type) => (
              <Button
                key={type.key}
                variant={filter === type.key ? 'default' : 'outline'}
                onClick={() => setFilter(type.key)}
                className={`whitespace-nowrap transition-all duration-200 ${
                  filter === type.key
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-500/20 border-0'
                    : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50'
                }`}
              >
                {type.label}
              </Button>
            ))}
          </div>

          {/* Trending Toggle */}
          <div className="flex items-center gap-3 px-1 flex-wrap">
            <Button
              onClick={() => setShowTrendingOnly(!showTrendingOnly)}
              className={`transition-all duration-300 flex items-center gap-2 border-0 ${
                showTrendingOnly
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white shadow-lg shadow-orange-500/20 scale-105'
                  : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span className="font-semibold">Trending Markets</span>
              {showTrendingOnly && (
                <span className="ml-1 inline-flex items-center justify-center w-5 h-5 bg-white/20 text-white rounded-full text-xs font-bold">
                  ✓
                </span>
              )}
            </Button>
            {showTrendingOnly && (
              <span className="text-sm text-slate-500">
                Showing {filteredMarkets.length} trending market
                {filteredMarkets.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <MarketCardSkeleton key={`skel-${i}`} />
              ))
            : filteredMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
        </div>

        {/* Empty State */}
        {!isLoading && filteredMarkets.length === 0 && (
          <div className="text-center py-16">
            <Flame className="w-14 h-14 text-slate-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-400 mb-2">
              {showTrendingOnly
                ? 'No trending markets found for this filter'
                : 'No markets found for this filter'}
            </p>
            <p className="text-sm text-slate-500">
              Try selecting a different category
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
