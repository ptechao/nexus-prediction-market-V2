'use client';

import { useState, useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Copy } from 'lucide-react';
import { useNexus } from '@/hooks/useNexus';
import { toast } from 'sonner';

// Mock vault data
const MOCK_VAULTS = [
  {
    id: '1',
    name: 'Alex Chen',
    address: '0x1234567890123456789012345678901234567890',
    totalAssets: 125000,
    roi7d: 12.5,
    winRate: 0.72,
    followers: 234,
    performanceFee: 2500,
    navPerShare: 12.5,
  },
  {
    id: '2',
    name: 'Sarah Martinez',
    address: '0x0987654321098765432109876543210987654321',
    totalAssets: 89500,
    roi7d: 8.3,
    winRate: 0.68,
    followers: 156,
    performanceFee: 1790,
    navPerShare: 11.8,
  },
  {
    id: '3',
    name: 'James Wilson',
    address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    totalAssets: 67200,
    roi7d: -2.1,
    winRate: 0.55,
    followers: 89,
    performanceFee: 0,
    navPerShare: 10.2,
  },
  {
    id: '4',
    name: 'Emma Taylor',
    address: '0x1111111111111111111111111111111111111111',
    totalAssets: 234000,
    roi7d: 18.7,
    winRate: 0.81,
    followers: 512,
    performanceFee: 4680,
    navPerShare: 14.2,
  },
  {
    id: '5',
    name: 'Michael Zhang',
    address: '0x2222222222222222222222222222222222222222',
    totalAssets: 45800,
    roi7d: 5.2,
    winRate: 0.62,
    followers: 67,
    performanceFee: 916,
    navPerShare: 9.8,
  },
];

interface CopyTradeModalProps {
  vault: (typeof MOCK_VAULTS)[0];
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Copy Trading Modal Component
 * Allows users to deposit USDC into a vault
 */
function CopyTradeModal({ vault, isOpen, onClose }: CopyTradeModalProps) {
  const { isConnected } = useAccount();
  const { depositToVault, approveUsdc, isLoading, error, usdcBalance } = useNexus(undefined, vault.address);
  const [depositAmount, setDepositAmount] = useState('');
  const [step, setStep] = useState<'amount' | 'approve' | 'confirm'>('amount');

  const quickAmounts = [100, 500, 1000, 5000];
  const estimatedShares = depositAmount ? (parseFloat(depositAmount) / vault.navPerShare).toFixed(2) : '0';

  const handleQuickAmount = (amount: number) => {
    setDepositAmount(amount.toString());
  };

  const handleApprove = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!isConnected) {
      toast.error('Please connect your wallet');
      return;
    }

