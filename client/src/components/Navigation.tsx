import { Link, useLocation } from 'wouter';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TrendingUp, Users, Home, User, BarChart3 } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NotificationCenter } from './NotificationCenter';
import { useLanguageContext } from '@/contexts/LanguageContext';
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';
import messages from '../../../messages';

export function Navigation() {
  const [location] = useLocation();
  const { language } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;

  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity">
            <TrendingUp className="w-6 h-6 text-cyan-400" />
            NEXUS
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className={`flex items-center gap-2 font-medium transition-colors ${
              isActive('/') 
                ? 'text-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}>
              <Home className="w-4 h-4" />
              {t.navigation.home}
            </Link>
            <Link href="/markets" className={`flex items-center gap-2 font-medium transition-colors ${
              isActive('/markets') 
                ? 'text-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}>
              <TrendingUp className="w-4 h-4" />
              {t.navigation.markets}
            </Link>
            <Link href="/leaderboard" className={`flex items-center gap-2 font-medium transition-colors ${
              isActive('/leaderboard') 
                ? 'text-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}>
              <Users className="w-4 h-4" />
              {t.navigation.leaderboard}
            </Link>
            <Link href="/portfolio" className={`flex items-center gap-2 font-medium transition-colors ${
              isActive('/portfolio') 
                ? 'text-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}>
              <BarChart3 className="w-4 h-4" />
              {t.navigation.portfolio}
            </Link>
            <Link href="/profile" className={`flex items-center gap-2 font-medium transition-colors ${
              isActive('/profile') 
                ? 'text-cyan-400' 
                : 'text-slate-400 hover:text-white'
            }`}>
              <User className="w-4 h-4" />
              {t.navigation.profile || 'Profile'}
            </Link>
          </div>

          {/* Wallet Connection & Language Switcher & Notifications */}
          <div className="flex items-center gap-3">
            {isConnected && balance && (
              <div className="hidden lg:flex flex-col items-end px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t.common.balance || 'Balance'}</span>
                <span className="text-xs font-mono text-cyan-400">
                  {Number(balance.formatted).toFixed(4)} {balance.symbol}
                </span>
              </div>
            )}
            <NotificationCenter />
            <LanguageSwitcher />
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
