import { useState, useMemo, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import VaultStats from '@/components/VaultStats';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Calendar,
  Target,
  Loader2,
} from 'lucide-react';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';
import { AITranslatedText } from '@/components/AITranslatedText';
import { useNexus } from '@/hooks/useNexus';
import { useAccount } from 'wagmi';
import { formatUnits, parseUnits } from 'viem';
import { toast } from 'sonner';
import { CONTRACT_ADDRESSES } from '@/lib/web3Config';

// Mock 數據 - 實際應該從區塊鏈獲取
const mockVaultDataFallback = {
  id: 1,
  leaderName: 'Nexus Alpha',
  leaderAddress: '0xf39F...2266',
  totalAssets: 0,
  totalShares: 0,
  navPerShare: 1.0,
  highWaterMark: 1.0,
  performanceFee: 0,
  isLocked: false,
  activePositions: 0,
  followers: 0,
  createdAt: '2024-03-28',
  roi: 0,
  winRate: 0,
};

export default function VaultDetails() {
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/vaults/:id');
  const vaultId = params?.id || '1';
  
  // In a real app, we'd fetch the vault address from the factory or a registry based on ID
  // For now, we'll use the factory as the target or a placeholder
  const vaultAddress = CONTRACT_ADDRESSES.COPY_TRADING_VAULT_FACTORY; 

  const { isConnected } = useAccount();
  const { 
    vaultTotalAssets, 
    navPerShare, 
    usdcAllowance, 
    approveUsdc, 
    depositToVault,
    isLoading: isContractLoading,
    error: contractError
  } = useNexus(undefined, vaultAddress);

  const [selectedTab, setSelectedTab] = useState('overview');
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const displayAssets = vaultTotalAssets ? Number(formatUnits(vaultTotalAssets, 6)) : mockVaultDataFallback.totalAssets;
  const displayNav = navPerShare ? Number(formatUnits(navPerShare, 6)) : mockVaultDataFallback.navPerShare;

  const handleDeposit = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    setIsDepositing(true);
    try {
      const amountWei = parseUnits(depositAmount, 6);
      
      // Approval check
      if (!usdcAllowance || usdcAllowance < amountWei) {
        toast.info('Approving USDC...');
        const approved = await approveUsdc(depositAmount);
        if (!approved) throw new Error('Approval failed');
      }

      toast.info('Depositing into vault...');
      const success = await depositToVault(depositAmount);
      if (success) {
        toast.success('Successfully followed trader!');
        setDepositAmount('');
      } else {
        throw new Error('Deposit failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Transaction failed');
    } finally {
      setIsDepositing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      {/* 返回按鈕 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/leaderboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <AITranslatedText text={t.common.back || 'Back to Leaderboard'} />
        </Button>
      </div>

      {/* 金庫統計 */}
      <VaultStats
        totalAssets={displayAssets}
        totalShares={mockVaultDataFallback.totalShares}
        navPerShare={displayNav}
        performanceFee={0}
        highWaterMark={displayNav}
        isLocked={false}
        activePositions={0}
        leaderName={mockVaultDataFallback.leaderName}
      />

      {/* 詳細標籤 */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 rounded-lg p-1">
              <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50">
                <AITranslatedText text={t.portfolio.overview || 'Overview'} />
              </TabsTrigger>
              <TabsTrigger value="positions" className="data-[state=active]:bg-blue-50">
                <AITranslatedText text={t.portfolio.positions || 'Positions'} />
              </TabsTrigger>
              <TabsTrigger value="followers" className="data-[state=active]:bg-blue-50">
                <AITranslatedText text={t.leaderboard.followers || 'Followers'} />
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <Card className="p-6 border-slate-200">
                <AITranslatedText as="h3" className="text-lg font-semibold text-slate-900 mb-4" text="Strategy Description" />
                <p className="text-slate-600 leading-relaxed">
                  <AITranslatedText text="This vault follows a binary options strategy focused on major market events. The leader uses quantitative analysis of sentiment and order flow to identify mispriced outcomes." />
                </p>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <AITranslatedText as="p" className="text-xs text-slate-500 uppercase font-bold mb-1" text="Settlement" />
                    <p className="font-semibold text-slate-900">USDC</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <AITranslatedText as="p" className="text-xs text-slate-500 uppercase font-bold mb-1" text="Performance Fee" />
                    <p className="font-semibold text-slate-900">10%</p>
                  </div>
                </div>
              </Card>
            </TabsContent>
            
            <TabsContent value="positions" className="mt-6 text-center py-12 text-slate-400">
              <AITranslatedText text="No active positions yet. This vault is currently in cash." />
            </TabsContent>
            
            <TabsContent value="followers" className="mt-6 text-center py-12 text-slate-400">
              <AITranslatedText text="Be the first to follow this trader!" />
            </TabsContent>
          </Tabs>
        </div>

        {/* 存款控制台 */}
        <div className="space-y-6">
          <Card className="p-6 border-slate-200 shadow-sm">
            <AITranslatedText as="h3" className="text-lg font-bold text-slate-900 mb-4" text="Follow Strategy" />
            <div className="space-y-4">
              <div>
                <AITranslatedText as="label" className="text-sm font-medium text-slate-600 mb-1.5 block" text="Amount to Deposit (USDC)" />
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="100.00"
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-between text-xs text-slate-500">
                <AITranslatedText text="Estimated Shares" />
                <span>{depositAmount ? (parseFloat(depositAmount) / displayNav).toFixed(2) : '0.00'}</span>
              </div>

              <Button
                onClick={handleDeposit}
                disabled={isDepositing || !depositAmount}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isDepositing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <AITranslatedText text={t.leaderboard.copyTrade || 'Copy This Trader'} />
                )}
              </Button>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg flex gap-3 text-xs text-amber-800">
                <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <AITranslatedText text="Your funds will be managed by the trader. You can withdraw anytime based on the current NAV." />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-slate-200 bg-slate-50/50">
             <div className="flex items-center gap-3 text-sm text-slate-600">
                <Users className="w-4 h-4" />
                <AITranslatedText text="Contract Verified on Base Sepolia" />
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
