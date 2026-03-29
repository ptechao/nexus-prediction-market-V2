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
  TrendingUp,
  BarChart3,
  Users,
  Globe,
  Languages,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { MarketCard, MarketCardSkeleton, formatPool, type Market } from '@/components/MarketCard';
import { useTranslation } from '@/hooks/useTranslation';
import { AITranslatedText } from '@/components/AITranslatedText';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { useRef, useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

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
  const { t } = useTranslation();
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

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    setCurrent(api.selectedScrollSnap());

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  // Set up carousel autoplay plugin
  const plugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  const HERO_SLIDES = useMemo(() => {
    const s1Title = t('home.heroTitle1');
    const s1Highlight = t('home.heroTitle2');
    const s1Desc = t('home.heroSubtitle');
    
    const s2Title = t('home.slide2Title');
    const s2Highlight = t('home.slide2Highlight');
    const s2Desc = t('home.slide2Desc');
    
    const s3Title = t('home.slide3Title');
    const s3Highlight = t('home.slide3Highlight');
    const s3Desc = t('home.slide3Desc');

    return [
      {
        id: 1,
        title: 'Predict the Future',
        highlight: 'Trade with Confidence',
        desc: 'Join NEXUS — the decentralized prediction market platform. Experience the power of decentralized predictions with AI-driven insights.',
        image: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=1920&auto=format&fit=crop',
      },
      {
        id: 2,
        title: 'Global Elections & Politics',
        highlight: 'Who will lead?',
        desc: 'Trade on political outcomes with the deepest liquidity and instant on-chain settlement guarantees.',
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1920&auto=format&fit=crop',
      },
      {
        id: 3,
        title: 'Major League Sports',
        highlight: 'Back your teams',
        desc: 'Sports predictions powered by our proprietary AI model. Get the edge before the whistle blows.',
        image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=1920&auto=format&fit=crop',
      }
    ];
  }, [t]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative w-full border-b border-border bg-slate-950 overflow-hidden group">
        <Carousel
          plugins={[plugin.current]}
          setApi={setApi}
          className="w-full"
          onMouseEnter={() => plugin.current.stop()}
          onMouseLeave={() => plugin.current.reset()}
          opts={{ 
            loop: true,
            align: "start",
          }}
        >
          <CarouselContent>
            {HERO_SLIDES.map((slide) => (
              <CarouselItem key={slide.id}>
                <div className="relative w-full h-[280px] sm:h-[340px] lg:h-[400px] flex items-center justify-center">
                  <div 
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-[20s] hover:scale-110"
                    style={{ backgroundImage: `url('${slide.image}')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  </div>

                  <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 text-left py-6 sm:py-0">
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-4 text-white drop-shadow-2xl">
                        <AITranslatedText text={slide.title} />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 block mt-2">
                             <AITranslatedText text={slide.highlight} />
                        </span>
                    </h1>
                    <div className="text-sm sm:text-lg lg:text-xl text-slate-300 max-w-2xl mb-8 drop-shadow-xl font-medium leading-relaxed opacity-90">
                        <AITranslatedText text={slide.desc} />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                      <Link href="/markets">
                        <Button size="lg" className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-bold border-none shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
                          <AITranslatedText text={t('home.startPredicting') || 'Explore Markets'} />
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* Navigation Buttons */}
          <div className="hidden md:block">
            <CarouselPrevious className="left-4 lg:left-8 bg-black/40 hover:bg-black/60 text-white border-white/20 w-12 h-12" />
            <CarouselNext className="right-4 lg:right-8 bg-black/40 hover:bg-black/60 text-white border-white/20 w-12 h-12" />
          </div>

          {/* Pagination Dots */}
          <div className="absolute bottom-16 sm:bottom-20 left-0 right-0 z-30 flex justify-center gap-2 pointer-events-none">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300 pointer-events-auto",
                  current === index 
                    ? "bg-cyan-400 w-6" 
                    : "bg-white/30 hover:bg-white/50"
                )}
                onClick={() => api?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </Carousel>

        {/* Global Stats Overlay Strip */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/60 backdrop-blur-md border-t border-white/10 hidden sm:block">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center text-white">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t('home.totalVolume') || 'Total Volume'}</span>
              <span className="font-mono text-xl font-bold text-cyan-400">{formatPool(totalVolume)}</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t('home.activeMarkets') || 'Active Markets'}</span>
              <span className="font-mono text-xl font-bold">{markets.length.toLocaleString()}</span>
            </div>
            <div className="w-px h-8 bg-white/20"></div>
            <div className="flex flex-col items-end">
              <span className="text-xs text-slate-400 uppercase tracking-widest mb-1">{t('home.traders') || 'Traders'}</span>
              <span className="font-mono text-xl font-bold text-emerald-400">
                {totalTraders >= 1_000_000
                  ? `${(totalTraders / 1_000_000).toFixed(1)}M`
                  : totalTraders >= 1_000
                    ? `${(totalTraders / 1_000).toFixed(1)}K`
                    : totalTraders.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hot Markets ── */}
      <section className="px-4 sm:px-6 lg:px-8 py-8 sm:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-3">
              <Flame className="w-6 h-6 text-orange-500" />
              <h2 className="text-2xl font-bold text-foreground">{t('home.hotMarkets') || 'Trending Markets'}</h2>
              {/* Live indicator */}
              {isLive ? (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 dark:bg-green-500/10 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
                  <Wifi className="w-3 h-3" />
                  {t('home.live') || 'Live'}
                </span>
              ) : isError ? (
                <span className="inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 px-2 py-0.5 rounded-full font-medium">
                  <WifiOff className="w-3 h-3" />
                  {t('home.offline') || 'Offline'}
                </span>
              ) : null}
            </div>
            <Link
              href="/markets"
              className="inline-flex items-center gap-1 text-primary hover:text-primary/80 font-medium transition-colors"
            >
              <AITranslatedText text="View All" />
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Market Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading && (!markets || markets.length === 0) // Only show skeletons if no data is available
              ? Array.from({ length: 3 }).map((_, i) => (
                  <MarketCardSkeleton key={`skel-${i}`} />
                ))
              : displayMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
          </div>
        </div>
      </section>

      {/* ── World Cup Specials ── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 p-2 rounded-lg">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  <AITranslatedText text={t('home.worldCupTitle') || 'Sports Specials'} />
                </h2>
                <p className="text-sm text-muted-foreground">
                  <AITranslatedText text={t('home.worldCupSubtitle') || 'AI-powered match analysis & predictions'} />
                </p>
              </div>
            </div>
            <Link
              href="/markets?category=World%20Cup%20%E2%98%85"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <AITranslatedText text={t('home.seeAllMatches') || 'See All Matches'} />
            </Link>
          </div>

          <WorldCupPreview />
        </div>
      </section>

      {/* ── New Ecosystem Features Showcase ── */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* KOL / Affiliate Card */}
            <div className="relative overflow-hidden group rounded-2xl bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/20 p-6 sm:p-8 flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users className="w-24 h-24 text-indigo-400 -rotate-12" />
                </div>
                <div className="bg-indigo-500/10 p-4 rounded-full mb-6">
                    <Flame className="w-8 h-8 text-orange-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    <AITranslatedText text="Share & Earn 50% Fees" />
                </h3>
                <div className="text-slate-400 text-sm mb-8 max-w-sm leading-relaxed">
                    <AITranslatedText text="Join our KOL ecosystem. Invite your community and earn 50% of the protocol revenue from every trade they make." />
                </div>
                <Link href="/profile">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 px-8 py-5 rounded-xl font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-95">
                        <AITranslatedText text="Get Your KOL Link" />
                    </Button>
                </Link>
            </div>

            {/* Order Book / Limit Trade Card */}
            <div className="relative overflow-hidden group rounded-2xl bg-gradient-to-br from-cyan-900/30 via-slate-900 to-slate-900 border border-cyan-500/20 p-6 sm:p-8 flex flex-col items-center text-center">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BarChart3 className="w-24 h-24 text-cyan-400 rotate-12" />
                </div>
                <div className="bg-cyan-500/10 p-4 rounded-full mb-6">
                    <TrendingUp className="w-8 h-8 text-cyan-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
                    <AITranslatedText text="Professional Order Book" />
                </h3>
                <div className="text-slate-400 text-sm mb-8 max-w-sm leading-relaxed">
                    <AITranslatedText text="Trade like a pro with our Limit Order Engine. Set your own prices, view market depth, and execute with precision." />
                </div>
                <Link href="/markets">
                    <Button className="bg-cyan-600 hover:bg-cyan-500 text-white border-0 px-8 py-5 rounded-xl font-bold shadow-lg shadow-cyan-600/20 transition-all active:scale-95">
                        <AITranslatedText text="Try Limit Trading" />
                    </Button>
                </Link>
            </div>
        </div>
      </section>

      {/* ── The NEXUS Advantage (Enhanced Features) ── */}
      <section className="relative px-4 sm:px-6 lg:px-8 py-20 lg:py-28 overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] -z-10" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 px-4">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mb-4 tracking-tight">
              <AITranslatedText text="Why NEXUS Beats the Rest" />
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              <AITranslatedText text="Experience the next generation of prediction markets with AI-driven insights and institutional-grade speed." />
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "AI-Powered Predictions",
                desc: "Get the edge with our proprietary AI that analyzes thousands of data points across global markets in real-time.",
                color: "from-amber-400 to-orange-500",
                shadow: "shadow-orange-500/20",
              },
              {
                icon: Users,
                title: "Social Copy Trading",
                desc: "Don't know where to bet? Follow top-tier predictors transparently and mirror their success automatically.",
                color: "from-indigo-400 to-purple-600",
                shadow: "shadow-purple-500/20",
              },
              {
                icon: Globe,
                title: "Global Market Access",
                desc: "Access the world's deepest liquidity pools. Trade on everything from US elections to the World Cup with zero friction.",
                color: "from-blue-400 to-cyan-600",
                shadow: "shadow-cyan-500/20",
              },
              {
                icon: Shield,
                title: "Ultra-Fast Matching",
                desc: "Built on a robust VPS infrastructure, our order-matching engine handles massive volume with sub-second latency.",
                color: "from-emerald-400 to-teal-600",
                shadow: "shadow-emerald-500/20",
              },
              {
                icon: Languages,
                title: "Borderless AI Translation",
                desc: "Read and trade in your native tongue. Our real-time AI provides context-aware translations for titles and debates.",
                color: "from-rose-400 to-red-600",
                shadow: "shadow-rose-500/20",
              },
              {
                icon: BarChart3,
                title: "Pro-Grade Order Book",
                desc: "Experience desktop-class trading with deep liquidity, limit orders, and precise market depth visualization.",
                color: "from-sky-400 to-blue-600",
                shadow: "shadow-blue-500/20",
              },
            ].map((feature, idx) => (
              <div
                key={feature.title}
                className="group relative p-8 rounded-3xl bg-card/40 backdrop-blur-sm border border-border/50 hover:border-border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden"
              >
                {/* Accent line */}
                <div className={cn("absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-30 group-hover:opacity-100 transition-opacity", feature.color)} />
                
                <div className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-lg", feature.color, feature.shadow)}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                  <AITranslatedText text={feature.title} />
                </h3>
                
                <p className="text-muted-foreground leading-relaxed text-sm">
                  <AITranslatedText text={feature.desc} />
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center py-16 px-8 rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <h2 className="text-3xl font-bold mb-4">
            {t('home.readyTitle') || 'Ready to Start Predicting?'}
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            {t('home.readySubtitle') || 'Join thousands of traders on NEXUS and start earning returns today.'}
          </p>
          <Link href="/markets" className="inline-block">
            <Button size="lg" className="bg-background text-foreground hover:bg-background/90 font-semibold px-8 text-lg border border-border/20 shadow-sm">
              <AITranslatedText text={t('home.startPredicting') || 'Explore All Markets'} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function WorldCupPreview() {
  const { data: wcMarkets, isLoading } = trpc.markets.worldCup.useQuery(undefined, {
    staleTime: 300_000,
  });

  if (isLoading && !wcMarkets) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <MarketCardSkeleton key={`wc-skel-${i}`} />
        ))}
      </div>
    );
  }

  const trendingWC = wcMarkets?.filter((m) => m.isTrending).slice(0, 3) || [];
  const displayWC = trendingWC.length > 0 ? trendingWC : (wcMarkets?.slice(0, 3) || []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {displayWC.map((market) => (
        <MarketCard key={market.id} market={market} />
      ))}
    </div>
  );
}
