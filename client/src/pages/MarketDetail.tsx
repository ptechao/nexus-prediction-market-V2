import { useState, useMemo } from 'react';
import { useRoute, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Flame,
  DollarSign,
  BarChart3,
  Users,
  Calendar,
  Clock,
  ExternalLink,
  Tag,
  Activity,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { trpc } from '@/lib/trpc';
import { formatPool, formatDate, getCategoryColor, type Market } from '@/components/MarketCard';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

// ─── Fallback Mock Detail Data ─────────────────────────────────────────
const MOCK_MARKET_DETAILS: Record<string, any> = {
  'mock-1': {
    id: 'mock-1',
    title: 'Trump vs Biden: Who wins the 2028 Presidential Election?',
    description: 'Predict whether Donald Trump or Joe Biden will win the 2028 US Presidential Election.',
    fullDescription: 'This market resolves based on the certified results of the 2028 US Presidential Election. The market will resolve YES if Donald Trump wins the election, and NO if Joe Biden wins. In the event of any other candidate winning, the market will resolve NO.\n\nResolution will be based on the official certification by the US Congress of the Electoral College results.',
    category: 'Politics',
    eventType: 'politics',
    endDate: '2028-11-05T00:00:00Z',
    startDate: '2025-01-01T00:00:00Z',
    image: null,
    yesOdds: 56,
    noOdds: 44,
    totalPool: 8200000,
    volume24h: 650000,
    volume1wk: 4550000,
    volume1mo: 18200000,
    participants: 24300,
    isTrending: true,
    slug: 'trump-vs-biden-2028',

    tags: ['Politics', 'Elections', 'US Election'],
    subMarkets: [],
    resolutionSource: 'Official US Congress certification of Electoral College results',
    commentCount: 1240,
    isActive: true,
    isClosed: false,
  },
  'mock-2': {
    id: 'mock-2',
    title: 'Lakers vs Warriors: Will Lakers win the 2026 NBA Finals?',
    description: 'Predict whether the Los Angeles Lakers will defeat the Golden State Warriors and win the 2026 NBA Championship Finals.',
    fullDescription: 'This market resolves YES if the Los Angeles Lakers win the 2026 NBA Championship Finals. The market covers the entire Finals series.\n\nResolution is based on the official NBA results.',
    category: 'NBA',
    eventType: 'sports',
    endDate: '2026-06-20T00:00:00Z',
    startDate: '2025-10-01T00:00:00Z',
    image: null,
    yesOdds: 62,
    noOdds: 38,
    totalPool: 2450000,
    volume24h: 185000,
    volume1wk: 1295000,
    volume1mo: 4900000,
    participants: 3842,
    isTrending: true,
    slug: 'lakers-vs-warriors-2026',

    tags: ['NBA', 'Basketball', 'Sports'],
    subMarkets: [],
    resolutionSource: 'Official NBA Finals results',
    commentCount: 456,
    isActive: true,
    isClosed: false,
  },
  'mock-3': {
    id: 'mock-3',
    title: 'Will BTC exceed $200,000 by end of 2026?',
    description: 'Predict whether Bitcoin (BTC) will reach a price above $200,000 USD on any major exchange before December 31, 2026.',
    fullDescription: 'This market resolves YES if Bitcoin (BTC) trades at or above $200,000 USD on any of the following exchanges: Coinbase, Binance, Kraken, or Bitstamp at any point before December 31, 2026 23:59:59 UTC.\n\nThe price must be a legitimate trade, not a flash crash or erroneous trade.',
    category: 'Bitcoin',
    eventType: 'crypto',
    endDate: '2026-12-31T00:00:00Z',
    startDate: '2025-01-01T00:00:00Z',
    image: null,
    yesOdds: 38,
    noOdds: 62,
    totalPool: 5800000,
    volume24h: 420000,
    volume1wk: 2940000,
    volume1mo: 11600000,
    participants: 12560,
    isTrending: true,
    slug: 'btc-200k-2026',

    tags: ['Crypto', 'Bitcoin', 'Price Prediction'],
    subMarkets: [],
    resolutionSource: 'CoinGecko aggregate price data',
    commentCount: 892,
    isActive: true,
    isClosed: false,
  },
  'fallback-1': {
    id: 'fallback-1',
    title: 'Lakers vs Warriors: Will Lakers win the 2026 NBA Finals?',
    description: 'Predict whether the Los Angeles Lakers will defeat the Golden State Warriors and win the 2026 NBA Championship Finals.',
    fullDescription: 'This market resolves YES if the Los Angeles Lakers win the 2026 NBA Championship Finals. The market covers the entire Finals series.\n\nResolution is based on the official NBA results.',
    category: 'NBA',
    eventType: 'sports',
    endDate: '2026-06-20T00:00:00Z',
    startDate: '2025-10-01T00:00:00Z',
    image: null,
    yesOdds: 62,
    noOdds: 38,
    totalPool: 2450000,
    volume24h: 185000,
    volume1wk: 1295000,
    volume1mo: 4900000,
    participants: 3842,
    isTrending: true,
    slug: 'lakers-vs-warriors-2026',

    tags: ['NBA', 'Basketball', 'Sports'],
    subMarkets: [],
    resolutionSource: 'Official NBA Finals results',
    commentCount: 456,
    isActive: true,
    isClosed: false,
  },
  'fallback-2': {
    id: 'fallback-2',
    title: 'Will Bitcoin exceed $150,000 by end of 2026?',
    description: 'Predict whether Bitcoin (BTC) will reach a price above $150,000 USD on any major exchange before December 31, 2026.',
    fullDescription: 'This market resolves YES if Bitcoin (BTC) trades at or above $150,000 USD on any major exchange at any point before December 31, 2026 23:59:59 UTC.',
    category: 'Bitcoin',
    eventType: 'crypto',
    endDate: '2026-12-31T00:00:00Z',
    startDate: '2025-01-01T00:00:00Z',
    image: null,
    yesOdds: 45,
    noOdds: 55,
    totalPool: 5800000,
    volume24h: 420000,
    volume1wk: 2940000,
    volume1mo: 11600000,
    participants: 12560,
    isTrending: true,
    slug: 'btc-150k-2026',

    tags: ['Crypto', 'Bitcoin'],
    subMarkets: [],
    resolutionSource: 'CoinGecko aggregate price data',
    commentCount: 892,
    isActive: true,
    isClosed: false,
  },
  'fallback-3': {
    id: 'fallback-3',
    title: 'US Presidential Approval Rating above 50% in March 2026?',
    description: 'Will the sitting US President maintain an approval rating above 50% in major polling averages during March 2026?',
    fullDescription: 'This market resolves YES if the sitting US President\'s approval rating is above 50% in the RealClearPolitics polling average at any point during March 2026.',
    category: 'Politics',
    eventType: 'politics',
    endDate: '2026-03-31T00:00:00Z',
    startDate: '2025-12-01T00:00:00Z',
    image: null,
    yesOdds: 34,
    noOdds: 66,
    totalPool: 1200000,
    volume24h: 95000,
    volume1wk: 665000,
    volume1mo: 2400000,
    participants: 5210,
    isTrending: false,
    slug: 'us-approval-march-2026',

    tags: ['Politics', 'US Politics'],
    subMarkets: [],
    resolutionSource: 'RealClearPolitics polling average',
    commentCount: 328,
    isActive: true,
    isClosed: false,
  },
  'fallback-4': {
    id: 'fallback-4',
    title: 'Will Ethereum ETF inflows exceed $10B in Q1 2026?',
    description: 'Predict whether cumulative net inflows into all spot Ethereum ETFs will surpass $10 billion by end of Q1 2026.',
    fullDescription: 'This market resolves YES if the total cumulative net inflows into all US-listed spot Ethereum ETFs exceed $10 billion by March 31, 2026.',
    category: 'Ethereum',
    eventType: 'crypto',
    endDate: '2026-03-31T00:00:00Z',
    startDate: '2025-10-01T00:00:00Z',
    image: null,
    yesOdds: 58,
    noOdds: 42,
    totalPool: 3100000,
    volume24h: 275000,
    volume1wk: 1925000,
    volume1mo: 6200000,
    participants: 7830,
    isTrending: true,
    slug: 'eth-etf-inflows-q1-2026',

    tags: ['Crypto', 'Ethereum', 'ETF'],
    subMarkets: [],
    resolutionSource: 'Bloomberg ETF flow data',
    commentCount: 567,
    isActive: true,
    isClosed: false,
  },
  'fallback-5': {
    id: 'fallback-5',
    title: 'Will the S&P 500 close above 6,500 by June 2026?',
    description: 'Predict whether the S&P 500 index will close above 6,500 points on any trading day before June 30, 2026.',
    fullDescription: 'This market resolves YES if the S&P 500 index closes above 6,500 points on any regular trading day before June 30, 2026.',
    category: 'Stock Market',
    eventType: 'finance',
    endDate: '2026-06-30T00:00:00Z',
    startDate: '2025-07-01T00:00:00Z',
    image: null,
    yesOdds: 71,
    noOdds: 29,
    totalPool: 1850000,
    volume24h: 132000,
    volume1wk: 924000,
    volume1mo: 3700000,
    participants: 4150,
    isTrending: false,
    slug: 'sp500-6500-june-2026',

    tags: ['Finance', 'Stock Market'],
    subMarkets: [],
    resolutionSource: 'S&P Dow Jones Indices official close',
    commentCount: 213,
    isActive: true,
    isClosed: false,
  },
  'fallback-6': {
    id: 'fallback-6',
    title: 'Will Japan hold a snap election before September 2026?',
    description: 'Predict whether the Japanese Prime Minister will dissolve the House of Representatives and call a snap general election before September 2026.',
    fullDescription: 'This market resolves YES if the Japanese Prime Minister officially dissolves the House of Representatives and calls a snap general election before September 1, 2026.',
    category: 'Politics',
    eventType: 'politics',
    endDate: '2026-09-01T00:00:00Z',
    startDate: '2025-11-01T00:00:00Z',
    image: null,
    yesOdds: 28,
    noOdds: 72,
    totalPool: 680000,
    volume24h: 42000,
    volume1wk: 294000,
    volume1mo: 1360000,
    participants: 1920,
    isTrending: false,
    slug: 'japan-snap-election-2026',

    tags: ['Politics', 'Japan', 'Elections'],
    subMarkets: [],
    resolutionSource: 'Official announcement by the Prime Minister of Japan',
    commentCount: 87,
    isActive: true,
    isClosed: false,
  },
};

function isMockId(id: string): boolean {
  return id.startsWith('mock-') || id.startsWith('fallback-');
}

// ─── Generate Mock Price History ───────────────────────────────────────
function generatePriceHistory(yesOdds: number, days = 90) {
  const data: { date: string; yes: number; no: number }[] = [];
  let currentYes = Math.max(10, Math.min(90, yesOdds - 20 + Math.random() * 10));

  for (let i = days; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    // Random walk toward current odds
    const drift = (yesOdds - currentYes) * 0.03;
    const noise = (Math.random() - 0.5) * 6;
    currentYes = Math.max(2, Math.min(98, currentYes + drift + noise));
    const roundedYes = Math.round(currentYes);

    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      yes: roundedYes,
      no: 100 - roundedYes,
    });
  }
  return data;
}

