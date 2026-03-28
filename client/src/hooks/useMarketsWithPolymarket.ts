import { useCallback, useEffect, useMemo, useState } from 'react';
import { getAllMockMarkets, getMockMarketsByCategory, getTrendingMockMarkets, getActiveMockMarkets } from '@/lib/mockMarkets';
import { fetchTrendingMarketsFromPolymarket, fetchPolymarketByCategory, type NexusMarketFromPolymarket } from '@/lib/polymarketApi';
import type { MockMarket } from '@/lib/mockMarkets';
import { trpc } from '@/lib/trpc';

type MarketCategory = 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other' | 'all';
type SortBy = 'volume' | 'participants' | 'endDate' | 'odds';
type DataSource = 'mock' | 'polymarket' | 'nexus' | 'auto';

interface UseMarketsWithPolymarketOptions {
  source?: DataSource; // 'auto' = try Nexus/Polymarket first, fallback to mock
  category?: MarketCategory;
  sortBy?: SortBy;
  limit?: number;
}

/**
 * Enhanced hook for market data management with Polymarket & Nexus integration
 */
export function useMarketsWithPolymarket(options: UseMarketsWithPolymarketOptions = {}) {
  const { source = 'auto', category = 'all', sortBy = 'volume', limit } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markets, setMarkets] = useState<(MockMarket | NexusMarketFromPolymarket)[]>([]);
  const [dataSource, setDataSource] = useState<'mock' | 'polymarket' | 'nexus'>('mock');

  // TRPC fetch for Nexus markets
  const nexusQuery = trpc.markets.nexus.useQuery(
    { category, limit: limit || 50 },
    { enabled: source === 'nexus' || source === 'auto' }
  );

  /**
   * Fetch markets based on source
   */
  const fetchMarkets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      let fetchedMarkets: (MockMarket | NexusMarketFromPolymarket)[] = [];

      if (source === 'nexus') {
        if (nexusQuery.data) {
          fetchedMarkets = nexusQuery.data.map(m => ({
            id: m.sourceId,
            title: m.title,
            description: m.description || '',
            category: (m.category || 'other') as any,
            endDate: m.endTime ? new Date(m.endTime) : new Date(),
            poolSize: parseFloat((m as any).yesPool || '0') + parseFloat((m as any).noPool || '0'),
            yesOdds: parseInt(m.yesOdds || '50'),
            noOdds: parseInt(m.noOdds || '50'),
            volume24h: 1000, // Placeholder
            participants: 100, // Placeholder
            status: 'active',
            icon: '📊',
            source: 'polymarket' as any,
            yesPool: parseFloat((m as any).yesPool || '0'),
            noPool: parseFloat((m as any).noPool || '0'),
          } as any));
          setDataSource('nexus');
        }
      } else if (source === 'polymarket' || source === 'auto') {
        try {
          // 1. Try Nexus first if auto
          if (source === 'auto' && nexusQuery.data && nexusQuery.data.length > 0) {
            fetchedMarkets = nexusQuery.data.map(m => ({
              id: m.sourceId,
              title: m.title,
              description: m.description || '',
              category: (m.category || 'other') as any,
              endDate: m.endTime ? new Date(m.endTime) : new Date(),
              poolSize: parseFloat((m as any).yesPool || '0') + parseFloat((m as any).noPool || '0'), 
              yesOdds: parseInt(m.yesOdds || '50'),
              noOdds: parseInt(m.noOdds || '50'),
              volume24h: 1000,
              participants: 100,
              status: 'active',
              icon: '📊',
              source: 'polymarket' as any,
              yesPool: parseFloat((m as any).yesPool || '0'),
              noPool: parseFloat((m as any).noPool || '0'),
            } as any));
            setDataSource('nexus');
          } 
          
          // 2. If no Nexus markets or source is explicitly polymarket, try Polymarket
          if (fetchedMarkets.length === 0) {
            if (category === 'all') {
              fetchedMarkets = await fetchTrendingMarketsFromPolymarket(limit || 10);
            } else {
              fetchedMarkets = await fetchPolymarketByCategory(
                category as NexusMarketFromPolymarket['category'],
                limit || 10
              );
            }

            if (fetchedMarkets.length > 0) {
              setDataSource('polymarket');
            } else {
              throw new Error('No markets returned from Polymarket');
            }
          }
        } catch (polymarketError) {
          console.warn('Polymarket fetch failed, falling back to mock data:', polymarketError);

          if (source === 'polymarket') {
            throw polymarketError;
          }

          // Fallback to mock data
          if (category === 'all') {
            fetchedMarkets = getActiveMockMarkets();
          } else {
            fetchedMarkets = getMockMarketsByCategory(category as any);
          }

          setDataSource('mock');
        }
      } else {
        // Use mock data
        if (category === 'all') {
          fetchedMarkets = getActiveMockMarkets();
        } else {
          fetchedMarkets = getMockMarketsByCategory(category as any);
        }

        setDataSource('mock');
      }

      // Sort markets
      const sorted = [...fetchedMarkets].sort((a, b) => {
        switch (sortBy) {
          case 'volume':
            return b.volume24h - a.volume24h;
          case 'participants':
            return b.participants - a.participants;
          case 'endDate':
            return a.endDate.getTime() - b.endDate.getTime();
          case 'odds':
            const aDiff = Math.abs(a.yesOdds - 50);
            const bDiff = Math.abs(b.yesOdds - 50);
            return aDiff - bDiff;
          default:
            return 0;
        }
      });

      // Apply limit
      if (limit && limit > 0) {
        setMarkets(sorted.slice(0, limit));
      } else {
        setMarkets(sorted);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load markets';
      setError(errorMessage);
      setMarkets([]);
    } finally {
      setIsLoading(false);
    }
  }, [source, category, sortBy, limit, nexusQuery.data]);

  /**
   * Fetch markets on mount and when options change
   */
  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets, nexusQuery.isSuccess]);

  /**
   * Get market by ID
   */
  const getMarketById = useCallback(
    (id: string) => {
      return markets.find((m) => m.id === id);
    },
    [markets]
  );

  /**
   * Search markets
   */
  const searchMarkets = useCallback(
    (query: string) => {
      if (!query.trim()) {
        return markets;
      }

      const lowerQuery = query.toLowerCase();
      return markets.filter(
        (market) =>
          market.title.toLowerCase().includes(lowerQuery) ||
          market.description.toLowerCase().includes(lowerQuery)
      );
    },
    [markets]
  );

  /**
   * Get market statistics
   */
  const stats = useMemo(() => {
    if (markets.length === 0) {
      return {
        totalMarkets: 0,
        totalVolume: 0,
        totalParticipants: 0,
        averagePoolSize: 0,
      };
    }

    const totalVolume = markets.reduce((sum, m) => sum + m.volume24h, 0);
    const totalParticipants = markets.reduce((sum, m) => sum + m.participants, 0);
    const averagePoolSize = markets.reduce((sum, m) => sum + m.poolSize, 0) / markets.length;

    return {
      totalMarkets: markets.length,
      totalVolume,
      totalParticipants,
      averagePoolSize,
    };
  }, [markets]);

  /**
   * Retry fetch
   */
  const retry = useCallback(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  return {
    // Data
    markets,
    getMarketById,
    searchMarkets,
    stats,

    // State
    isLoading: isLoading || nexusQuery.isLoading,
    error: error || (nexusQuery.error ? 'Failed to fetch Nexus markets' : null),
    dataSource,
    isLiveData: dataSource === 'polymarket' || dataSource === 'nexus',

    // Actions
    retry,
  };
}

/**
 * Hook to get trending markets from Polymarket/Nexus with fallback
 */
export function useTrendingMarketsWithPolymarket(limit: number = 5) {
  return useMarketsWithPolymarket({ source: 'auto', limit, sortBy: 'volume' });
}

/**
 * Hook to get markets by category with Polymarket/Nexus
 */
export function useMarketsByCategoryWithPolymarket(category: MarketCategory) {
  return useMarketsWithPolymarket({ source: 'auto', category });
}

