import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, DollarSign, Zap, Target } from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';
import { AITranslatedText } from '@/components/AITranslatedText';

interface VaultStatsProps {
  totalAssets: number;
  totalShares: number;
  navPerShare: number;
  performanceFee: number;
  highWaterMark: number;
  isLocked: boolean;
  activePositions: number;
  leaderName: string;
}

export default function VaultStats({
  totalAssets,
  totalShares,
  navPerShare,
  performanceFee,
  highWaterMark,
  isLocked,
  activePositions,
  leaderName,
}: VaultStatsProps) {
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;
  // 計算關鍵指標
  const stats = useMemo(() => {
    const navChangePercent = ((navPerShare - highWaterMark) / highWaterMark) * 100;
    const isAboveHighWaterMark = navPerShare > highWaterMark;
    
    return {
      navChangePercent,
      isAboveHighWaterMark,
      formattedAssets: totalAssets.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      formattedNav: navPerShare.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      formattedHwm: highWaterMark.toLocaleString('en-US', {
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }),
      formattedFee: performanceFee.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  }, [totalAssets, navPerShare, highWaterMark, performanceFee]);

  return (
    <div className="space-y-4">
      {/* 主統計卡片 */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 overflow-hidden">
        <div className="p-6">
          {/* 標題和狀態 */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {leaderName}'s <AITranslatedText text={t.portfolio.wallet || 'Vault'} />
              </h2>
              <div className="text-sm text-slate-600 mt-1">
                <AITranslatedText text={t.leaderboard.subtitle || 'Pooled Copy Trading Fund'} />
              </div>
            </div>
            <div className="flex gap-2">
              {isLocked && (
                <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  {t.portfolio.positions || 'Active Position'}
                </Badge>
              )}
              {stats.isAboveHighWaterMark && (
                <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  <AITranslatedText text="Above HWM" />
                </Badge>
              )}
            </div>
          </div>

          {/* 主要指標網格 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* 總資產 */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <AITranslatedText as="span" className="text-xs font-semibold text-slate-600 uppercase" text={t.portfolio.totalGain || 'Total Assets'} />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${stats.formattedAssets}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {totalShares.toLocaleString()} <AITranslatedText text="shares" />
              </div>
            </div>

            {/* 每份額淨值 (NAV) */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-600" />
                <AITranslatedText as="span" className="text-xs font-semibold text-slate-600 uppercase" text="NAV per Share" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${stats.formattedNav}
              </div>
              <div className={`text-xs mt-1 font-semibold ${
                stats.isAboveHighWaterMark ? 'text-green-600' : 'text-slate-500'
              }`}>
                {stats.isAboveHighWaterMark ? '+' : ''}{stats.navChangePercent.toFixed(2)}% <AITranslatedText text="vs HWM" />
              </div>
            </div>

            {/* 高水位標記 */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <AITranslatedText as="span" className="text-xs font-semibold text-slate-600 uppercase" text="High Watermark" />
              </div>
              <div className="text-2xl font-bold text-slate-900">
                ${stats.formattedHwm}
              </div>
              <AITranslatedText as="p" className="text-xs text-slate-500 mt-1" text="Peak NAV" />
            </div>

            {/* 績效費 */}
            <div className="bg-white rounded-lg p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-orange-600" />
                <span className="text-xs font-semibold text-slate-600 uppercase">
                  {t.leaderboard.roi || 'Performance Fee'}
                </span>
              </div>
              <div className="text-2xl font-bold text-orange-600">
                ${stats.formattedFee}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                <AITranslatedText text="20% of profits" />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* 詳細信息卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 位置信息 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-600" />
              <AITranslatedText text="Active Positions" />
            </h3>
            <Badge variant="outline" className="bg-orange-50">
              {activePositions}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <AITranslatedText as="span" className="text-slate-600" text="Status" />
              <span className="font-semibold text-slate-900">
                {isLocked ? <AITranslatedText text="Locked" /> : <AITranslatedText text="Unlocked" />}
              </span>
            </div>
            <div className="text-xs text-slate-500">
              {isLocked
                ? <AITranslatedText text="Vault is locked while positions are active" />
                : <AITranslatedText text="Vault is unlocked - ready for new deposits" />}
            </div>
          </div>
        </Card>

        {/* 費用信息 */}
        <Card className="p-4 border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <AITranslatedText text="Fee Structure" />
            </h3>
            <Badge variant="outline" className="bg-green-50">
              20%
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <AITranslatedText as="span" className="text-slate-600" text="Performance Fee" />
              <AITranslatedText as="span" className="font-semibold text-slate-900" text="20% of profits" />
            </div>
            <AITranslatedText as="div" className="text-xs text-slate-500" text="Only charged when NAV exceeds high watermark" />
          </div>
        </Card>
      </div>

      {/* 說明卡片 */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-8 w-8 rounded-md bg-blue-200">
              <span className="text-blue-700 font-bold">i</span>
            </div>
          </div>
          <div className="text-sm text-blue-900">
            <AITranslatedText as="p" className="font-semibold mb-1" text={t.common.ok || 'How it works'} />
            <ul className="space-y-1 text-xs text-blue-800">
              <li>• <AITranslatedText text="Your deposit is converted to vault shares" /></li>
              <li>• <AITranslatedText text="Leader's bets are placed with pooled funds" /></li>
              <li>• <AITranslatedText text="Profits are shared proportionally to your shares" /></li>
              <li>• <AITranslatedText text="Leader earns 20% of profits as performance fee" /></li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