// ─── Custom Chart Tooltip ──────────────────────────────────────────────
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-emerald-400">Yes: {payload[0]?.value}%</p>
      <p className="text-sm font-bold text-red-400">No: {payload[1]?.value}%</p>
    </div>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────
function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="max-w-6xl mx-auto">
        <div className="h-6 w-32 bg-slate-700 rounded mb-8" />
        <div className="h-10 w-3/4 bg-slate-700 rounded mb-4" />
        <div className="h-6 w-1/2 bg-slate-700 rounded mb-8" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-72 bg-slate-800 rounded-xl" />
            <div className="h-48 bg-slate-800 rounded-xl" />
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-slate-800 rounded-xl" />
            <div className="h-40 bg-slate-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Not Found ─────────────────────────────────────────────────────────
function MarketNotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <XCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t('marketDetail.marketNotFound')}</h2>
        <p className="text-slate-400 mb-6">
          {t('marketDetail.marketNotFoundDesc')}
        </p>
        <Link href="/markets">
          <Button className="bg-cyan-600 hover:bg-cyan-500 text-white border-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('common.back')}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Trading Panel ─────────────────────────────────────────────────────
function TradingPanel({
  yesOdds,
  noOdds,
  title,
}: {
  yesOdds: number;
  noOdds: number;
  title: string;
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const odds = activeTab === 'yes' ? yesOdds : noOdds;
  const price = odds / 100; // e.g., 56% → $0.56 per share
  const estShares = price > 0 ? amountNum / price : 0;
  const potentialReturn = estShares; // Each share pays $1 if correct
  const potentialProfit = potentialReturn - amountNum;

  const handlePlaceOrder = () => {
    if (amountNum <= 0) {
      toast.error(t('errors.invalidAmount'));
      return;
    }
    toast.success(
      `${t('marketDetail.orderSubmitted')}: Buy ${activeTab.toUpperCase()} ${estShares.toFixed(1)} shares for $${amountNum.toFixed(2)} USDC on "${title}"`
    );
    setAmount('');
  };

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden">
      {/* Tab Header */}
      <div className="grid grid-cols-2">
        <button
          onClick={() => setActiveTab('yes')}
          className={`py-3.5 text-center font-bold text-sm transition-all duration-200 ${
            activeTab === 'yes'
              ? 'bg-emerald-600 text-white shadow-inner'
              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          {t('betting.yes')} — {yesOdds}¢
        </button>
        <button
          onClick={() => setActiveTab('no')}
          className={`py-3.5 text-center font-bold text-sm transition-all duration-200 ${
            activeTab === 'no'
              ? 'bg-red-600 text-white shadow-inner'
              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          {t('betting.no')} — {noOdds}¢
        </button>
      </div>

      {/* Trade Form */}
      <div className="p-5 space-y-4">
        {/* Amount Input */}
        <div>
          <label className="text-xs font-medium text-slate-400 mb-1.5 block">
            {t('betting.amount')}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">
              $
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0"
              step="1"
              className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg py-3 pl-7 pr-4 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all"
            />
          </div>
          {/* Quick amount buttons */}
          <div className="flex gap-2 mt-2">
            {[10, 50, 100, 500].map((val) => (
              <button
                key={val}
                onClick={() => setAmount(String(val))}
                className="flex-1 py-1.5 text-xs font-medium rounded-md bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200 transition-colors"
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t('marketDetail.pricePerShare')}</span>
            <span className="text-slate-300 font-medium">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t('marketDetail.estimatedShares')}</span>
            <span className="text-slate-300 font-medium">
              {amountNum > 0 ? estShares.toFixed(2) : '0'}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-700/30 pt-2">
            <span className="text-slate-500">{t('marketDetail.potentialReturn')}</span>
            <span className="text-slate-300 font-bold">
              {amountNum > 0 ? `$${potentialReturn.toFixed(2)}` : '$0'}
            </span>
          </div>
          {amountNum > 0 && potentialProfit > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t('marketDetail.potentialProfit')}</span>
              <span className="text-emerald-400 font-bold">
                +${potentialProfit.toFixed(2)} ({((potentialProfit / amountNum) * 100).toFixed(0)}%)
              </span>
            </div>
          )}
        </div>

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={amountNum <= 0}
          className={`w-full py-6 text-lg font-bold transition-all duration-200 border-0 ${
            activeTab === 'yes'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 disabled:bg-emerald-600/30'
              : 'bg-red-600 hover:bg-red-500 text-white hover:shadow-lg hover:shadow-red-500/30 disabled:bg-red-600/30'
          }`}
        >
          {amountNum > 0
            ? `${t('marketDetail.placeOrder')} — Buy ${activeTab === 'yes' ? t('betting.yes') : t('betting.no')}`
            : t('marketDetail.enterAmountToTrade')}
        </Button>

        <div className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            {t('marketDetail.walletInfo')}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Market Detail Page ────────────────────────────────────────────────
export default function MarketDetail() {
  const { t } = useTranslation();
  const [, params] = useRoute('/markets/:id');
  const marketId = params?.id || '';
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d'>('30d');

  const isMock = isMockId(marketId);
  const mockData = isMock ? MOCK_MARKET_DETAILS[marketId] : null;

  const { data: apiMarket, isLoading, isError } = trpc.markets.byId.useQuery(
    { id: marketId },
    {
      enabled: !!marketId && !isMock,
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  // Use API data for real IDs, mock data for mock/fallback IDs
  const market = isMock ? mockData : apiMarket;

  // Generate mock price history based on current odds
  const priceHistory = useMemo(() => {
    if (!market) return [];
    const days = chartRange === '7d' ? 7 : chartRange === '30d' ? 30 : 90;
    return generatePriceHistory(market.yesOdds, days);
  }, [market?.yesOdds, chartRange]);

  if (!isMock && isLoading) return <DetailSkeleton />;
  if (!market) return <MarketNotFound />;

  const timeRemaining = () => {
    const end = new Date(market.endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return t('marketDetail.ended');
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 365) return `${Math.floor(days / 365)}y ${days % 365}d ${t('marketDetail.left')}`;
    if (days > 30) return `${Math.floor(days / 30)}mo ${days % 30}d ${t('marketDetail.left')}`;
    if (days > 0) return `${days}d ${t('marketDetail.left')}`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}h ${t('marketDetail.left')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            {t('navigation.home')}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/markets" className="hover:text-cyan-400 transition-colors">
            {t('navigation.markets')}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-300 truncate max-w-xs">{market.title}</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge className={`text-sm font-medium border ${getCategoryColor(market.category)}`}>
              {market.category}
            </Badge>
            {market.isTrending && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm shadow-orange-500/30">
                <Flame className="w-3 h-3" />
                {t('markets.trending')}
              </span>
            )}
            {market.isActive ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Activity className="w-3 h-3" />
                {t('marketDetail.active')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/20">
                <XCircle className="w-3 h-3" />
                {t('marketDetail.closed')}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight">
            {market.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Ends {formatDate(market.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {timeRemaining()}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {market.commentCount.toLocaleString()} comments
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Chart & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price History Chart */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Price History</h2>
                <div className="flex gap-1">
                  {(['7d', '30d', '90d'] as const).map((range) => (
                    <button
                      key={range}
                      onClick={() => setChartRange(range)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        chartRange === range
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-600/50 hover:text-slate-200'
                      }`}
                    >
                      {range.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Large Odds Display */}
              <div className="flex items-center gap-6 mb-4">
                <div>
                  <span className="text-4xl font-bold text-emerald-400">{market.yesOdds}¢</span>
                  <span className="text-sm text-slate-500 ml-2">Yes</span>
                </div>
                <div className="text-xl text-slate-600">|</div>
                <div>
                  <span className="text-4xl font-bold text-red-400">{market.noOdds}¢</span>
                  <span className="text-sm text-slate-500 ml-2">No</span>
                </div>
              </div>

              {/* Chart */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="yesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="noGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="date"
                      stroke="#64748b"
                      tick={{ fontSize: 11 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#64748b"
                      tick={{ fontSize: 11 }}
                      domain={[0, 100]}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="yes"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="url(#yesGradient)"
                      name="Yes"
                    />
                    <Area
                      type="monotone"
                      dataKey="no"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      fill="url(#noGradient)"
                      name="No"
                      strokeDasharray="4 4"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: DollarSign,
                  label: 'Total Volume',
                  value: formatPool(market.totalPool),
                  color: 'text-cyan-400',
                },
                {
                  icon: BarChart3,
                  label: '24h Volume',
                  value: formatPool(market.volume24h),
                  color: 'text-blue-400',
                },
                {
                  icon: BarChart3,
                  label: 'Weekly Volume',
                  value: formatPool(market.volume1wk),
                  color: 'text-purple-400',
                },
                {
                  icon: Users,
                  label: 'Est. Traders',
                  value:
                    market.participants >= 1_000_000
                      ? `${(market.participants / 1_000_000).toFixed(1)}M`
                      : market.participants >= 1_000
                        ? `${(market.participants / 1_000).toFixed(1)}K`
                        : market.participants.toLocaleString(),
                  color: 'text-emerald-400',
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4"
                >
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <stat.icon className="w-4 h-4" />
                    <span className="text-xs">{stat.label}</span>
                  </div>
                  <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Event Image */}
            {market.image && (
              <div className="rounded-xl overflow-hidden h-48 sm:h-56 bg-slate-800/60 border border-slate-700/50">
                <img
                  src={market.image}
                  alt={market.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Description */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
              <h2 className="text-lg font-semibold text-white mb-3">About This Market</h2>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {market.fullDescription || market.description}
              </p>
              {market.resolutionSource && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">Resolution Source</h3>
                  <p className="text-sm text-slate-500">{market.resolutionSource}</p>
                </div>
              )}
            </div>

            {/* Sub-Markets */}
            {market.subMarkets && market.subMarkets.length > 1 && (
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  All Outcomes ({market.subMarkets.length})
                </h2>
                <div className="space-y-3">
                  {market.subMarkets.map((sub: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-700/30 hover:border-slate-600/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {sub.image && (
                          <img
                            src={sub.image}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {sub.question}
                          </p>
                          <p className="text-xs text-slate-500">Vol: {formatPool(sub.volume)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-400">
                            {sub.yesOdds}%
                          </span>
                          <span className="text-xs text-slate-600 mx-1">/</span>
                          <span className="text-sm font-bold text-red-400">{sub.noOdds}%</span>
                        </div>
                        {sub.active ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-600" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {market.tags && market.tags.length > 0 && (
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {market.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Trade Panel (Sticky) */}
          <div className="space-y-6">
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Trading Panel */}
              <TradingPanel
                yesOdds={market.yesOdds}
                noOdds={market.noOdds}
                title={market.title}
              />

              {/* Market Info Card */}
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
                <h3 className="text-sm font-semibold text-slate-400 mb-3">Market Info</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Status</span>
                    <span className={market.isActive ? 'text-emerald-400' : 'text-slate-400'}>
                      {market.isActive ? 'Active' : market.isClosed ? 'Closed' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Created</span>
                    <span className="text-slate-300">
                      {market.startDate ? formatDate(market.startDate) : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">End Date</span>
                    <span className="text-slate-300">{formatDate(market.endDate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Monthly Vol</span>
                    <span className="text-slate-300">{formatPool(market.volume1mo)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Sub-Markets</span>
                    <span className="text-slate-300">{market.subMarkets?.length || 1}</span>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-10 pt-6 border-t border-slate-800">
          <Link href="/markets">
            <Button
              variant="outline"
              className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to All Markets
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
