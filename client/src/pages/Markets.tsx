'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { MarketCard, MarketCardSkeleton } from '@/components/MarketCard';
import { Search, TrendingUp, Users, Clock, Filter, AlertCircle, RefreshCw, Zap } from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';
import { toast } from 'sonner';

type CategoryFilter = 'all' | 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other';

export default function Markets() {
  const { language } = useLanguageContext();
  const t_i18n = (messages as Record<string, any>)[language] || messages.en;
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [sortBy, setSortBy] = useState<'volume' | 'participants' | 'endDate'>('volume');

  // Sync Mutation
  const syncMutation = trpc.markets.sync.useMutation({
    onSuccess: (data) => {
      toast.success(`Success! Created ${data.createdCount} new markets. Ready for discovery.`);
      refetchNexus();
    },
    onError: (error) => {
      toast.error(`Sync failure: ${error.message}. Please check database connection.`);
    }
  });

  // Fetch Nexus markets (DB synced)
  const { 
    data: nexusMarkets, 
    isLoading: isNexusLoading, 
    refetch: refetchNexus,
    isFetching: isNexusFetching
  } = trpc.markets.nexus.useQuery(
    { category: selectedCategory },
    { staleTime: 60_000 }
  );

  // Fetch Live markets (API Proxy fallback)
  const {
    data: liveMarkets,
    isLoading: isLiveLoading,
    isFetching: isLiveFetching
  } = trpc.markets.live.useQuery(
    { category: selectedCategory },
    { staleTime: 120_000 }
  );

  // Fetch World Cup markets as secondary
  const { 
    data: worldCupMarkets, 
    isLoading: isWCLoading,
    isFetching: isWCFetching
  } = trpc.markets.worldCup.useQuery(undefined, { staleTime: 300_000 });

  const isLoading = isNexusLoading || isWCLoading || isLiveLoading;
  const isFetching = isNexusFetching || isWCFetching || isLiveFetching;

  // Combine and map markets
  const allMarkets = useMemo(() => {
    const combined = [];
    
    // Process Nexus Markets (from DB)
    if (nexusMarkets) {
      combined.push(...nexusMarkets.map(m => ({
        id: m.sourceId || m.id,
        title: m.title,
        description: m.description || '',
        category: m.category || 'other',
        endDate: m.endTime || m.endDate,
        yesOdds: parseInt(String(m.yesOdds || '50')),
        noOdds: parseInt(String(m.noOdds || '50')),
        totalPool: parseFloat(String(m.yesPool || '500')) + parseFloat(String(m.noPool || '500')),
        volume24h: 1000,
        participants: 100,
        isTrending: false,
        image: m.image
      })));
    }

    // Process Live Markets (direct from APIs)
    if (liveMarkets) {
      // Avoid duplication by sourceId
      const existingIds = new Set(combined.map(m => String(m.id)));
      combined.push(...liveMarkets.filter(m => !existingIds.has(String(m.id))));
    }

    // Process World Cup Markets
    if (worldCupMarkets) {
      combined.push(...worldCupMarkets);
    }

    return combined;
  }, [nexusMarkets, liveMarkets, worldCupMarkets]);

  // Search & Filter Logic
  const filteredMarkets = useMemo(() => {
    let result = [...allMarkets];

    // Search
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(m => 
        (m.title || '').toLowerCase().includes(lowerQuery) || 
        (m.description || '').toLowerCase().includes(lowerQuery)
      );
    }

    // Category Filter
    if (selectedCategory !== 'all') {
      result = result.filter(m => (m.category || '').toLowerCase() === selectedCategory.toLowerCase());
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'volume') return b.totalPool - a.totalPool;
      if (sortBy === 'participants') return b.participants - a.participants;
      if (sortBy === 'endDate') return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      return 0;
    });

    return result;
  }, [allMarkets, searchQuery, sortBy]);

  const categories: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: t_i18n.navigation.markets || 'All Markets' },
    { value: 'sports', label: t_i18n.markets?.sports || 'Sports' },
    { value: 'politics', label: t_i18n.markets?.politics || 'Politics' },
    { value: 'crypto', label: t_i18n.markets?.crypto || 'Crypto' },
    { value: 'entertainment', label: t_i18n.markets?.entertainment || 'Entertainment' },
    { value: 'other', label: t_i18n.markets?.other || 'Other' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">
              {t_i18n.navigation.markets || 'Markets'}
            </h1>
            <p className="text-muted-foreground">
              {t_i18n.markets.discoverStr || 'Discover and trade on real-world events across global sources.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className={`h-9 px-3 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all ${syncMutation.isPending ? 'opacity-70' : ''}`}
            >
              <Zap className={`w-4 h-4 mr-2 ${syncMutation.isPending ? 'animate-pulse' : ''}`} />
              {syncMutation.isPending ? (t_i18n.common.syncing || 'Syncing...') : (t_i18n.common.syncMarkets || 'Sync Markets')}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchNexus()}
              disabled={isFetching}
              className="h-9 px-3 border-border bg-card hover:bg-muted"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              {t_i18n.common.refresh || 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t_i18n.markets.searchPlaceholder || "Search by event, category, or keyword..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-card border-border shadow-sm focus-visible:ring-primary"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={sortBy === 'volume' ? 'default' : 'outline'}
                onClick={() => setSortBy('volume')}
                size="sm"
                className="h-11 px-4"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                {t_i18n.markets.volume || 'Volume'}
              </Button>
              <Button
                variant={sortBy === 'participants' ? 'default' : 'outline'}
                onClick={() => setSortBy('participants')}
                size="sm"
                className="h-11 px-4"
              >
                <Users className="w-4 h-4 mr-2" />
                {t_i18n.markets.traders || 'Traders'}
              </Button>
              <Button
                variant={sortBy === 'endDate' ? 'default' : 'outline'}
                onClick={() => setSortBy('endDate')}
                size="sm"
                className="h-11 px-4"
              >
                <Clock className="w-4 h-4 mr-2" />
                {t_i18n.common.date || 'Date'}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
            <Filter className="w-4 h-4 text-muted-foreground mr-1 flex-shrink-0" />
            {categories.map((cat) => (
              <Badge
                key={cat.value}
                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                className={`cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat.value 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'bg-card text-muted-foreground hover:bg-muted border-border'
                }`}
                onClick={() => setSelectedCategory(cat.value)}
              >
                {cat.label}
              </Badge>
            ))}
          </div>
        </div>


        {/* Markets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && allMarkets.length === 0
            ? Array.from({ length: 6 }).map((_, i) => (
                <MarketCardSkeleton key={`skel-${i}`} />
              ))
            : filteredMarkets.map((market) => (
                <MarketCard key={market.id} market={market} />
              ))}
        </div>

        {/* Empty State */}
        {!isLoading && filteredMarkets.length === 0 && (
          <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">{t_i18n.markets.noMarketsFound || 'No markets found'}</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              {t_i18n.markets.noMarketsDesc || "We couldn't find any markets matching your search criteria or category. Try adjusting your filters."}
            </p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
            >
              {t_i18n.markets.clearFilters || 'Clear all filters'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

