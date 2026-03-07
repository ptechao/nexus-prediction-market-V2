import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  DollarSign,
  BarChart3,
  Users,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

// ─── Market interface (matches server NexusMarket) ─────────────────────
export interface Market {
  id: string | number;
  title: string;
  description: string;
  category: string;
  endDate: string;
  image?: string | null;
  yesOdds: number;
  noOdds: number;
  totalPool: number;
  volume24h: number;
  participants: number;
  isTrending: boolean;
  polymarketUrl?: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────
export const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export const formatPool = (amount: number) => {
  if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

const CATEGORY_COLORS: Record<string, string> = {
  Politics: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  NBA: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Basketball: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  NFL: 'bg-green-500/20 text-green-300 border-green-500/30',
  Football: 'bg-green-500/20 text-green-300 border-green-500/30',
  Soccer: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
  Sports: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
  Bitcoin: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  Crypto: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  Ethereum: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  DeFi: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Finance: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Stock Market': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Economy: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  AI: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Technology: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  Science: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  Entertainment: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  Culture: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
  General: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
};

export const getCategoryColor = (category: string) =>
  CATEGORY_COLORS[category] || CATEGORY_COLORS.General;

// ─── MarketCard Component ────────────────────────────────────────────────────
export function MarketCard({ market }: { market: Market }) {
  const [, navigate] = useLocation();

  const handleBet = (side: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(
      `Bet ${side.toUpperCase()} on "${market.title}" — connect wallet to confirm.`
    );
  };

  const handleCardClick = () => {
    navigate(`/markets/${market.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`group relative overflow-hidden rounded-xl bg-slate-800/80 border transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer ${
        market.isTrending
          ? 'border-orange-500/30 hover:border-orange-400/50 hover:shadow-orange-500/10'
          : 'border-slate-700/50 hover:border-cyan-500/50 hover:shadow-cyan-500/10'
      }`}
    >     <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="relative px-5 py-3 flex items-center justify-between border-b border-slate-700/50 bg-slate-800/50">
        <Badge className={`text-xs font-medium border ${getCategoryColor(market.category)}`}>
          {market.category}
        </Badge>
        <div className="flex items-center gap-2">
          {market.isTrending && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm shadow-orange-500/30">
              <Flame className="w-3 h-3" />
              Hot
            </span>
          )}
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(market.endDate)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="relative p-5">
        {/* Optional event image */}
        {market.image && (
          <div className="mb-3 rounded-lg overflow-hidden h-32 bg-slate-700/30">
            <img
              src={market.image}
              alt={market.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        )}

        <h3 className="font-semibold text-lg text-white mb-2 leading-snug line-clamp-2 group-hover:text-cyan-300 transition-colors">
          {market.title}
        </h3>
        <p className="text-sm text-slate-400 mb-5 line-clamp-2 leading-relaxed">
          {market.description}
        </p>

        {/* Odds Bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-emerald-400">
              Yes {market.yesOdds}%
            </span>
            <span className="text-sm font-semibold text-red-400">
              No {market.noOdds}%
            </span>
          </div>
          <div className="h-3 rounded-full bg-slate-700 overflow-hidden flex">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-l-full transition-all duration-500"
              style={{ width: `${market.yesOdds}%` }}
            />
            <div
              className="bg-gradient-to-r from-red-500 to-red-400 rounded-r-full transition-all duration-500"
              style={{ width: `${market.noOdds}%` }}
            />
          </div>
        </div>

        {/* Bet Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Button
            onClick={(e) => handleBet('yes', e)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-5 text-base transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/30 border-0"
          >
            <TrendingUp className="w-4 h-4 mr-1.5" />
            Bet Yes
          </Button>
          <Button
            onClick={(e) => handleBet('no', e)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold py-5 text-base transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30 border-0"
          >
            <TrendingDown className="w-4 h-4 mr-1.5" />
            Bet No
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-700/50">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
              <DollarSign className="w-3 h-3" />
              <span className="text-xs">Volume</span>
            </div>
            <span className="text-sm font-bold text-slate-200">
              {formatPool(market.totalPool)}
            </span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
              <BarChart3 className="w-3 h-3" />
              <span className="text-xs">24h Vol</span>
            </div>
            <span className="text-sm font-bold text-slate-200">
              {formatPool(market.volume24h)}
            </span>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-slate-500 mb-0.5">
              <Users className="w-3 h-3" />
              <span className="text-xs">Traders</span>
            </div>
            <span className="text-sm font-bold text-slate-200">
              {market.participants.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Polymarket link */}
        {market.polymarketUrl && (
          <div className="mt-3 pt-3 border-t border-slate-700/30 text-center">
            <a
              href={market.polymarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 hover:text-cyan-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              View on Polymarket →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Skeleton Loader ───────────────────────────────────────────────────
export function MarketCardSkeleton() {
  return (
    <div className="rounded-xl bg-slate-800/80 border border-slate-700/50 overflow-hidden animate-pulse">
      <div className="px-5 py-3 flex items-center justify-between border-b border-slate-700/50 bg-slate-800/50">
        <div className="h-5 w-16 bg-slate-700 rounded" />
        <div className="h-4 w-24 bg-slate-700 rounded" />
      </div>
      <div className="p-5">
        <div className="h-6 w-full bg-slate-700 rounded mb-2" />
        <div className="h-6 w-3/4 bg-slate-700 rounded mb-2" />
        <div className="h-4 w-full bg-slate-700 rounded mb-5" />
        <div className="h-3 w-full bg-slate-700 rounded-full mb-5" />
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="h-10 bg-slate-700 rounded" />
          <div className="h-10 bg-slate-700 rounded" />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-700/50">
          <div className="h-8 bg-slate-700 rounded" />
          <div className="h-8 bg-slate-700 rounded" />
          <div className="h-8 bg-slate-700 rounded" />
        </div>
      </div>
    </div>
  );
}
