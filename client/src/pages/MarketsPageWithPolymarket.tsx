'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMarketsWithPolymarket } from '@/hooks/useMarketsWithPolymarket';
import { formatPoolSize, formatEndDate } from '@/lib/mockMarkets';
import { Search, TrendingUp, Users, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

type CategoryFilter = 'all' | 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other';

/**
 * Market Card Component with Demo Mode
 */
function MarketCard({ market, isLiveData }: { market: any; isLiveData: boolean }) {
  const [isBetting, setIsBetting] = useState(false);

  const handleBet = (outcome: 'yes' | 'no') => {
    if (!isLiveData) {
      // Mock mode - show demo toast
      toast.info(`Demo Mode: Betting on ${outcome.toUpperCase()} for "${market.title}"`);
      return;
    }

    // Live data - show demo mode message
    setIsBetting(true);
    toast.info(
      `Demo Mode: This market is from Polymarket. To trade, visit polymarket.com`,
      {
        duration: 4000,
      }
    );
    setTimeout(() => setIsBetting(false), 2000);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
      {/* Header with category and icon */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{market.icon}</div>
          <div>
            <span className="inline-block px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800">
              {market.category || 'Market'}
            </span>
            {market.source === 'polymarket' && (
              <span className="inline-block ml-2 px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                Live
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Pool Size</p>
          <p className="text-lg font-bold text-gray-900">{formatPoolSize(market.poolSize)}</p>
        </div>
      </div>

      {/* Title */}
      <div className="px-4 pt-4 pb-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
          {market.title}
        </h3>
      </div>

      {/* Description */}
      <div className="px-4 pb-4">
        <p className="text-sm text-gray-600 line-clamp-2">{market.description}</p>
      </div>

      {/* Odds Visualization */}
      <div className="px-4 py-4 border-t border-gray-200 bg-gray-50">
        <div className="space-y-2">
          {/* YES odds */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">YES</span>
              <span className="text-sm font-bold text-green-600">{market.yesOdds}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-300"
                style={{ width: `${market.yesOdds}%` }}
              />
            </div>
          </div>

          {/* NO odds */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">NO</span>
              <span className="text-sm font-bold text-red-600">{market.noOdds}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-300"
                style={{ width: `${market.noOdds}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-t border-gray-200 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-500">Volume 24h</p>
          <p className="text-sm font-semibold text-gray-900">{formatPoolSize(market.volume24h)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Participants</p>
          <p className="text-sm font-semibold text-gray-900">{market.participants.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Ends in</p>
          <p className="text-sm font-semibold text-gray-900">{formatEndDate(market.endDate)}</p>
        </div>
      </div>

      {/* Bet Buttons */}
      <div className="px-4 py-4 border-t border-gray-200 grid grid-cols-2 gap-2 mt-auto">
        <Button
          onClick={() => handleBet('yes')}
          disabled={isBetting}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
        >
          Bet YES
        </Button>
        <Button
          onClick={() => handleBet('no')}
          disabled={isBetting}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          Bet NO
        </Button>
      </div>
    </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Prediction Markets</h1>
          <p className="text-lg text-gray-600">
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
          <Card className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Total Markets</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalMarkets}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Total Volume</p>
            <p className="text-2xl font-bold text-gray-900">{formatPoolSize(stats.totalVolume)}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Participants</p>
            <p className="text-2xl font-bold text-gray-900">{stats.totalParticipants.toLocaleString()}</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-xs text-gray-500 mb-1">Avg Pool Size</p>
            <p className="text-2xl font-bold text-gray-900">{formatPoolSize(stats.averagePoolSize)}</p>
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
            <p className="text-lg text-gray-600">No markets found matching your criteria</p>
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
