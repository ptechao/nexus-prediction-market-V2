import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';
import type { Market } from './MarketCard';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';

interface MarketStatsProps {
  markets: Market[];
}

export function MarketStats({ markets }: MarketStatsProps) {
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;
  const stats = useMemo(() => {
    const totalVolume = markets.reduce((sum, m) => sum + (m.volume24h || 0), 0);
    const totalParticipants = markets.reduce((sum, m) => sum + (m.participants || 0), 0);
    const avgOdds = markets.length > 0 ? markets.reduce((sum, m) => sum + m.yesOdds, 0) / markets.length : 50;
    const trendingCount = markets.filter((m) => m.isTrending).length;

    // Category distribution
    const categoryMap = new Map<string, number>();
    markets.forEach((m) => {
      categoryMap.set(m.category, (categoryMap.get(m.category) || 0) + 1);
    });
    const categoryData = Array.from(categoryMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));

    // Volume distribution by category
    const categoryVolume = new Map<string, number>();
    markets.forEach((m) => {
      categoryVolume.set(m.category, (categoryVolume.get(m.category) || 0) + (m.volume24h || 0));
    });
    const volumeData = Array.from(categoryVolume.entries())
      .map(([name, value]) => ({
        name,
        volume: Math.round(value / 1000000),
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 10);

    return {
      totalVolume,
      totalParticipants,
      avgOdds,
      trendingCount,
      categoryData,
      volumeData,
    };
  }, [markets]);

  const COLORS = ['#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value}`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-medium text-slate-400 uppercase">{t.markets.volume} (24h)</span>
          </div>
          <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalVolume)}</div>
        </div>

        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-medium text-slate-400 uppercase">{t.markets.participants || 'Traders'}</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {stats.totalParticipants >= 1000
              ? `${(stats.totalParticipants / 1000).toFixed(1)}K`
              : stats.totalParticipants}
          </div>
        </div>

        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <span className="text-xs font-medium text-slate-400 uppercase">{t.leaderboard.roi || 'Avg Odds'}</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.avgOdds.toFixed(1)}%</div>
        </div>

        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="w-5 h-5 text-red-400" />
            <span className="text-xs font-medium text-slate-400 uppercase">{t.markets.trending || 'Trending'}</span>
          </div>
          <div className="text-2xl font-bold text-white">{stats.trendingCount}</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t.markets.marketsByCategory || 'Markets by Category'}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Volume by Category */}
        <div className="rounded-lg bg-slate-800/60 border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t.markets.volume} {t.common.by || 'by'} {t.markets.filterByCategory || 'Category'}</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: '#e2e8f0' }}
              />
              <Bar dataKey="volume" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
