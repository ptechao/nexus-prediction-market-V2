import { useMemo } from 'react';
import type { Market } from '@/components/MarketCard';

export interface SearchFilters {
  query: string;
  category?: string;
  minOdds?: number;
  maxOdds?: number;
  minPool?: number;
  maxPool?: number;
  sortBy?: 'volume' | 'trending' | 'endDate' | 'participants';
  sortOrder?: 'asc' | 'desc';
}

export function useMarketSearch(markets: Market[], filters: SearchFilters) {
  return useMemo(() => {
    let filtered = [...markets];

    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category && filters.category !== 'all') {
      filtered = filtered.filter((m) => m.category === filters.category);
    }

    // Odds range filter
    if (filters.minOdds !== undefined) {
      filtered = filtered.filter((m) => m.yesOdds >= filters.minOdds!);
    }
    if (filters.maxOdds !== undefined) {
      filtered = filtered.filter((m) => m.yesOdds <= filters.maxOdds!);
    }

    // Pool size filter
    if (filters.minPool !== undefined) {
      filtered = filtered.filter((m) => m.totalPool >= filters.minPool!);
    }
    if (filters.maxPool !== undefined) {
      filtered = filtered.filter((m) => m.totalPool <= filters.maxPool!);
    }

    // Sorting
    const sortBy = filters.sortBy || 'volume';
    const sortOrder = filters.sortOrder || 'desc';

    filtered.sort((a, b) => {
      let aValue: number;
      let bValue: number;

      switch (sortBy) {
        case 'volume':
          aValue = a.volume24h || 0;
          bValue = b.volume24h || 0;
          break;
        case 'trending':
          aValue = a.isTrending ? 1 : 0;
          bValue = b.isTrending ? 1 : 0;
          break;
        case 'endDate':
          aValue = new Date(a.endDate).getTime();
          bValue = new Date(b.endDate).getTime();
          break;
        case 'participants':
          aValue = a.participants || 0;
          bValue = b.participants || 0;
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });

    return filtered;
  }, [markets, filters]);
}
