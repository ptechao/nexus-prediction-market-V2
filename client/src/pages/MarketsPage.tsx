'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMarkets } from '@/hooks/useMarkets';
import { formatPoolSize, formatEndDate, getCategoryLabel, getCategoryColor } from '@/lib/mockMarkets';
import { Search, TrendingUp, Users, Clock } from 'lucide-react';
import { AITranslatedText } from '@/components/AITranslatedText';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

type CategoryFilter = 'all' | 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other';

/**
 * Market Card Component
 */
function MarketCard({ market }: { market: any }) {
  const [isBetting, setIsBetting] = useState(false);
  const [betOutcome, setBetOutcome] = useState<'yes' | 'no' | null>(null);

  const handleBet = (outcome: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation();
    setBetOutcome(outcome);
    setIsBetting(true);
    toast.info(`Betting on ${outcome.toUpperCase()} for "${market.title}"`);
    // TODO: Open betting modal
    setTimeout(() => setIsBetting(false), 2000);
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {market.icon && <span className="text-lg leading-none">{market.icon}</span>}
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground">
            {getCategoryLabel(market.category)}
          </span>
        </div>
        <div className="text-right">
          <AITranslatedText as="p" className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5" text="Pool Size" />
          <p className="text-sm font-bold text-foreground">{formatPoolSize(market.poolSize)}</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 flex-[1]">
        <AITranslatedText as="h3" className="font-medium text-base text-foreground mb-1 leading-snug line-clamp-3 group-hover:text-primary transition-colors" text={market.title} />
        <AITranslatedText as="p" className="text-sm text-muted-foreground line-clamp-2 mt-2 leading-relaxed" text={market.description} />
      </div>

      {/* Odds Bar */}
      <div className="px-4 mt-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-500">YES {market.yesOdds}%</span>
          <span className="text-sm font-semibold text-red-500 dark:text-red-400">NO {market.noOdds}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
          <div className="bg-blue-600 dark:bg-blue-500 transition-all duration-500" style={{ width: `${market.yesOdds}%` }} />
          <div className="bg-red-500 dark:bg-red-400 transition-all duration-500" style={{ width: `${market.noOdds}%` }} />
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 mt-4 border-t border-border grid grid-cols-3 gap-2 text-center text-[10px] text-muted-foreground">
        <div>
          <AITranslatedText as="p" className="mb-0.5 uppercase tracking-wider" text="Vol 24h" />
          <p className="font-bold text-foreground text-xs">{formatPoolSize(market.volume24h)}</p>
        </div>
        <div>
          <AITranslatedText as="p" className="mb-0.5 uppercase tracking-wider" text="Traders" />
          <p className="font-bold text-foreground text-xs">{market.participants.toLocaleString()}</p>
        </div>
        <div>
          <AITranslatedText as="p" className="mb-0.5 uppercase tracking-wider" text="Ends in" />
          <p className="font-bold text-foreground text-xs">{formatEndDate(market.endDate)}</p>
        </div>
      </div>

      {/* Bet Buttons */}
      <div className="px-4 py-4 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={(e) => handleBet('yes', e)}
            disabled={isBetting && betOutcome === 'yes'}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 shadow-none font-semibold text-sm h-10 border border-blue-200 dark:border-blue-500/20 transition-colors"
          >
            <AITranslatedText text="Bet YES" />
          </Button>
          <Button
            onClick={(e) => handleBet('no', e)}
            disabled={isBetting && betOutcome === 'no'}
            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 shadow-none font-semibold text-sm h-10 border border-red-200 dark:border-red-500/20 transition-colors"
          >
            <AITranslatedText text="Bet NO" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Markets Page Component
 */
export default function MarketsPage() {
  const { t } = useTranslation();
  const { isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'participants' | 'endDate'>('volume');

  const { markets, searchMarkets, stats, isMockData } = useMarkets({
    useMockData: true,
    category: selectedCategory,
    sortBy: sortBy as any,
  });

  const filteredMarkets = useMemo(() => {
    return searchMarkets(searchQuery);
  }, [searchQuery, searchMarkets]);

  const categories: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: 'All Markets' },
    { value: 'sports', label: 'Sports' },
    { value: 'politics', label: 'Politics' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <AITranslatedText as="h1" className="text-3xl font-bold text-foreground mb-2" text="Prediction Markets" />
          <AITranslatedText as="p" className="text-muted-foreground" text="Bet on real-world events with real-time odds" />
        </div>

        {/* Demo Mode Alert */}
        {isMockData && (
          <Card className="mb-6 border-blue-200 bg-blue-50 p-4 font-medium">
            <AITranslatedText as="p" className="text-sm text-blue-800" text="Demo Mode: Displaying mock market data. Connect your wallet to trade with real contracts." />
          </Card>
        )}

        {/* Wallet Connection Alert */}
        {!isConnected && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 p-4">
            <AITranslatedText as="p" className="text-sm text-yellow-800" text="⚠️ Connect your wallet to place bets on these markets" />
          </Card>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-card border border-border">
            <AITranslatedText as="p" className="text-xs text-muted-foreground mb-1 uppercase tracking-wider" text="Total Markets" />
            <p className="text-2xl font-bold text-foreground">{stats.totalMarkets}</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <AITranslatedText as="p" className="text-xs text-muted-foreground mb-1 uppercase tracking-wider" text="Total Volume" />
            <p className="text-2xl font-bold text-foreground">{formatPoolSize(stats.totalVolume)}</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <AITranslatedText as="p" className="text-xs text-muted-foreground mb-1 uppercase tracking-wider" text="Participants" />
            <p className="text-2xl font-bold text-foreground">{stats.totalParticipants.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <AITranslatedText as="p" className="text-xs text-muted-foreground mb-1 uppercase tracking-wider" text="Avg Pool Size" />
            <p className="text-2xl font-bold text-foreground">{formatPoolSize(stats.averagePoolSize)}</p>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder={t('markets.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 py-2"
            />
          </div>

          {/* Category Filters */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(cat.value)}
                size="sm"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'volume' ? 'default' : 'outline'}
              onClick={() => setSortBy('volume')}
              size="sm"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              <AITranslatedText text="Sort by Volume" />
            </Button>
            <Button
              variant={sortBy === 'participants' ? 'default' : 'outline'}
              onClick={() => setSortBy('participants')}
              size="sm"
            >
              <Users className="w-4 h-4 mr-2" />
              <AITranslatedText text="Sort by Participants" />
            </Button>
            <Button
              variant={sortBy === 'endDate' ? 'default' : 'outline'}
              onClick={() => setSortBy('endDate')}
              size="sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              <AITranslatedText text="Sort by End Date" />
            </Button>
          </div>
        </div>

        {/* Markets Grid */}
        {filteredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <AITranslatedText as="p" className="text-lg text-muted-foreground" text="No markets found matching your criteria" />
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4"
            >
              <AITranslatedText text="Clear Filters" />
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
