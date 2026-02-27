import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, TrendingUp, Users, Target, Zap, CheckCircle, Eye } from 'lucide-react';
import CopyTradingModal from '@/components/CopyTradingModal';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

interface Leader {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  roi: number;
  winRate: number;
  totalTrades: number;
  followers: number;
  vaultSize: number;
  description: string;
  badges: string[];
  navPerShare?: number;
  totalAssets?: number;
  performanceFee?: number;
}

export default function Leaderboard() {
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'roi' | 'winRate' | 'followers'>('roi');
  const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [followingLeaders, setFollowingLeaders] = useState<Set<number>>(new Set());

  useEffect(() => {
    // Load mock data
    const loadLeaders = async () => {
      try {
        const response = await fetch('/mockData.json');
        const data = await response.json();
        // Add vault stats to leaders
        const leadersWithVault = data.leaders.map((leader: Leader) => ({
          ...leader,
          navPerShare: 12.5 + Math.random() * 2,
          totalAssets: leader.vaultSize * (0.8 + Math.random() * 0.4),
          performanceFee: leader.vaultSize * 0.02 * Math.random(),
        }));
        setLeaders(leadersWithVault);
        // Load following status from localStorage
        const saved = localStorage.getItem('followingLeaders');
        if (saved) {
          setFollowingLeaders(new Set(JSON.parse(saved)));
        }
      } catch (error) {
        console.error('Failed to load leaders:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLeaders();
  }, []);

  const sortedLeaders = [...leaders].sort((a, b) => {
    switch (sortBy) {
      case 'roi':
        return b.roi - a.roi;
      case 'winRate':
        return b.winRate - a.winRate;
      case 'followers':
        return b.followers - a.followers;
      default:
        return 0;
    }
  });

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getBadgeColor = (badge: string) => {
    const colors: Record<string, string> = {
      'verified': 'bg-blue-100 text-blue-800',
      'top_trader': 'bg-yellow-100 text-yellow-800',
      'elite': 'bg-purple-100 text-purple-800',
    };
    return colors[badge] || 'bg-gray-100 text-gray-800';
  };

  const getBadgeLabel = (badge: string) => {
    const labels: Record<string, string> = {
      'verified': '✓ Verified',
      'top_trader': '⭐ Top Trader',
      'elite': '👑 Elite',
    };
    return labels[badge] || badge;
  };

  const handleCopyTrading = (leader: Leader) => {
    setSelectedLeader(leader);
    setModalOpen(true);
  };

  const handleConfirmCopyTrading = async (amount: number) => {
    if (!selectedLeader) return;

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update following status
      const newFollowing = new Set(followingLeaders);
      newFollowing.add(selectedLeader.id);
      setFollowingLeaders(newFollowing);
      localStorage.setItem('followingLeaders', JSON.stringify(Array.from(newFollowing)));

      // Show success toast
      toast.success(`Now following ${selectedLeader.name}!`, {
        description: `Deposited $${amount.toLocaleString()} into their vault`,
        duration: 4000,
      });
    } catch (error) {
      toast.error('Failed to complete copy trading', {
        description: error instanceof Error ? error.message : 'Please try again',
      });
      throw error;
    }
  };

  const isFollowing = (leaderId: number) => followingLeaders.has(leaderId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-4xl font-bold text-slate-900">
              {t('leaderboard.title')}
            </h1>
          </div>
          <p className="text-lg text-slate-600">
            {t('leaderboard.subtitle')}
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Button
            variant={sortBy === 'roi' ? 'default' : 'outline'}
            onClick={() => setSortBy('roi')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" />
            {t('leaderboard.bestRoi')}
          </Button>
          <Button
            variant={sortBy === 'winRate' ? 'default' : 'outline'}
            onClick={() => setSortBy('winRate')}
            className="flex items-center gap-2"
          >
            <Target className="w-4 h-4" />
            {t('leaderboard.winRate')}
          </Button>
          <Button
            variant={sortBy === 'followers' ? 'default' : 'outline'}
            onClick={() => setSortBy('followers')}
            className="flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            {t('leaderboard.mostFollowed')}
          </Button>
        </div>

        {/* Leaders Table */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedLeaders.map((leader, index) => (
              <Card
                key={leader.id}
                className={`overflow-hidden transition-all duration-300 cursor-pointer ${
                  isFollowing(leader.id)
                    ? 'hover:shadow-xl border-2 border-green-200 hover:border-green-400 bg-gradient-to-r from-green-50 to-transparent'
                    : 'hover:shadow-lg'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-center gap-6">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg">
                        {index + 1}
                      </div>
                    </div>

                    {/* Leader Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="relative">
                          <img
                            src={leader.avatar}
                            alt={leader.name}
                            className={`w-12 h-12 rounded-full object-cover transition-all duration-300 ${
                              isFollowing(leader.id) ? 'ring-2 ring-green-500' : ''
                            }`}
                          />
                          {isFollowing(leader.id) && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {leader.name}
                            </h3>
                            <span className="text-sm text-slate-500">
                              {leader.handle}
                            </span>
                            {isFollowing(leader.id) && (
                              <Badge className="bg-green-100 text-green-800 ml-auto md:ml-0">
                                ✓ Following
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {leader.description}
                          </p>
                        </div>
                      </div>

                      {/* Badges */}
                      <div className="flex gap-2 mb-3 flex-wrap">
                        {leader.badges.map((badge) => (
                          <Badge
                            key={badge}
                            className={getBadgeColor(badge)}
                          >
                            {getBadgeLabel(badge)}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 flex-shrink-0 md:gap-6">
                      <div className="text-center">
                        <div className="text-xs text-slate-600 mb-1">ROI</div>
                        <div className="text-2xl font-bold text-green-600">
                          +{leader.roi.toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-600 mb-1">Win Rate</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {(leader.winRate * 100).toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-600 mb-1">Trades</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {leader.totalTrades}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-slate-600 mb-1">Followers</div>
                        <div className="text-2xl font-bold text-slate-900">
                          {formatNumber(leader.followers)}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex-shrink-0 flex gap-2">
                      <Button
                        onClick={() => setLocation(`/vault/${leader.id}`)}
                        variant="outline"
                        className="flex items-center gap-2"
                        title="View vault details"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="hidden sm:inline">View</span>
                      </Button>
                      <Button
                        onClick={() => handleCopyTrading(leader)}
                        className={`font-semibold transition-all duration-300 flex items-center gap-2 ${
                          isFollowing(leader.id)
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                            : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                        }`}
                      >
                        {isFollowing(leader.id) ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span>{t('leaderboard.following')}</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4" />
                            <span>{t('leaderboard.copyTrade')}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Vault Info */}
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-600">{t('leaderboard.vaultSize')}</span>
                        <p className="font-semibold text-slate-900">
                          ${(leader.vaultSize / 1000000).toFixed(1)}M
                        </p>
                      </div>
                      {leader.totalAssets && (
                        <div>
                          <span className="text-slate-600">{t('leaderboard.totalAssets')}</span>
                          <p className="font-semibold text-slate-900">
                            ${(leader.totalAssets / 1000).toFixed(0)}K
                          </p>
                        </div>
                      )}
                      {leader.navPerShare && (
                        <div>
                          <span className="text-slate-600">{t('leaderboard.navPerShare')}</span>
                          <p className="font-semibold text-blue-600">
                            ${leader.navPerShare.toFixed(4)}
                          </p>
                        </div>
                      )}
                      {leader.performanceFee && (
                        <div>
                          <span className="text-slate-600">{t('leaderboard.performanceFee')}</span>
                          <p className="font-semibold text-orange-600">
                            ${leader.performanceFee.toFixed(0)}
                          </p>
                        </div>
                      )}
                    </div>
                    {isFollowing(leader.id) && (
                      <p className="mt-2 text-green-600 text-sm">
                        ✓ {t('leaderboard.youAreFollowing')}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && sortedLeaders.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg text-slate-600">
              {t('leaderboard.noTradersFound')}
            </p>
          </div>
        )}
      </div>

      {/* Copy Trading Modal */}
      <CopyTradingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        leader={selectedLeader}
        onConfirm={handleConfirmCopyTrading}
      />
    </div>
  );
}
