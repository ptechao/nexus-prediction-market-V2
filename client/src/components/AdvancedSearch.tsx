import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import type { SearchFilters } from '@/hooks/useMarketSearch';

interface AdvancedSearchProps {
  onFiltersChange: (filters: SearchFilters) => void;
  categories: string[];
}

export function AdvancedSearch({ onFiltersChange, categories }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: 'all',
    sortBy: 'volume',
    sortOrder: 'desc',
  });

  const handleQueryChange = (query: string) => {
    const newFilters = { ...filters, query };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters: SearchFilters = {
      query: '',
      category: 'all',
      sortBy: 'volume',
      sortOrder: 'desc',
    };
    setFilters(resetFilters);
    onFiltersChange(resetFilters);
  };

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <Input
          type="text"
          placeholder="Search markets by title, description, or category..."
          value={filters.query}
          onChange={(e) => handleQueryChange(e.target.value)}
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
          Advanced Filters
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
        {(filters.category !== 'all' || filters.minOdds || filters.maxOdds || filters.minPool || filters.maxPool) && (
          <Button
            onClick={handleReset}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-slate-200"
          >
            <X className="w-4 h-4 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="rounded-lg bg-slate-800/40 border border-slate-700/50 p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Category</label>
              <select
                value={filters.category || 'all'}
                onChange={(e) => handleFilterChange('category', e.target.value === 'all' ? undefined : e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300 text-sm"
              >
                <option value="all">All Categories</option>
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
                placeholder="0"
                value={filters.minOdds || ''}
                onChange={(e) => handleFilterChange('minOdds', e.target.value ? parseInt(e.target.value) : undefined)}
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
                placeholder="100"
                value={filters.maxOdds || ''}
                onChange={(e) => handleFilterChange('maxOdds', e.target.value ? parseInt(e.target.value) : undefined)}
                className="bg-slate-900/60 border-slate-700/50 text-white placeholder-slate-600 text-sm"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase mb-2 block">Sort By</label>
              <select
                value={filters.sortBy || 'volume'}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-300 text-sm"
              >
                <option value="volume">Volume</option>
                <option value="trending">Trending</option>
                <option value="endDate">End Date</option>
                <option value="participants">Participants</option>
              </select>
            </div>
          </div>

          {/* Sort Order */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-slate-400 uppercase">Order:</label>
            <Button
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'desc' ? 'asc' : 'desc')}
              variant="outline"
              size="sm"
              className="bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/60"
            >
              {filters.sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
