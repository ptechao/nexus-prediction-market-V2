import { useUserPortfolio } from '@/hooks/useUserPortfolio';
import { TradeHistory } from '@/components/TradeHistory';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, TrendingUp, BarChart3, History, ArrowRight } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';
import { AITranslatedText } from '@/components/AITranslatedText';

export default function Portfolio() {
  const { address, isConnected } = useAccount();
  const { portfolio, loading } = useUserPortfolio();
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-background">
        <div className="p-6 rounded-full bg-secondary/50 mb-6">
          <Wallet className="w-12 h-12 text-muted-foreground" />
        </div>
        <AITranslatedText as="h2" className="text-2xl font-bold text-foreground mb-2" text={t.errors.walletNotConnected || 'Wallet Not Connected'} />
        <AITranslatedText as="p" className="text-muted-foreground mb-8 text-center max-w-md" text={t.portfolio.subtitle || 'Connect your wallet to view your positions and trade history.'} />
        <ConnectButton />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.portfolio.title}</h1>
          <p className="text-muted-foreground">{t.portfolio.subtitle}</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <Card className="bg-card border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 rounded-lg">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.portfolio.totalValue}</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {loading ? '...' : formatCurrency(portfolio?.totalValue || 0)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <AITranslatedText text="Across" /> {portfolio?.positions.length || 0} <AITranslatedText text="active positions" />
            </div>
          </Card>

          <Card className="bg-card border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.portfolio.totalGain}</span>
            </div>
            <div className={`text-3xl font-bold ${portfolio?.unrealizedPnL && portfolio.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {loading ? '...' : formatCurrency(portfolio?.unrealizedPnL || 0)}
            </div>
            <div className={`mt-2 text-xs font-bold ${portfolio?.unrealizedPnLPercent && portfolio.unrealizedPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolio?.unrealizedPnLPercent && portfolio.unrealizedPnLPercent >= 0 ? '+' : ''}
              {portfolio?.unrealizedPnLPercent?.toFixed(2)}%
            </div>
          </Card>

          <Card className="bg-card border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 rounded-lg">
                <BarChart3 className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.leaderboard.winRate}</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {loading ? '...' : `${((portfolio?.winRate || 0) * 100).toFixed(1)}%`}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <AITranslatedText text="Based on" /> {portfolio?.totalTrades || 0} <AITranslatedText text="total trades" />
            </div>
          </Card>

          <Card className="bg-card border-border p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400 rounded-lg">
                <History className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.copyTrading.totalAssets || 'Vol Traded'}</span>
            </div>
            <div className="text-3xl font-bold text-foreground">
              {loading ? '...' : formatCurrency(portfolio?.totalInvested || 0)}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <AITranslatedText text="Cumulative investment volume" />
            </div>
          </Card>
        </div>

        {/* Trade History Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">{t.portfolio.history}</h2>
            <Button variant="outline" className="text-primary border-primary/20 hover:bg-primary/5 transition-colors">
              <AITranslatedText text="Refresh Data" /> <History className="w-4 h-4 ml-2" />
            </Button>
          </div>
          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <TradeHistory positions={portfolio?.positions || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

