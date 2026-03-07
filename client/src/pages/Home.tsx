import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  Flame,
  Zap,
  Shield,
  Copy,
  Droplets,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { MarketCard, MarketCardSkeleton, formatPool, type Market } from '@/components/MarketCard';

// ─── Fallback Mock Data (shown when API is unavailable) ────────────────
const FALLBACK_MARKETS: Market[] = [
  {
    id: 'mock-1',
    title: 'Trump vs Biden: Who wins the 2028 Presidential Election?',
    description:
      'Predict whether Donald Trump or Joe Biden will win the 2028 US Presidential Election. Market resolves based on certified election results.',
    category: 'Politics',
    endDate: '2028-11-05T00:00:00Z',
    yesOdds: 56,
    noOdds: 44,
    totalPool: 8200000,
    volume24h: 650000,
    participants: 24300,
    isTrending: true,
  },
  {
    id: 'mock-2',
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
    id: 'mock-3',
    title: 'Will BTC exceed $200,000 by end of 2026?',
    description:
      'Predict whether Bitcoin (BTC) will reach a price above $200,000 USD on any major exchange before December 31, 2026.',
    category: 'Bitcoin',
    endDate: '2026-12-31T00:00:00Z',
    yesOdds: 38,
    noOdds: 62,
    totalPool: 5800000,
    volume24h: 420000,
    participants: 12560,
    isTrending: true,
  },
];

// ─── Home Page ─────────────────────────────────────────────────────────
export default function Home() {
  const { data: liveMarkets, isLoading, isError } = trpc.markets.top.useQuery(
    { limit: 6 },
    {
      staleTime: 60_000, // 1 min cache
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  // Use live data if available, otherwise fallback
  const markets = liveMarkets && liveMarkets.length > 0 ? liveMarkets : FALLBACK_MARKETS;
  const isLive = !isError && liveMarkets && liveMarkets.length > 0;
  const displayMarkets = markets.slice(0, 3); // Show top 3 on homepage

  // Compute aggregate stats from live data
  const totalVolume = markets.reduce((sum, m) => sum + m.totalPool, 0);
  const totalTraders = markets.reduce((sum, m) => sum + m.participants, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-5">
            <span className="text-white">Predict the Future,</span>
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trade with Confidence
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">
            Join NEXUS — the decentralized prediction market platform. Bet on
            real-world events and copy the strategies of top traders.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 sm:gap-14 mb-4">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                {formatPool(totalVolume)}
              </div>
              <p className="text-sm text-slate-500">Total Volume</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                {markets.length.toLocaleString()}
              </div>
              <p className="text-sm text-slate-500">Active Markets</p>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400">
                {totalTraders >= 1_000_000
                  ? `${(totalTraders / 1_000_000).toFixed(1)}M`
                  : totalTraders >= 1_000
                    ? `${(totalTraders / 1_000).toFixed(1)}K`
                    : totalTraders.toLocaleString()}
              </div>
              <p className="text-sm text-slate-500">Traders</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hot Markets ── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-400" />
              <h2 className="text-2xl font-bold text-white">Hot Markets</h2>
              {/* Live indicator */}
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Wifi className="w-3 h-3" />
                  Live
                </span>
              ) : isError ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  <WifiOff className="w-3 h-3" />
                  Offline
                </span>
              ) : null}
            </div>
            <Link
              href="/markets"
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              View All Markets
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Market Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <MarketCardSkeleton key={`skel-${i}`} />
                ))
              : displayMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-10">
            Why Choose NEXUS?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: 'Instant Settlement',
                desc: 'Bets resolved instantly on-chain with transparent oracle verification.',
                color: 'text-yellow-400',
              },
              {
                icon: Shield,
                title: 'Secure & Audited',
                desc: 'Smart contracts audited by leading security firms for maximum safety.',
                color: 'text-emerald-400',
              },
              {
                icon: Copy,
                title: 'Copy Trading',
                desc: 'Follow top traders and replicate their winning strategies automatically.',
                color: 'text-cyan-400',
              },
              {
                icon: Droplets,
                title: 'High Liquidity',
                desc: 'Deep order books and tight spreads for optimal trading conditions.',
                color: 'text-blue-400',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600/50 transition-all duration-300"
              >
                <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto text-center py-14 px-8 rounded-2xl bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/20">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Start Predicting?
          </h2>
          <p className="text-lg text-slate-300 mb-6">
            Join thousands of traders on NEXUS and start earning returns today.
          </p>
          <Link href="/markets" className="inline-block">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-6 px-8 text-lg border-0 shadow-lg shadow-cyan-500/20">
              Explore All Markets
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
