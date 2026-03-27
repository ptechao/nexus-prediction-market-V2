import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, Filter, Download } from 'lucide-react';
import type { PortfolioPosition } from '@/hooks/useUserPortfolio';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';
import { AITranslatedText } from './AITranslatedText';

interface TradeHistoryProps {
  positions: PortfolioPosition[];
}

export function TradeHistory({ positions }: TradeHistoryProps) {
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;
  const [filterSide, setFilterSide] = useState<'all' | 'yes' | 'no'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'return'>('date');

  const filteredAndSorted = useMemo(() => {
    let filtered = positions;

    if (filterSide !== 'all') {
      filtered = filtered.filter((p) => p.side === filterSide);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.timestamp - a.timestamp;
        case 'pnl':
          return b.unrealizedPnL - a.unrealizedPnL;
        case 'return':
          return b.unrealizedPnLPercent - a.unrealizedPnLPercent;
        default:
          return 0;
      }
    });
  }, [positions, filterSide, sortBy]);

  const stats = useMemo(() => {
    const totalPnL = filteredAndSorted.reduce((sum, p) => sum + p.unrealizedPnL, 0);
    const winningTrades = filteredAndSorted.filter((p) => p.unrealizedPnL > 0).length;
    const losingTrades = filteredAndSorted.filter((p) => p.unrealizedPnL < 0).length;
    const winRate = filteredAndSorted.length > 0 ? (winningTrades / filteredAndSorted.length) * 100 : 0;
    const avgReturn = filteredAndSorted.length > 0 ? filteredAndSorted.reduce((sum, p) => sum + p.unrealizedPnLPercent, 0) / filteredAndSorted.length : 0;

    return { totalPnL, winningTrades, losingTrades, winRate, avgReturn };
  }, [filteredAndSorted]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExport = () => {
    const csv = [
      ['Market', 'Side', 'Shares', 'Entry Price', 'Current Price', 'P&L', 'Return %', 'Date'],
      ...filteredAndSorted.map((p) => [
        p.marketTitle,
        p.side.toUpperCase(),
        p.shares.toFixed(2),
        formatCurrency(p.entryPrice),
        formatCurrency(p.currentPrice),
        formatCurrency(p.unrealizedPnL),
        `${p.unrealizedPnLPercent.toFixed(2)}%`,
        formatDate(p.timestamp),
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-history-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-800/60 border-slate-700/50 p-4">
          <div className="text-xs text-slate-400 uppercase mb-1">{t.portfolio.totalGain}</div>
          <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(stats.totalPnL)}
          </div>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50 p-4">
          <div className="text-xs text-slate-400 uppercase mb-1">{t.leaderboard.winRate}</div>
          <div className="text-2xl font-bold text-cyan-400">{stats.winRate.toFixed(1)}%</div>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50 p-4">
          <div className="text-xs text-slate-400 uppercase mb-1">Winning Trades</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.winningTrades}</div>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50 p-4">
          <div className="text-xs text-slate-400 uppercase mb-1">Losing Trades</div>
          <div className="text-2xl font-bold text-red-400">{stats.losingTrades}</div>
        </Card>

        <Card className="bg-slate-800/60 border-slate-700/50 p-4">
          <div className="text-xs text-slate-400 uppercase mb-1">Avg Return</div>
          <div className={`text-2xl font-bold ${stats.avgReturn >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {stats.avgReturn.toFixed(2)}%
          </div>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">{t.markets.filterByCategory}:</span>
          {(['all', 'yes', 'no'] as const).map((side) => (
            <Button
              key={side}
              onClick={() => setFilterSide(side)}
              variant={filterSide === side ? 'default' : 'outline'}
              size="sm"
              className={`${
                filterSide === side
                  ? side === 'yes'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : side === 'no'
                      ? 'bg-red-600 hover:bg-red-500'
                      : 'bg-cyan-600 hover:bg-cyan-500'
                  : 'bg-slate-800/60 border-slate-700/50'
              }`}
            >
              {side === 'all' ? 'All' : side.toUpperCase()}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-slate-400">{t.common.ok || 'Sort'}:</span>
          {(['date', 'pnl', 'return'] as const).map((sort) => (
            <Button
              key={sort}
              onClick={() => setSortBy(sort)}
              variant={sortBy === sort ? 'default' : 'outline'}
              size="sm"
              className={sortBy === sort ? 'bg-cyan-600 hover:bg-cyan-500' : 'bg-slate-800/60 border-slate-700/50'}
            >
              {sort === 'date' ? t.markets.endDate : sort === 'pnl' ? t.portfolio.totalGain : t.portfolio.gainPercent}
            </Button>
          ))}
        </div>

        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          className="bg-slate-800/60 border-slate-700/50 text-slate-300 hover:bg-slate-700/60"
        >
          <Download className="w-4 h-4 mr-1" />
          Export
        </Button>
      </div>

      {/* Trade List */}
      <div className="space-y-3">
        {filteredAndSorted.length === 0 ? (
          <Card className="bg-slate-800/60 border-slate-700/50 p-8 text-center">
            <p className="text-slate-400">{t.portfolio.noHistory}</p>
          </Card>
        ) : (
          filteredAndSorted.map((position) => (
            <Card
              key={`${position.marketId}-${position.side}`}
              className="bg-slate-800/60 border-slate-700/50 p-4 hover:bg-slate-800/80 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Left: Market Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {position.side === 'yes' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-400" />
                    )}
                    <div className="flex-1">
                      <AITranslatedText text={position.marketTitle} as="h4" className="text-sm font-semibold text-white truncate" />
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(position.timestamp)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Stats */}
                <div className="flex items-center gap-6 flex-shrink-0">
                  <div className="text-right">
                    <Badge className={position.side === 'yes' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                      {position.side.toUpperCase()}
                    </Badge>
                    <p className="text-xs text-slate-500 mt-1">{position.shares.toFixed(2)} shares</p>
                  </div>

                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500">Entry</p>
                    <p className="text-sm font-medium text-slate-300">${position.entryPrice.toFixed(2)}</p>
                  </div>

                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500">Current</p>
                    <p className="text-sm font-medium text-slate-300">${position.currentPrice.toFixed(2)}</p>
                  </div>

                  <div className="text-right">
                    <p className={`text-sm font-bold ${position.unrealizedPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(position.unrealizedPnL)}
                    </p>
                    <p className={`text-xs font-medium ${position.unrealizedPnLPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {position.unrealizedPnLPercent >= 0 ? '+' : ''}
                      {position.unrealizedPnLPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
