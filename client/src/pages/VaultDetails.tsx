import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
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
} from 'lucide-react';

// Mock 數據 - 實際應該從區塊鏈獲取
const mockVaultData = {
  id: 1,
  leaderName: 'John Trader',
  leaderAddress: '0x1234...5678',
  totalAssets: 125000,
  totalShares: 10000,
  navPerShare: 12.5,
  highWaterMark: 12.5,
  performanceFee: 2500,
  isLocked: false,
  activePositions: 0,
  followers: 156,
  createdAt: '2024-01-15',
  roi: 25.5,
  winRate: 68,
};

const mockPositions = [
  {
    id: 1,
    market: 'Lakers vs Warriors',
    bet: 'YES',
    amount: 5000,
    winnings: 7500,
    profit: 2500,
    performanceFee: 500,
    status: 'Closed',
    date: '2024-02-10',
  },
  {
    id: 2,
    market: 'Bitcoin $100k',
    bet: 'YES',
    amount: 8000,
    winnings: 0,
    profit: -8000,
    performanceFee: 0,
    status: 'Closed',
    date: '2024-02-08',
  },
  {
    id: 3,
    market: 'S&P 500 Up',
    bet: 'NO',
    amount: 3000,
    winnings: 4500,
    profit: 1500,
    performanceFee: 300,
    status: 'Closed',
    date: '2024-02-05',
  },
];

const mockFollowers = [
  { address: '0xabcd...1234', shares: 1500, deposit: 12000 },
  { address: '0xefgh...5678', shares: 2000, deposit: 16000 },
  { address: '0xijkl...9012', shares: 1200, deposit: 9600 },
  { address: '0xmnop...3456', shares: 800, deposit: 6400 },
  { address: '0xqrst...7890', shares: 1000, deposit: 8000 },
];

export default function VaultDetails() {
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState('overview');

  // 計算統計數據
  const stats = useMemo(() => {
    const totalProfit = mockPositions.reduce((sum, pos) => sum + pos.profit, 0);
    const totalFees = mockPositions.reduce((sum, pos) => sum + pos.performanceFee, 0);
    const closedPositions = mockPositions.filter((p) => p.status === 'Closed').length;
    const winningPositions = mockPositions.filter((p) => p.profit > 0).length;

    return {
      totalProfit,
      totalFees,
      closedPositions,
      winningPositions,
      winRate: closedPositions > 0 ? (winningPositions / closedPositions) * 100 : 0,
    };
  }, []);

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
          Back to Leaderboard
        </Button>
      </div>

      {/* 金庫統計 */}
      <VaultStats
        totalAssets={mockVaultData.totalAssets}
        totalShares={mockVaultData.totalShares}
        navPerShare={mockVaultData.navPerShare}
        performanceFee={mockVaultData.performanceFee}
        highWaterMark={mockVaultData.highWaterMark}
        isLocked={mockVaultData.isLocked}
        activePositions={mockVaultData.activePositions}
        leaderName={mockVaultData.leaderName}
      />

      {/* 詳細標籤 */}
      <div className="mt-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white border border-slate-200 rounded-lg p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50">
              Overview
            </TabsTrigger>
            <TabsTrigger value="positions" className="data-[state=active]:bg-blue-50">
              Positions
            </TabsTrigger>
            <TabsTrigger value="followers" className="data-[state=active]:bg-blue-50">
              Followers
            </TabsTrigger>
          </TabsList>

          {/* 概覽標籤 */}
          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* ROI */}
              <Card className="p-4 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-600">ROI</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {mockVaultData.roi.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Total return on investment
                </p>
              </Card>

              {/* 勝率 */}
              <Card className="p-4 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-600">Win Rate</span>
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {stats.winRate.toFixed(1)}%
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.winningPositions} of {stats.closedPositions} positions
                </p>
              </Card>

              {/* 總利潤 */}
              <Card className="p-4 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-600">Total Profit</span>
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                </div>
                <div className={`text-3xl font-bold ${
                  stats.totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}>
                  ${Math.abs(stats.totalProfit).toLocaleString()}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {stats.totalProfit >= 0 ? '+' : '-'} Across all positions
                </p>
              </Card>

              {/* 追隨者 */}
              <Card className="p-4 border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-600">Followers</span>
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-purple-600">
                  {mockVaultData.followers}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Active copy traders
                </p>
              </Card>
            </div>

            {/* Leader 信息 */}
            <Card className="p-6 border-slate-200">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Leader Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Leader Name</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {mockVaultData.leaderName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Address</p>
                  <p className="text-lg font-mono text-slate-900">
                    {mockVaultData.leaderAddress}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Vault Created</p>
                  <p className="text-lg font-semibold text-slate-900">
                    {mockVaultData.createdAt}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Performance Fee</p>
                  <p className="text-lg font-semibold text-slate-900">
                    20% of profits
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* 位置標籤 */}
          <TabsContent value="positions" className="mt-6">
            <Card className="border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        Market
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        Bet
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Winnings
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Profit
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Fee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockPositions.map((position) => (
                      <tr
                        key={position.id}
                        className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {position.market}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <Badge
                            className={`${
                              position.bet === 'YES'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {position.bet}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">
                          ${position.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">
                          ${position.winnings.toLocaleString()}
                        </td>
                        <td className={`px-6 py-4 text-sm text-right font-semibold ${
                          position.profit >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {position.profit >= 0 ? '+' : ''}${position.profit.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-medium text-orange-600">
                          ${position.performanceFee.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {position.date}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>

          {/* 追隨者標籤 */}
          <TabsContent value="followers" className="mt-6">
            <Card className="border-slate-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">
                        Follower Address
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Shares
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Deposit Value
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase">
                        Current Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockFollowers.map((follower, idx) => {
                      const currentValueNum = follower.shares * mockVaultData.navPerShare;
                      const currentValue = currentValueNum.toFixed(2);
                      const gainNum = currentValueNum - follower.deposit;
                      const gain = gainNum.toFixed(2);
                      const gainPercent = ((gainNum / follower.deposit) * 100).toFixed(1);

                      return (
                        <tr
                          key={idx}
                          className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-mono text-slate-900">
                            {follower.address}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">
                            {follower.shares.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-medium text-slate-900">
                            ${follower.deposit.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-right">
                            <div className="font-medium text-slate-900">
                              ${Number(currentValue).toLocaleString()}
                            </div>
                            <div className={`text-xs ${
                              Number(gain) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {Number(gain) >= 0 ? '+' : ''}{gain} ({gainPercent}%)
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* 行動按鈕 */}
      <div className="mt-8 flex gap-4">
        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
          Copy This Trader
        </Button>
        <Button variant="outline" className="flex-1">
          View on Blockchain
        </Button>
      </div>
    </div>
  );
}
