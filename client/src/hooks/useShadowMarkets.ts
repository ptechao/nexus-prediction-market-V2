'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAndSyncShadowMarkets,
  getShadowMarketContract,
  getShadowMarketMetadata,
  createShadowMarket,
  getAllShadowMarketMetadata,
  getShadowMarketsByCategory,
  type ShadowMarket,
  type ShadowMarketMetadata,
} from '@/lib/shadowMarket';

interface UseShadowMarketsOptions {
  category?: 'sports' | 'politics' | 'crypto' | 'entertainment' | 'other' | 'all';
  limit?: number;
  autoSync?: boolean;
}

/**
 * Hook to manage Shadow Markets with local contract data
 */
export function useShadowMarkets(options: UseShadowMarketsOptions = {}) {
  const { category = 'all', limit = 5, autoSync = true } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shadowMarkets, setShadowMarkets] = useState<ShadowMarket[]>([]);
  const [metadata, setMetadata] = useState<ShadowMarketMetadata[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);

  /**
   * Sync markets from Polymarket
   */
  const syncMarkets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch and sync Polymarket data
      const syncedMetadata = await fetchAndSyncShadowMarkets(limit);

      // Filter by category if specified
      let filtered = syncedMetadata;
      if (category !== 'all') {
        filtered = syncedMetadata.filter((m) => m.category === category);
      }

      setMetadata(filtered);
      setLastSyncedAt(new Date());

      // Note: Pool data will be fetched separately via contract reads
      // For now, we just set metadata
      const markets: ShadowMarket[] = filtered.map((meta) => {
        const contract = getShadowMarketContract(meta.polymarketId);

        return {
          id: `${meta.polymarketId}_137`,
          metadata: meta,
          contract: contract || {
            address: '0x0000000000000000000000000000000000000000', // Placeholder
            chainId: 137,
            deployed: false,
            createdAt: new Date(),
          },
          yesPool: BigInt(0),
          noPool: BigInt(0),
          yesOdds: 50,
          noOdds: 50,
          totalVolume: BigInt(0),
          status: contract ? 'active' : 'pending',
          lastSyncedAt: new Date(),
        };
      });

      setShadowMarkets(markets);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sync shadow markets';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [category, limit]);

  /**
   * Auto-sync on mount
   */
  useEffect(() => {
    if (autoSync) {
      syncMarkets();
    }
  }, [autoSync, syncMarkets]);

  /**
   * Get shadow market by ID
   */
  const getShadowMarketById = useCallback(
    (id: string) => {
      return shadowMarkets.find((m) => m.id === id);
    },
    [shadowMarkets]
  );

  /**
   * Get shadow market by Polymarket ID
   */
  const getShadowMarketByPolymarketId = useCallback(
    (polymarketId: string) => {
      return shadowMarkets.find((m) => m.metadata.polymarketId === polymarketId);
    },
    [shadowMarkets]
  );

  /**
   * Search shadow markets
   */
  const searchShadowMarkets = useCallback(
    (query: string) => {
      if (!query.trim()) {
        return shadowMarkets;
      }

      const lowerQuery = query.toLowerCase();
      return shadowMarkets.filter(
        (market) =>
          market.metadata.title.toLowerCase().includes(lowerQuery) ||
          market.metadata.description.toLowerCase().includes(lowerQuery)
      );
    },
    [shadowMarkets]
  );

  /**
   * Get statistics
   */
  const stats = useMemo(() => {
    if (shadowMarkets.length === 0) {
      return {
        totalMarkets: 0,
        totalVolume: BigInt(0),
        activeMarkets: 0,
        pendingMarkets: 0,
      };
    }

    const totalVolume = shadowMarkets.reduce((sum, m) => sum + m.totalVolume, BigInt(0));
    const activeMarkets = shadowMarkets.filter((m) => m.status === 'active').length;
    const pendingMarkets = shadowMarkets.filter((m) => m.status === 'pending').length;

    return {
      totalMarkets: shadowMarkets.length,
      totalVolume,
      activeMarkets,
      pendingMarkets,
    };
  }, [shadowMarkets]);

  /**
   * Retry sync
   */
  const retry = useCallback(() => {
    syncMarkets();
  }, [syncMarkets]);

  return {
    // Data
    shadowMarkets,
    metadata,
    getShadowMarketById,
    getShadowMarketByPolymarketId,
    searchShadowMarkets,
    stats,

    // State
    isLoading,
    error,
    lastSyncedAt,

    // Actions
    syncMarkets,
    retry,
  };
}

/**
 * Hook to fetch pool data for a specific shadow market contract
 */
export function useShadowMarketPoolData(contractAddress?: string, chainId: number = 137) {
  const [yesPool, setYesPool] = useState<bigint>(BigInt(0));
  const [noPool, setNoPool] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // In a real implementation, you would use wagmi's useContractRead here
  // For now, this is a placeholder that would be called with actual contract data
  const fetchPoolData = useCallback(async () => {
    if (!contractAddress) return;

    try {
      setIsLoading(true);
      // TODO: Implement actual contract read using wagmi
      // const result = await readContract({
      //   address: contractAddress as `0x${string}`,
      //   abi: BINARY_MARKET_ABI, // Import from contracts
      //   functionName: 'getMarketDetails',
      //   chainId,
      // });
      // setYesPool(result.yesPool);
      // setNoPool(result.noPool);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pool data';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [contractAddress, chainId]);

  useEffect(() => {
    fetchPoolData();
  }, [fetchPoolData]);

  return { yesPool, noPool, isLoading, error };
}

/**
 * Hook to get shadow markets by category
 */
export function useShadowMarketsByCategory(category: ShadowMarketMetadata['category']) {
  const [markets, setMarkets] = useState<ShadowMarketMetadata[]>([]);

  useEffect(() => {
    const filtered = getShadowMarketsByCategory(category);
    setMarkets(filtered);
  }, [category]);

  return markets;
}

/**
 * Hook to get all synced shadow market metadata
 */
export function useAllShadowMarketMetadata() {
  const [metadata, setMetadata] = useState<ShadowMarketMetadata[]>([]);

  useEffect(() => {
    const all = getAllShadowMarketMetadata();
    setMetadata(all);
  }, []);

  return metadata;
}
