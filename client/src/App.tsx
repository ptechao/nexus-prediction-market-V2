/**
 * 主應用組件
 * 
 * 應用的根組件，包含路由、導航和全局狀態管理。
 */

import { useEffect, useState } from 'react';
import { Router, Route } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useTranslation } from '@/hooks/useTranslation';

// 頁面組件
import Home from '@/pages/Home';
import Markets from '@/pages/Markets';
import MarketDetail from '@/pages/MarketDetail';
import Leaderboard from '@/pages/Leaderboard';
import DeploymentDashboard from '@/pages/DeploymentDashboard';

// 佈局組件
import DashboardLayout from '@/components/DashboardLayout';
import LanguageSwitcher from '@/components/LanguageSwitcher';

/**
 * 主應用組件
 */
export default function App() {
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const { t } = useTranslation();
  const [isReady, setIsReady] = useState(false);

  // 等待認證完成
  useEffect(() => {
    if (!authLoading) {
      setIsReady(true);
    }
  }, [authLoading]);

  // 加載中
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="mt-4 text-muted-foreground">{t('common.loading') || 'Loading...'}</p>
        </div>
      </div>
    );
  }

  // 未認證 - 顯示登錄頁面
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        {/* 導航欄 */}
        <nav className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">NEXUS</h1>
            <LanguageSwitcher />
          </div>
        </nav>

        {/* 主內容 */}
        <Router>
          <Route path="/" component={Home} />
          <Route path="/markets" component={Markets} />
          <Route path="/market/:id" component={MarketDetail} />
          <Route path="/leaderboard" component={Leaderboard} />
        </Router>
      </div>
    );
  }

  // 已認證 - 顯示儀表板
  if (user.role === 'admin') {
    return (
      <Router>
        <DashboardLayout>
          <Route path="/" component={Home} />
          <Route path="/markets" component={Markets} />
          <Route path="/market/:id" component={MarketDetail} />
          <Route path="/leaderboard" component={Leaderboard} />
          <Route path="/deployments" component={DeploymentDashboard} />
        </DashboardLayout>
      </Router>
    );
  }

  // 普通用戶
  return (
    <div className="min-h-screen bg-background">
      {/* 導航欄 */}
      <nav className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-primary">NEXUS</h1>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        </div>
      </nav>

      {/* 主內容 */}
      <Router>
        <Route path="/" component={Home} />
        <Route path="/markets" component={Markets} />
        <Route path="/market/:id" component={MarketDetail} />
        <Route path="/leaderboard" component={Leaderboard} />
      </Router>
    </div>
  );
}
