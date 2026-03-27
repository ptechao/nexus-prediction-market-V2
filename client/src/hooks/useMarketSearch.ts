import { useState, useMemo } from 'react';
import type { Market } from '@/components/MarketCard';

export function useMarketSearch(markets: Market[] = []) {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [oddsRange, setOddsRange] = useState<[number, number]>([0, 100]);
  const [poolSize, setPoolSize] = useState<[number, number]>([0, 10000000]);
  const [sortBy, setSortBy] = useState<'volume' | 'trending' | 'endDate' | 'participants'>('volume');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredMarkets = useMemo(() => {
    // Ensure markets is always an array
    const safeMarkets = Array.isArray(markets) ? markets : [];
    let filtered = [...safeMarkets];

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (category && category !== 'all') {
      filtered = filtered.filter((m) => m.category === category);
    }

    // Odds range filter
    if (oddsRange) {
      filtered = filtered.filter(
        (m) => m.yesOdds >= oddsRange[0] && m.yesOdds <= oddsRange[1]
      );
    }

    // Pool size filter
    if (poolSize) {
      filtered = filtered.filter(
        (m) => m.totalPool >= poolSize[0] && m.totalPool <= poolSize[1]
      );
    }

    // Sorting
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
  }, [markets, searchQuery, category, oddsRange, poolSize, sortBy, sortOrder]);

  return {
    searchQuery, setSearchQuery,
    category, setCategory,
    oddsRange, setOddsRange,
    poolSize, setPoolSize,
    sortBy, setSortBy,
    filteredMarkets,
  };
}
