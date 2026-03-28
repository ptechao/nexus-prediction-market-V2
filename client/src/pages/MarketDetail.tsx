import { useState, useMemo } from 'react';
import { useRoute, Link } from 'wouter';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
  Check,
  Share2,
  Copy,
  ListFilter,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  HelpCircle,
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
import { formatPool, type Market } from '@/components/MarketCard';
import { useAITranslation } from '@/hooks/useAITranslation';
import { AITranslatedText } from '@/components/AITranslatedText';
import { toast } from 'sonner';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';
import { useTranslation } from '@/hooks/useTranslation';
import { PositionManager } from '@/components/PositionManager';
import { useNexus } from '@/hooks/useNexus';
import { parseUnits } from 'viem';

// ─── Local Helpers ─────────────────────────────────────────────────────
const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Politics': 'bg-blue-100 text-blue-800 border-blue-200',
    'Crypto': 'bg-orange-100 text-orange-800 border-orange-200',
    'Sports': 'bg-green-100 text-green-800 border-green-200',
    'NBA': 'bg-purple-100 text-purple-800 border-purple-200',
    'Bitcoin': 'bg-amber-100 text-amber-800 border-amber-200',
    'Ethereum': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  };
  return colors[category] || 'bg-slate-100 text-slate-800 border-slate-200';
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

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
    polymarketUrl: '',
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
    polymarketUrl: '',
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
    polymarketUrl: '',
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
    polymarketUrl: '',
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
    polymarketUrl: '',
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
    polymarketUrl: '',
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
    polymarketUrl: '',
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
    polymarketUrl: '',
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
    polymarketUrl: '',
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
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <XCircle className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">{t.errors.marketNotFound || 'Market Not Found'}</h2>
        <p className="text-slate-400 mb-6">
          {t.errors.marketNotAvailable || 'This market may have been removed or the ID is invalid.'}
        </p>
        <Link href="/markets">
          <Button className="bg-cyan-600 hover:bg-cyan-500 text-white border-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.common.back || 'Back to Markets'}
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ─── Trading Panel ─────────────────────────────────────────────────────
function TradingPanel({
  marketAddress,
  yesOdds,
  noOdds,
  title,
  tradeType,
  setTradeType,
  limitPrice,
  setLimitPrice,
  isLimitBuying,
  setIsLimitBuying,
}: {
  marketAddress: string;
  yesOdds: number;
  noOdds: number;
  title: string;
  tradeType: 'market' | 'limit';
  setTradeType: (t: 'market' | 'limit') => void;
  limitPrice: string;
  setLimitPrice: (p: string) => void;
  isLimitBuying: boolean;
  setIsLimitBuying: (b: boolean) => void;
}) {
  const { buyYes, buyNo, placeLimitOrder, isLoading: isTxLoading } = useNexus(marketAddress);
  const [slippage, setSlippage] = useState(1); // 1% default
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;
  const [activeTab, setActiveTab] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('');

  const amountNum = parseFloat(amount) || 0;
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  const odds = activeTab === 'yes' ? yesOdds : noOdds;
  const price = odds / 100;
  
  // Market Calc
  const estShares = price > 0 ? amountNum / price : 0;
  const minSharesOut = parseUnits((estShares * (1 - slippage / 100)).toFixed(6), 6);
  
  // Limit Calc
  const limitPriceNum = parseFloat(limitPrice) || 0;
  const limitShares = limitPriceNum > 0 ? (isLimitBuying ? amountNum / limitPriceNum : amountNum) : 0; 
  const limitCost = isLimitBuying ? amountNum : (limitPriceNum * amountNum);
  const limitPotentialReturn = isLimitBuying ? limitShares : (limitShares * limitPriceNum); 
  const limitProfit = isLimitBuying ? (limitShares - limitCost) : (limitPriceNum * amountNum);
  
  const potentialReturn = tradeType === 'market' ? estShares : limitPotentialReturn;
  const potentialProfit = tradeType === 'market' ? (estShares - amountNum) : limitProfit;

  const handlePlaceOrder = async () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }

    if (amountNum <= 0) {
      toast.error(t.errors.invalidAmount || <AITranslatedText text="Please enter a valid amount" />);
      return;
    }
    
    try {
      if (tradeType === 'market') {
        const success = activeTab === 'yes' 
          ? await buyYes(amount, minSharesOut) 
          : await buyNo(amount, minSharesOut);
          
        if (success) {
          toast.success(
            <span><AITranslatedText text={t.markets.bet} /> {activeTab.toUpperCase()} {estShares.toFixed(1)} <AITranslatedText text={t.portfolio.positions || 'shares'} /> for ${amountNum.toFixed(2)} USDC</span>
          );
          setAmount('');
        }
      } else {
        // Limit Order
        const isBuying = isLimitBuying;
        const isYes = activeTab === 'yes';
        const success = await placeLimitOrder(amount, limitPrice, isYes, isBuying);
        
        if (success) {
          toast.success(`Limit ${isBuying ? 'BUY' : 'SELL'} order placed at $${limitPrice}`);
          setAmount('');
        }
      }
    } catch (err) {
      toast.error(<AITranslatedText text="Transaction failed" />);
    }
  };

  return (
    <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 overflow-hidden">
      {/* Tab Header */}
      <div className="grid grid-cols-2">
        <button
          onClick={() => { setActiveTab('yes'); setIsLimitBuying(true); }}
          className={`py-3.5 text-center font-bold text-sm transition-all duration-200 border-r border-slate-700/50 ${
            activeTab === 'yes'
              ? 'bg-emerald-600 text-white shadow-inner'
              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          {t.betting.yes || 'Yes'} {yesOdds}¢
        </button>
        <button
          onClick={() => { setActiveTab('no'); setIsLimitBuying(true); }}
          className={`py-3.5 text-center font-bold text-sm transition-all duration-200 ${
            activeTab === 'no'
              ? 'bg-red-600 text-white shadow-inner'
              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80 hover:text-slate-200'
          }`}
        >
          <TrendingDown className="w-4 h-4 inline mr-1.5 -mt-0.5" />
          {t.betting.no || 'No'} {noOdds}¢
        </button>
      </div>

      {/* Trade Type Tabs */}
      <div className="flex bg-slate-900/50 p-1 border-b border-slate-800">
        <button 
           onClick={() => setTradeType('market')}
           className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all ${tradeType === 'market' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
           <AITranslatedText text="Market" />
        </button>
        <button 
           onClick={() => setTradeType('limit')}
           className={`flex-1 py-1 px-2 rounded-md text-[10px] font-bold tracking-widest uppercase transition-all ${tradeType === 'limit' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
        >
           <AITranslatedText text="Limit" />
        </button>
      </div>

      {/* Trade Form */}
      <div className="p-5 space-y-4">
        {/* Limit Order Sub-tabs */}
        {tradeType === 'limit' && (
           <div className="flex gap-2 mb-2 p-1 bg-slate-900/50 rounded-lg">
              <button 
                 onClick={() => setIsLimitBuying(true)}
                 className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${isLimitBuying ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500'}`}
              >
                 <AITranslatedText text={`Buy ${activeTab.toUpperCase()}`} />
              </button>
              <button 
                 onClick={() => setIsLimitBuying(false)}
                 className={`flex-1 py-1.5 text-[10px] font-bold rounded-md transition-all ${!isLimitBuying ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'text-slate-500'}`}
              >
                 <AITranslatedText text={`Sell ${activeTab.toUpperCase()}`} />
              </button>
           </div>
        )}

        {/* Amount Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-medium text-slate-400">
              {tradeType === 'market' || isLimitBuying ? <span><AITranslatedText text={t.betting.amount || 'Amount'} /> (USDC)</span> : <AITranslatedText text="Amount (Shares)" />}
            </label>
            <button className="text-slate-600 hover:text-slate-400">
               <HelpCircle className="w-3 h-3" />
            </button>
          </div>
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

        {/* Price Input for Limit Order */}
        {tradeType === 'limit' && (
           <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">
                 <AITranslatedText text="Limit Price (USDC)" />
              </label>
              <div className="relative">
                 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">$</span>
                 <input
                    type="number"
                    value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="0.50"
                    step="0.01"
                    min="0.01"
                    max="0.99"
                    className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg py-3 pl-7 pr-4 text-white focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono"
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 tracking-tighter"><AITranslatedText text="PER SHARE" /></div>
              </div>
           </div>
        )}

        <div className="flex items-center justify-between px-1">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
             <AITranslatedText text="Slippage Tolerance" />
          </label>
          <div className="flex gap-1.5">
            {[0.5, 1, 3].map(s => (
              <button 
                key={s} 
                type="button"
                onClick={() => setSlippage(s)}
                className={`text-[10px] px-2 py-0.5 rounded border transition-all ${slippage === s ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-transparent text-slate-500 border-slate-800 hover:border-slate-700'}`}
              >
                {s}%
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700/30">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t.betting.pricePerShare || 'Price per share'}</span>
            <span className="text-slate-300 font-medium">${price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">{t.betting.estShares || 'Est. Shares'}</span>
            <span className="text-slate-300 font-medium">
              {amountNum > 0 ? estShares.toFixed(2) : '0'}
            </span>
          </div>
          <div className="flex justify-between text-sm border-t border-slate-700/30 pt-2">
            <span className="text-slate-500">{t.betting.potentialReturn || 'Potential Return'}</span>
            <span className="text-slate-300 font-bold">
              {amountNum > 0 ? `$${potentialReturn.toFixed(2)}` : '$0'}
            </span>
          </div>
          {amountNum > 0 && potentialProfit > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">{t.betting.potentialProfit || 'Potential Profit'}</span>
              <span className="text-emerald-400 font-bold">
                +${potentialProfit.toFixed(2)} ({((potentialProfit / amountNum) * 100).toFixed(0)}%)
              </span>
            </div>
          )}
        </div>

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={amountNum <= 0 || isTxLoading}
          className={`w-full py-6 text-lg font-bold transition-all duration-200 border-0 ${
            activeTab === 'yes'
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-lg hover:shadow-emerald-500/30 disabled:bg-emerald-600/30'
              : 'bg-red-600 hover:bg-red-500 text-white hover:shadow-lg hover:shadow-red-500/30 disabled:bg-red-600/30'
          }`}
        >
          {isTxLoading ? <AITranslatedText text="Confirming..." /> : amountNum > 0
            ? <span><AITranslatedText text={t.betting.placeOrder || 'Place Order'} /> — <AITranslatedText text={`${t.betting.buy || 'Buy'} ${activeTab === 'yes' ? (t.betting.yes || 'Yes') : (t.betting.no || 'No')}`} /></span>
            : <AITranslatedText text={t.betting.enterAmountToTrade || 'Enter Amount to Trade'} />}
        </Button>

        <div className="flex items-start gap-2 text-xs text-slate-500">
          <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <span>
            <AITranslatedText text={t.betting.connectWalletInfo || 'Connect your wallet to place real bets. Each share pays $1.00 if the outcome is correct.'} />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Market Detail Page ────────────────────────────────────────────────
export default function MarketDetail() {
  const { address: userAddress, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { language } = useLanguageContext();
  const t_i18n = (messages as Record<string, any>)[language] || messages.en;
  const [, params] = useRoute('/markets/:id');
  const marketId = params?.id || '';
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d'>('30d');

  const isMock = isMockId(marketId);
  const mockData = isMock ? MOCK_MARKET_DETAILS[marketId] : null;

  const { data: apiMarket, isLoading: isApiLoading, isError } = trpc.markets.byId.useQuery(
    { id: marketId },
    {
      enabled: !!marketId && !isMock && !marketId.startsWith('wc-'),
      staleTime: 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    }
  );

  const { data: wcMarket, isLoading: isWCLoading } = trpc.markets.worldCupById.useQuery(
    { id: marketId },
    {
      enabled: !!marketId && marketId.startsWith('wc-'),
      staleTime: 300_000,
    }
  );

  const { data: aiPrediction, isLoading: isAILoading } = trpc.markets.worldCupPrediction.useQuery(
    { id: marketId },
    {
      enabled: !!marketId && marketId.startsWith('wc-'),
      staleTime: 86400_000,
    }
  );

  // Use API data for real IDs, mock data for mock/fallback IDs
  const market = isMock ? mockData : (marketId.startsWith('wc-') ? wcMarket : apiMarket);

  // Generate mock price history based on current odds
  const { data: historyData, isLoading: isHistoryLoading } = trpc.markets.priceHistory.useQuery(
    { marketId: String(marketId) },
    { enabled: !isMock, staleTime: 30000 }
  );

  // Use real history if available, else mock
  const priceHistory = useMemo(() => {
    if (isMock || !historyData || historyData.length === 0) {
      const days = chartRange === '7d' ? 7 : chartRange === '30d' ? 30 : 90;
      return generatePriceHistory(market?.yesOdds || 50, days);
    }
    return historyData.map(h => ({
      date: new Date(h.timestamp * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      yes: Math.round(h.priceYes * 100),
      no: Math.round(h.priceNo * 100),
    }));
  }, [market?.yesOdds, chartRange, historyData, isMock]);

  const [isCopied, setIsCopied] = useState(false);
  const [tradeType, setTradeType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState('0.5');
  const [isLimitBuying, setIsLimitBuying] = useState(true);
  
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}?ref=${userAddress || ''}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setIsCopied(true);
    toast.success(<AITranslatedText text="Referral link copied!" />);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isLoading = isMock ? false : (marketId.startsWith('wc-') ? isWCLoading : isApiLoading);
  if (isLoading) return <DetailSkeleton />;
  if (!market) return <MarketNotFound />;

  const timeRemaining = () => {
    const end = new Date(market.endDate).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return t_i18n.common.ended || 'Ended';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days > 365) return `${Math.floor(days / 365)}${t_i18n.common.yearShort || 'y'} ${days % 365}${t_i18n.common.dayShort || 'd'} ${t_i18n.common.left || 'left'}`;
    if (days > 30) return `${Math.floor(days / 30)}${t_i18n.common.monthShort || 'mo'} ${days % 30}${t_i18n.common.dayShort || 'd'} ${t_i18n.common.left || 'left'}`;
    if (days > 0) return `${days}${t_i18n.common.dayShort || 'd'} ${t_i18n.common.left || 'left'}`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `${hours}${t_i18n.common.hourShort || 'h'} ${t_i18n.common.left || 'left'}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            {t_i18n.common.home || 'Home'}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/markets" className="hover:text-cyan-400 transition-colors">
            {t_i18n.common.markets || 'Markets'}
          </Link>
          <ChevronRight className="w-3 h-3" />
          <AITranslatedText text={market.title} className="text-slate-300 truncate max-w-xs" />
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Badge className={`text-sm font-medium border ${getCategoryColor(market.category)}`}>
              <AITranslatedText text={market.category} />
            </Badge>
            {market.isTrending && (
              <span className="inline-flex items-center gap-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm shadow-orange-500/30">
                <Flame className="w-3 h-3" />
                {t_i18n.common.trending || 'Trending'}
              </span>
            )}
            {market.isActive ? (
              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <Activity className="w-3 h-3" />
                {t_i18n.common.active || 'Active'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-500/10 px-2.5 py-1 rounded-full border border-slate-500/20">
                <XCircle className="w-3 h-3" />
                {t_i18n.common.closed || 'Closed'}
              </span>
            )}
          </div>

          <AITranslatedText 
            text={market.title} 
            as="h1"
            className="text-3xl sm:text-4xl font-bold text-white mb-3 leading-tight" 
          />

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {t_i18n.common.ends || 'Ends'} {formatDate(market.endDate)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {timeRemaining()}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              {market.commentCount.toLocaleString()} {t_i18n.common.comments || 'comments'}
            </span>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Right Column: Position Manager & Trading (Mobile First order shifted via CSS or just placement) */}
          <div className="lg:col-span-1 lg:order-2 space-y-6">
            {!isMock && <PositionManager marketAddress={(market as any).address || marketId} />}
            
            {/* Share & Earn Card */}
            {!isMock && (
              <Card className="p-5 bg-gradient-to-br from-indigo-600/20 to-purple-600/10 border-indigo-500/30 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Share2 className="w-12 h-12 text-indigo-400 rotate-12" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-400" />
                    <AITranslatedText text="Share & Earn 50% Fees" />
                  </h3>
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-500/50 cursor-pointer hover:text-indigo-400" />
                </div>
                
                <div className="text-xs text-slate-400 mb-4 leading-relaxed">
                  <AITranslatedText text="Invite friends to this market and earn 50% of the protocol fees from every trade they make." />
                </div>
                
                <div className="flex gap-2">
                  <div className={`flex-1 bg-slate-950/50 rounded-lg px-3 py-2 border border-slate-800 text-[10px] text-slate-500 font-mono truncate items-center flex ${!isConnected && 'blur-[2px]'}`}>
                    {isConnected ? shareUrl : 'https://nexus.market/m/77?ref=CONNECT_TO_ACTIVATE'}
                  </div>
                  <Button 
                    size="sm" 
                    onClick={isConnected ? handleCopyLink : openConnectModal}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 px-3 min-w-[36px]"
                  >
                    {!isConnected ? <Users className="w-4 h-4" /> : isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-[9px] text-indigo-400/60 mt-2 text-center font-bold tracking-widest uppercase">
                    <AITranslatedText text="Connect wallet to activate your referral link" />
                  </p>
                )}
              </Card>
            )}

            {/* Professional Order Book Display */}
            {!isMock && (
              <Card className="bg-slate-950/80 border-slate-800 overflow-hidden">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-3 h-3 text-cyan-400" />
                    <AITranslatedText text="Market Order Book" />
                  </h3>
                  <Badge variant="outline" className="text-[9px] border-slate-700 text-slate-500"><AITranslatedText text="REALTIME" /></Badge>
                </div>
                <div className="p-0">
                  <div className="grid grid-cols-3 text-[10px] text-slate-500 font-bold bg-slate-900/50 px-4 py-2 uppercase tracking-tighter border-b border-slate-800/30">
                     <span><AITranslatedText text="Price (USDC)" /></span>
                     <span className="text-right"><AITranslatedText text="Size (Shares)" /></span>
                     <span className="text-right"><AITranslatedText text="Total (USDC)" /></span>
                  </div>
                  
                  {/* Mock Bids/Asks if none in list, but let's try to render real ones if available */}
                  <div className="divide-y divide-slate-800/20">
                    {/* Bids (Buying YES) - Shown in Green */}
                    {(market as any).orders?.filter((o: any) => o.status === 'OPEN' && o.isBuying && o.isYes).map((order: any) => (
                      <div key={order.id} className="grid grid-cols-3 px-4 py-1.5 text-xs hover:bg-green-500/5 transition-colors cursor-pointer group">
                        <span className="text-green-400 font-bold">{(order.price / 1e6).toFixed(2)}</span>
                        <span className="text-right text-slate-300">{(order.remaining / 1e6).toLocaleString()}</span>
                        <span className="text-right text-slate-500 group-hover:text-white transition-colors">{(order.remaining * order.price / 1e12).toFixed(1)}</span>
                      </div>
                    ))}
                    {/* Placeholder Bids if empty */}
                    {!(market as any).orders?.length && [0.48, 0.45, 0.42].map(p => (
                      <div key={p} className="grid grid-cols-3 px-4 py-1.5 text-xs opacity-40 grayscale group hover:grayscale-0 transition-all">
                        <span className="text-emerald-500/80 font-mono">{p.toFixed(2)}</span>
                        <span className="text-right text-slate-600">{(p * 1000).toFixed(0)}</span>
                        <span className="text-right text-slate-700">{(p * 1000 * p).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            <TradingPanel 
              marketAddress={(market as any).address || marketId} 
              yesOdds={market.yesOdds} 
              noOdds={market.noOdds} 
              title={market.title} 
              tradeType={tradeType}
              setTradeType={setTradeType}
              limitPrice={limitPrice}
              setLimitPrice={setLimitPrice}
              isLimitBuying={isLimitBuying}
              setIsLimitBuying={setIsLimitBuying}
            />
          </div>

          {/* Left Column: Chart & Details */}
          <div className="lg:col-span-2 lg:order-1 space-y-6">
            {/* Price History Chart */}
            <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">{t_i18n.markets.priceHistory || 'Price History'}</h2>
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
                  <span className="text-sm text-slate-500 ml-2">{t_i18n.betting.yes || 'Yes'}</span>
                </div>
                <div className="text-xl text-slate-600">|</div>
                <div>
                  <span className="text-4xl font-bold text-red-400">{market.noOdds}¢</span>
                  <span className="text-sm text-slate-500 ml-2">{t_i18n.betting.no || 'No'}</span>
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
                      name={t_i18n.betting.yes || 'Yes'}
                    />
                    <Area
                      type="monotone"
                      dataKey="no"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      fill="url(#noGradient)"
                      name={t_i18n.betting.no || 'No'}
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
                  label: t_i18n.markets.totalVolume || 'Total Volume',
                  value: formatPool(market.totalPool),
                  color: 'text-cyan-400',
                },
                {
                  icon: BarChart3,
                  label: t_i18n.markets.volume24h || '24h Volume',
                  value: formatPool(market.volume24h),
                  color: 'text-blue-400',
                },
                {
                  icon: BarChart3,
                  label: t_i18n.markets.volume1wk || 'Weekly Volume',
                  value: formatPool(market.volume1wk),
                  color: 'text-purple-400',
                },
                {
                  icon: Users,
                  label: t_i18n.markets.estTraders || 'Est. Traders',
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
              <h2 className="text-lg font-semibold text-white mb-3">{t_i18n.markets.aboutThisMarket || 'About This Market'}</h2>
              <AITranslatedText 
                text={market.fullDescription || market.description} 
                as="p"
                className="text-slate-300 leading-relaxed whitespace-pre-wrap" 
              />
              {market.resolutionSource && (
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <h3 className="text-sm font-semibold text-slate-400 mb-1">{t_i18n.markets.resolutionSource || 'Resolution Source'}</h3>
                  <AITranslatedText text={market.resolutionSource} as="p" className="text-sm text-slate-500" />
                </div>
              )}
            </div>

            {/* Sub-Markets */}
            {market.subMarkets && market.subMarkets.length > 1 && (
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">
                  {t_i18n.markets.allOutcomes || 'All Outcomes'} ({market.subMarkets.length})
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
                          <AITranslatedText as="p" text={sub.question} className="text-sm font-medium text-white truncate" />
                          <p className="text-xs text-slate-500">{t_i18n.common.volumeShort || 'Vol'}: {formatPool(sub.volume)}</p>
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

            {/* AI Prediction Section */}
            {marketId?.startsWith('wc-') && (
              <div className="rounded-xl bg-slate-800/60 border border-cyan-500/30 p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 p-3">
                  <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30">{t_i18n.markets.aiAnalysis || 'AI Analysis'}</Badge>
                </div>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-6 h-6 text-cyan-400" />
                  {t_i18n.markets.nexusAIPrediction || 'Nexus AI Prediction'}
                </h2>
                
                {isAILoading ? (
                  <div className="flex flex-col items-center py-8 space-y-4">
                    <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                    <p className="text-slate-400 text-sm">{t_i18n.markets.analyzingMatchData || 'Analyzing match data and historical performance...'}</p>
                  </div>
                ) : aiPrediction ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between items-end">
                          <span className="text-sm text-slate-400">{t_i18n.markets.confidenceLevel || 'Confidence Level'}</span>
                          <span className="text-2xl font-bold text-cyan-400">{aiPrediction.confidence}%</span>
                        </div>
                        <div className="w-full bg-slate-700/50 rounded-full h-2.5">
                          <div 
                            className="bg-cyan-500 h-2.5 rounded-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" 
                            style={{ width: `${aiPrediction.confidence}%` }}
                          ></div>
                        </div>
                        <AITranslatedText 
                          text={aiPrediction.reasoning} 
                          as="p"
                          className="text-slate-300 text-sm leading-relaxed italic" 
                        />
                      </div>
                      
                      <div className="bg-slate-900/40 rounded-lg p-4 border border-slate-700/30">
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t_i18n.markets.keyFactors || 'Key Factors'}</h3>
                        <ul className="space-y-2">
                          {aiPrediction.keyFactors.map((factor: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                              <ChevronRight className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                              <AITranslatedText text={factor} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-500 uppercase">{t_i18n.markets.aiWinProbability || 'AI Win Probability'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 text-center">
                          <div className="text-lg font-bold text-white">{aiPrediction.predictedHomeWinOdds}%</div>
                          <AITranslatedText text={aiPrediction.homeTeam} as="div" className="text-[10px] text-slate-500 uppercase" />
                        </div>
                        <div className="flex-[3] h-4 bg-slate-700/30 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${aiPrediction.predictedHomeWinOdds}%` }}
                          ></div>
                          <div 
                            className="bg-red-500 h-full" 
                            style={{ width: `${aiPrediction.predictedAwayWinOdds}%` }}
                          ></div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-lg font-bold text-white">{aiPrediction.predictedAwayWinOdds}%</div>
                          <AITranslatedText text={aiPrediction.awayTeam} as="div" className="text-[10px] text-slate-500 uppercase" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-slate-500">
                    <AITranslatedText text="Prediction data currently unavailable." />
                  </div>
                )}
              </div>
            )}

            {/* Tags */}
            {market.tags && market.tags.length > 0 && (
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  {t_i18n.markets.tags || 'Tags'}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {market.tags.map((tag: string) => (
                    <AITranslatedText
                      key={tag}
                      text={tag}
                      className="px-3 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300 border border-slate-600/30"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Redundant col removed */}
        </div>

        {/* Back Button */}
        <div className="mt-10 pt-6 border-t border-slate-800">
          <Link href="/markets">
            <Button
              variant="outline"
              className="bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t_i18n.common.back || 'Back to All Markets'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