    try {
      const success = await approveUsdc(depositAmount);
      if (success) {
        setStep('confirm');
        toast.success('USDC approved successfully');
      } else {
        toast.error(error || 'Approval failed');
      }
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const handleDeposit = async () => {
    try {
      const success = await depositToVault(depositAmount);
      if (success) {
        toast.success(`Successfully deposited ${depositAmount} USDC into ${vault.name}'s vault`);
        setDepositAmount('');
        setStep('amount');
        onClose();
      } else {
        toast.error(error || 'Deposit failed');
      }
    } catch (err) {
      toast.error('Deposit failed');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Copy Trade with {vault.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vault Info */}
          <div className="rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">Vault Stats</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Total Assets</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${(vault.totalAssets / 1000).toFixed(1)}K
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">7D ROI</p>
                <p className={`text-lg font-semibold ${vault.roi7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {vault.roi7d >= 0 ? '+' : ''}{vault.roi7d}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Win Rate</p>
                <p className="text-lg font-semibold text-gray-900">{(vault.winRate * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">NAV/Share</p>
                <p className="text-lg font-semibold text-gray-900">${vault.navPerShare.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Amount Input */}
          {step === 'amount' && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Deposit Amount (USDC)</label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="mt-2"
                  disabled={isLoading}
                />
                {usdcBalance && (
                  <p className="mt-2 text-xs text-gray-500">
                    Balance: {(Number(usdcBalance) / 1e6).toFixed(2)} USDC
                  </p>
                )}
              </div>

              {/* Quick Amount Buttons */}
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">Quick amounts:</p>
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickAmount(amount)}
                      className="text-xs"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Estimated Shares */}
              {depositAmount && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Estimated Shares</span>
                    <span className="font-semibold text-gray-900">{estimatedShares}</span>
                  </div>
                </div>
              )}

              <Button
                onClick={handleApprove}
                disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isLoading || !isConnected}
                className="w-full"
              >
                {isLoading ? 'Processing...' : 'Next: Approve USDC'}
              </Button>
            </div>
          )}

          {/* Confirmation Step */}
          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Copy className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="font-medium text-green-900">Ready to deposit</span>
                </div>
                <div className="space-y-2 text-sm text-green-800">
                  <p>• USDC approved for vault</p>
                  <p>• You will receive {estimatedShares} shares</p>
                  <p>• 20% performance fee applies to profits</p>
                </div>
              </div>

              <Button onClick={handleDeposit} disabled={isLoading} className="w-full">
                {isLoading ? 'Depositing...' : 'Confirm Deposit'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setStep('amount')}
                disabled={isLoading}
                className="w-full"
              >
                Back
              </Button>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Leaderboard Page Component
 * Displays a list of top vaults with copy trading functionality
 */
export default function LeaderboardPage() {
  const [selectedVault, setSelectedVault] = useState<(typeof MOCK_VAULTS)[0] | null>(null);
  const [sortBy, setSortBy] = useState<'roi' | 'tvl' | 'winRate'>('roi');
  const { isConnected } = useAccount();

  // Sort vaults based on selected criteria
  const sortedVaults = useMemo(() => {
    const sorted = [...MOCK_VAULTS];
    switch (sortBy) {
      case 'roi':
        return sorted.sort((a, b) => b.roi7d - a.roi7d);
      case 'tvl':
        return sorted.sort((a, b) => b.totalAssets - a.totalAssets);
      case 'winRate':
        return sorted.sort((a, b) => b.winRate - a.winRate);
      default:
        return sorted;
    }
  }, [sortBy]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Top Traders</h1>
          <p className="text-lg text-gray-600">Copy the strategies of successful traders and earn passive income</p>
        </div>

        {/* Wallet Connection Alert */}
        {!isConnected && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              💡 Connect your wallet to copy trade with any of these vaults
            </p>
          </Card>
        )}

        {/* Sort Controls */}
        <div className="mb-6 flex gap-2 flex-wrap">
          <Button
            variant={sortBy === 'roi' ? 'default' : 'outline'}
            onClick={() => setSortBy('roi')}
            size="sm"
          >
            Sort by ROI
          </Button>
          <Button
            variant={sortBy === 'tvl' ? 'default' : 'outline'}
            onClick={() => setSortBy('tvl')}
            size="sm"
          >
            Sort by TVL
          </Button>
          <Button
            variant={sortBy === 'winRate' ? 'default' : 'outline'}
            onClick={() => setSortBy('winRate')}
            size="sm"
          >
            Sort by Win Rate
          </Button>
        </div>

        {/* Leaderboard Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Leader
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Total Assets
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    7D ROI
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Followers
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sortedVaults.map((vault, index) => (
                  <tr key={vault.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 text-white font-bold text-sm">
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="font-semibold text-gray-900">{vault.name}</p>
                        <p className="text-xs text-gray-500">{vault.address.slice(0, 6)}...{vault.address.slice(-4)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-semibold text-gray-900">${(vault.totalAssets / 1000).toFixed(1)}K</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {vault.roi7d >= 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-600" />
                        )}
                        <span className={vault.roi7d >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {vault.roi7d >= 0 ? '+' : ''}{vault.roi7d}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-indigo-600"
                            style={{ width: `${vault.winRate * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{(vault.winRate * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-semibold text-gray-900">{vault.followers}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        onClick={() => setSelectedVault(vault)}
                        disabled={!isConnected}
                        className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        Copy Trade
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Copy Trade Modal */}
        {selectedVault && (
          <CopyTradeModal
            vault={selectedVault}
            isOpen={!!selectedVault}
            onClose={() => setSelectedVault(null)}
          />
        )}
      </div>
    </div>
  );
}
