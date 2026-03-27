import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';
import { AITranslatedText } from './AITranslatedText';

interface AdvancedSearchProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  category: string;
  setCategory: (cat: string) => void;
  oddsRange: [number, number];
  setOddsRange: (range: [number, number]) => void;
  poolSize: [number, number];
  setPoolSize: (size: [number, number]) => void;
  sortBy: string;
  setSortBy: (sort: 'volume' | 'trending' | 'endDate' | 'participants') => void;
  categories: string[];
}

export function AdvancedSearch({
  searchQuery, setSearchQuery,
  category, setCategory,
  oddsRange, setOddsRange,
  poolSize, setPoolSize,
  sortBy, setSortBy,
  categories
}: AdvancedSearchProps) {
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;
  const [isExpanded, setIsExpanded] = useState(false);

  const handleReset = () => {
    setSearchQuery('');
    setCategory('all');
    setOddsRange([0, 100]);
    setPoolSize([0, 10000000]);
    setSortBy('volume');
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <Input
          type="text"
          placeholder={t.markets.searchPlaceholder || "Search markets..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-slate-800/60 border-slate-700/50 text-white placeholder-slate-500"
        />
      </div>

      {/* Advanced Filters Toggle */}
      <div className="flex items-center gap-2">
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="outline"
          className="flex items-center gap-2 bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/60"
        >
          <Filter className="w-4 h-4" />
          {t.common.filters || 'Advanced Filters'}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
        {(category !== 'all' || searchQuery !== '' || oddsRange[0] !== 0 || oddsRange[1] !== 100) && (
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4 mr-1" />
            {t.common.clearFilters || 'Clear Filters'}
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">{t.markets.filterByCategory || 'Category'}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300 text-sm"
              >
                <option value="all">{t.markets.allCategories || 'All Categories'}</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Min Odds */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Min Odds (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={oddsRange[0]}
                onChange={(e) => setOddsRange([parseInt(e.target.value) || 0, oddsRange[1]])}
                className="bg-slate-900/60 border-slate-700/50 text-white placeholder-slate-600 text-sm"
              />
            </div>

            {/* Max Odds */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Max Odds (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                value={oddsRange[1]}
                onChange={(e) => setOddsRange([oddsRange[0], parseInt(e.target.value) || 100])}
                className="bg-slate-900/60 border-slate-700/50 text-white placeholder-slate-600 text-sm"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">{t.common.ok || 'Sort By'}</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300 text-sm"
              >
                <option value="volume">{t.markets.volume}</option>
                <option value="trending">{t.markets.trending}</option>
                <option value="endDate">{t.markets.endDate}</option>
                <option value="participants">{t.markets.participants || 'Participants'}</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
