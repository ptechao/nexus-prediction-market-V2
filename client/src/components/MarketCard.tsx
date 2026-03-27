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
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { AITranslatedText } from '@/components/AITranslatedText';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';
import { useAITranslation } from '@/hooks/useAITranslation';

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

export function MarketCard({ market }: { market: Market }) {
  const [, navigate] = useLocation();
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;
  const { translatedText: translatedTitle } = useAITranslation(market.title);

  const handleBet = (side: 'yes' | 'no', e: React.MouseEvent) => {
    e.stopPropagation();
    toast.success(
      `${t.markets.bet} ${side.toUpperCase()} ${t.common.on || 'on'} "${translatedTitle}" — ${t.errors.walletNotConnected}.`
    );
  };

  const handleCardClick = () => {
    navigate(`/markets/${market.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col h-full"
    >
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {market.image && (
            <img
              src={market.image}
              alt={market.title}
              className="w-6 h-6 rounded-full object-cover border border-border"
              loading="lazy"
            />
          )}
          <Badge variant="secondary" className="text-[10px] font-medium bg-secondary text-secondary-foreground hover:bg-secondary">
            <AITranslatedText text={market.category} />
          </Badge>
          {market.isTrending && (
            <span className="text-[10px] flex items-center gap-1 font-semibold text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
              <Flame className="w-3 h-3" />
              {t.markets.trending || 'Hot'}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-6 h-6 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-full"
          onClick={(e) => {
            e.stopPropagation();
            const url = `${window.location.origin}/markets/${market.id}`;
            navigator.clipboard.writeText(url);
            toast.success(t.common.success || 'Market link copied to clipboard!');
          }}
        >
          <Share2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Content */}
      <div className="px-4 flex-[1]">
        <AITranslatedText 
          text={market.title} 
          as="h3"
          className="font-medium text-base text-foreground mb-1 leading-snug line-clamp-3 group-hover:text-primary transition-colors" 
        />
        <div className="text-xs text-muted-foreground flex items-center gap-3 mt-2">
          <span className="font-semibold text-foreground">{formatPool(market.totalPool)}</span> {t.markets.volumeShort || 'Vol.'}
        </div>
      </div>

      {/* Odds Bar */}
      <div className="px-4 mt-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-500">
            {t.betting.yes || 'Yes'} {market.yesOdds}%
          </span>
          <span className="text-sm font-semibold text-red-500 dark:text-red-400">
            {t.betting.no || 'No'} {market.noOdds}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
          <div
            className="bg-blue-600 dark:bg-blue-500 transition-all duration-500"
            style={{ width: `${market.yesOdds}%` }}
          />
          <div
            className="bg-red-500 dark:bg-red-400 transition-all duration-500"
            style={{ width: `${market.noOdds}%` }}
          />
        </div>
      </div>

      {/* Bet Buttons */}
      <div className="px-4 py-4 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={(e) => handleBet('yes', e)}
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:hover:bg-blue-500/20 dark:text-blue-400 shadow-none font-semibold text-sm h-10 border border-blue-200 dark:border-blue-500/20 transition-colors"
          >
            {t.markets.bet} {t.betting.yes}
          </Button>
          <Button
            onClick={(e) => handleBet('no', e)}
            className="bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 shadow-none font-semibold text-sm h-10 border border-red-200 dark:border-red-500/20 transition-colors"
          >
            {t.markets.bet} {t.betting.no}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loader ───────────────────────────────────────────────────
export function MarketCardSkeleton() {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden animate-pulse h-full flex flex-col">
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <div className="h-5 w-16 bg-muted rounded" />
        <div className="h-4 w-4 bg-muted rounded-full" />
      </div>
      <div className="px-4 flex-[1]">
        <div className="h-5 w-full bg-muted rounded mb-2 mt-1" />
        <div className="h-5 w-3/4 bg-muted rounded mb-4" />
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
      <div className="px-4 mt-6">
        <div className="flex justify-between mb-1.5">
          <div className="h-4 w-12 bg-muted rounded" />
          <div className="h-4 w-12 bg-muted rounded" />
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full" />
      </div>
      <div className="px-4 py-4 mt-auto">
        <div className="grid grid-cols-2 gap-2">
          <div className="h-10 bg-muted rounded" />
          <div className="h-10 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
