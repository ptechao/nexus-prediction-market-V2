'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMarketsWithPolymarket } from '@/hooks/useMarketsWithPolymarket';
import { formatPoolSize, formatEndDate } from '@/lib/mockMarkets';
import { Search, TrendingUp, Users, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { AITranslatedText } from '@/components/AITranslatedText';
import { toast } from 'sonner';

type CategoryFilter = 'all' | 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other';

/**
 * Market Card Component with Demo Mode
 */
function MarketCard({ market, isLiveData }: { market: any; isLiveData: boolean }) {
  const [isBetting, setIsBetting] = useState(false);

  const handleBet = (outcome: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLiveData) {
      // Mock mode - show demo toast
      toast.info(`Demo Mode: Betting on ${outcome.toUpperCase()} for "${market.title}"`);
      return;
    }

    // Live data - show demo mode message
    setIsBetting(true);
    toast.info(
      `Demo Mode: This market is from Polymarket. To trade, visit polymarket.com`,
      { duration: 4000 }
    );
    setTimeout(() => setIsBetting(false), 2000);
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {market.icon && <span className="text-lg leading-none">{market.icon}</span>}
          <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-secondary text-secondary-foreground">
            {market.category || 'Market'}
          </span>
          {market.source === 'polymarket' && (
            <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300">
              Live
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Pool Size</p>
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
          <p className="mb-0.5 uppercase tracking-wider">Vol 24h</p>
          <p className="font-bold text-foreground text-xs">{formatPoolSize(market.volume24h)}</p>
        </div>
        <div>
          <p className="mb-0.5 uppercase tracking-wider">Traders</p>
          <p className="font-bold text-foreground text-xs">{market.participants?.toLocaleString()}</p>
        </div>
        <div>
          <p className="mb-0.5 uppercase tracking-wider">Ends in</p>
          <p className="font-bold text-foreground text-xs">{formatEndDate(market.endDate)}</p>
        </div>
      </div>

      {/* Bet Buttons */}
      <div className="px-4 py-4 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={(e) => handleBet('yes', e)}
            disabled={isBetting}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 shadow-none font-semibold text-sm h-10 border border-blue-200 dark:border-blue-500/20 transition-colors"
          >
            Bet YES
          </Button>
          <Button
            onClick={(e) => handleBet('no', e)}
            disabled={isBetting}
            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 shadow-none font-semibold text-sm h-10 border border-red-200 dark:border-red-500/20 transition-colors"
          >
            Bet NO
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Markets Page with Polymarket Integration
 */
export default function MarketsPageWithPolymarket() {
  const { isConnected } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'participants' | 'endDate'>('volume');

  const { markets, searchMarkets, stats, isLoading, error, isLiveData, retry } = useMarketsWithPolymarket({
    source: 'auto',
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Prediction Markets</h1>
          <p className="text-muted-foreground">
            {isLiveData ? '📊 Live data from Polymarket' : '📋 Mock market data for demo'}
          </p>
        </div>

        {/* Data Source Alert */}
        {isLiveData && (
          <Card className="mb-6 border-purple-200 bg-purple-50 p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-purple-900">Live Data from Polymarket</p>
                <p className="text-sm text-purple-800 mt-1">
                  These markets are sourced from Polymarket's Gamma API. Click "Bet" to see demo mode information.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Error Alert */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-900">Error Loading Markets</p>
                  <p className="text-sm text-red-800 mt-1">{error}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={retry}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Wallet Connection Alert */}
        {!isConnected && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              ⚠️ Connect your wallet to place bets on these markets
            </p>
          </Card>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Markets</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalMarkets}</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Total Volume</p>
            <p className="text-2xl font-bold text-foreground">{formatPoolSize(stats.totalVolume)}</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Participants</p>
            <p className="text-2xl font-bold text-foreground">{stats.totalParticipants.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Avg Pool Size</p>
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
              placeholder="Search markets..."
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
              Sort by Volume
            </Button>
            <Button
              variant={sortBy === 'participants' ? 'default' : 'outline'}
              onClick={() => setSortBy('participants')}
              size="sm"
            >
              <Users className="w-4 h-4 mr-2" />
              Sort by Participants
            </Button>
            <Button
              variant={sortBy === 'endDate' ? 'default' : 'outline'}
              onClick={() => setSortBy('endDate')}
              size="sm"
            >
              <Clock className="w-4 h-4 mr-2" />
              Sort by End Date
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="h-96 bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}

        {/* Markets Grid */}
        {!isLoading && filteredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} isLiveData={isLiveData} />
            ))}
          </div>
        ) : !isLoading ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-muted-foreground">No markets found matching your criteria</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
