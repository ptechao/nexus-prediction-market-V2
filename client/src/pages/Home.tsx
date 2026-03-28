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
import { useTranslation } from '@/hooks/useTranslation';
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
        title: s1Title.startsWith('home.') ? 'Predict the Future' : s1Title,
        highlight: s1Highlight.startsWith('home.') ? 'Trade with Confidence' : s1Highlight,
        desc: s1Desc.startsWith('home.') ? 'Join NEXUS — the decentralized prediction market platform. Experience the power of decentralized predictions with AI-driven insights.' : s1Desc,
        image: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?q=80&w=1920&auto=format&fit=crop',
      },
      {
        id: 2,
        title: s2Title.startsWith('home.') ? 'Global Elections & Politics' : s2Title,
        highlight: s2Highlight.startsWith('home.') ? 'Who will lead?' : s2Highlight,
        desc: s2Desc.startsWith('home.') ? 'Trade on political outcomes with the deepest liquidity and instant on-chain settlement guarantees.' : s2Desc,
        image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1920&auto=format&fit=crop',
      },
      {
        id: 3,
        title: s3Title.startsWith('home.') ? 'Major League Sports' : s3Title,
        highlight: s3Highlight.startsWith('home.') ? 'Back your teams' : s3Highlight,
        desc: s3Desc.startsWith('home.') ? 'Sports predictions powered by our proprietary AI model. Get the edge before the whistle blows.' : s3Desc,
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
                <div className="relative w-full h-[450px] sm:h-[500px] lg:h-[600px] flex items-center justify-center">
                  {/* Background Image with Overlay */}
                  <div 
                    className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-105"
                    style={{ backgroundImage: `url('${slide.image}')` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  </div>

                  {/* Slide Content */}
                  <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left flex flex-col justify-center translate-y-4">
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-4 sm:mb-6 text-white drop-shadow-lg">
                      {slide.title}{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 whitespace-nowrap block md:inline mt-2 md:mt-0">
                        {slide.highlight}
                      </span>
                    </h1>
                    <p className="text-base sm:text-lg lg:text-xl text-slate-300 max-w-2xl mx-auto md:mx-0 mb-8 sm:mb-10 drop-shadow-md font-medium leading-relaxed">
                      {slide.desc}
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                      <Link href="/markets">
                        <Button size="lg" className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-black font-bold border-none shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
                          {t('home.startPredicting') || 'Explore Markets'}
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
          <div className="absolute bottom-24 left-0 right-0 z-30 flex justify-center gap-2 pointer-events-none">
            {Array.from({ length: count }).map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-all duration-300 pointer-events-auto",
                  current === index 
                    ? "bg-cyan-400 w-8" 
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
              View All
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
                <h2 className="text-2xl font-bold text-foreground">{t('home.worldCupTitle') || 'Sports Specials'}</h2>
                <p className="text-sm text-muted-foreground">{t('home.worldCupSubtitle') || 'AI-powered match analysis & predictions'}</p>
              </div>
            </div>
            <Link
              href="/markets?category=World%20Cup%20%E2%98%85"
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {t('home.seeAllMatches') || 'See All Matches'}
            </Link>
          </div>

          <WorldCupPreview />
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 bg-muted/50 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            {t('home.whyNexus') || 'Why Choose NEXUS?'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: t('home.instantSettlement') || 'Instant Settlement',
                desc: t('home.instantSettlementDesc') || 'Bets resolved instantly on-chain with transparent oracle verification.',
                color: 'text-amber-500',
              },
              {
                icon: Shield,
                title: t('home.secureAudited') || 'Secure & Audited',
                desc: t('home.secureAuditedDesc') || 'Smart contracts audited by leading security firms for maximum safety.',
                color: 'text-emerald-500',
              },
              {
                icon: Copy,
                title: t('home.copyTrading') || 'Copy Trading',
                desc: t('home.copyTradingDesc') || 'Follow top traders and replicate their winning strategies automatically.',
                color: 'text-blue-500',
              },
              {
                icon: Droplets,
                title: t('home.highLiquidity') || 'High Liquidity',
                desc: t('home.highLiquidityDesc') || 'Deep order books and tight spreads for optimal trading conditions.',
                color: 'text-indigo-500',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="p-6 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-300"
              >
                <feature.icon className={`w-8 h-8 ${feature.color} mb-4`} />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.desc}
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
              {t('home.startPredicting') || 'Explore All Markets'}
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
