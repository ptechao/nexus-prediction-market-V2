'use client';

import { useCallback, useMemo, useState } from 'react';
import { getAllMockMarkets, getMockMarketsByCategory, getTrendingMockMarkets, getActiveMockMarkets, type MockMarket } from '@/lib/mockMarkets';

type MarketCategory = 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other' | 'all';
type SortBy = 'volume' | 'participants' | 'endDate' | 'odds';

interface UseMarketsOptions {
  useMockData?: boolean; // Default: true for demo
  category?: MarketCategory;
  sortBy?: SortBy;
  limit?: number;
}

/**
 * Custom hook for market data management
 * Supports both mock data (for demo) and live contract data
 */
export function useMarkets(options: UseMarketsOptions = {}) {
  const {
    useMockData = true, // Default to mock data for demo
    category = 'all',
    sortBy = 'volume',
    limit,
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get markets based on options
   */
  const markets = useMemo(() => {
    try {
      setError(null);

      if (!useMockData) {
        // TODO: Fetch from live contracts
        return [];
      }

      // Get markets based on category
      let filteredMarkets: MockMarket[] = [];

      if (category === 'all') {
        filteredMarkets = getActiveMockMarkets();
      } else {
        filteredMarkets = getMockMarketsByCategory(category);
      }

      // Sort markets
      const sorted = [...filteredMarkets].sort((a, b) => {
        switch (sortBy) {
          case 'volume':
            return b.volume24h - a.volume24h;
          case 'participants':
            return b.participants - a.participants;
          case 'endDate':
            return a.endDate.getTime() - b.endDate.getTime();
          case 'odds':
            // Sort by odds difference (more balanced markets first)
            const aDiff = Math.abs(a.yesOdds - 50);
            const bDiff = Math.abs(b.yesOdds - 50);
            return aDiff - bDiff;
          default:
            return 0;
        }
      });

      // Apply limit if specified
      if (limit && limit > 0) {
        return sorted.slice(0, limit);
      }

      return sorted;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load markets';
      setError(errorMessage);
      return [];
    }
  }, [useMockData, category, sortBy, limit]);

  /**
   * Get trending markets
   */
  const trendingMarkets = useCallback((count: number = 5) => {
    if (!useMockData) {
      return [];
    }
    return getTrendingMockMarkets(count);
  }, [useMockData]);

  /**
   * Get market by ID
   */
  const getMarketById = useCallback(
    (id: string): MockMarket | undefined => {
      if (!useMockData) {
        return undefined;
      }
      return getAllMockMarkets().find((m) => m.id === id);
    },
    [useMockData]
  );

  /**
   * Search markets by title or description
   */
  const searchMarkets = useCallback(
    (query: string): MockMarket[] => {
      if (!useMockData || !query.trim()) {
        return markets;
      }

      const lowerQuery = query.toLowerCase();
      return markets.filter(
        (market) =>
          market.title.toLowerCase().includes(lowerQuery) ||
          market.description.toLowerCase().includes(lowerQuery)
      );
    },
    [markets, useMockData]
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

  return {
    // Data
    markets,
    trendingMarkets,
    getMarketById,
    searchMarkets,
    stats,

    // State
    isLoading,
    error,
    isMockData: useMockData,
  };
}

/**
 * Hook to get markets by category
 */
export function useMarketsByCategory(category: MarketCategory) {
  return useMarkets({ category });
}

/**
 * Hook to get trending markets
 */
export function useTrendingMarkets(limit: number = 5) {
  return useMarkets({ limit, sortBy: 'volume' });
}
