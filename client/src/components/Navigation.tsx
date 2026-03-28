import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { TrendingUp, Users, Home, User, BarChart3, Zap, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
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

  const [isOpen, setIsOpen] = useState(false);

  const isActive = (path: string) => location === path;

  // Reusable Nav Links element for Desktop and Mobile
  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => {
    const baseClasses = mobile
      ? 'flex flex-col gap-4 mt-6 text-lg'
      : 'hidden md:flex items-center gap-6';

    const getLinkClass = (path: string) => {
      const activeState = isActive(path) || (path.includes('world cup') && location === '/markets' && window.location.search.includes('world cup'));
      return `flex items-center gap-2 font-medium transition-colors ${
        activeState
          ? mobile
            ? 'text-cyan-400 bg-slate-800 p-2 rounded-lg'
            : 'text-cyan-400'
          : mobile
            ? 'text-slate-300 hover:text-white hover:bg-slate-800 p-2 rounded-lg'
            : 'text-slate-400 hover:text-white'
      }`;
    };

    return (
      <div className={baseClasses}>
        <Link href="/" onClick={() => mobile && setIsOpen(false)} className={getLinkClass('/')}>
          <Home className="w-5 h-5 md:w-4 md:h-4" />
          {t.navigation.home}
        </Link>
        <Link href="/markets" onClick={() => mobile && setIsOpen(false)} className={getLinkClass('/markets')}>
          <TrendingUp className="w-5 h-5 md:w-4 md:h-4" />
          {t.navigation.markets}
        </Link>
        <Link href="/markets?category=world%20cup" onClick={() => mobile && setIsOpen(false)} className={`flex items-center gap-2 font-medium transition-colors text-amber-500 hover:text-amber-400 ${mobile ? 'p-2 rounded-lg bg-amber-500/10' : ''}`}>
          <Zap className="w-5 h-5 md:w-4 md:h-4" />
          {t.markets?.worldCup || 'World Cup'}
        </Link>
        <Link href="/leaderboard" onClick={() => mobile && setIsOpen(false)} className={getLinkClass('/leaderboard')}>
          <Users className="w-5 h-5 md:w-4 md:h-4" />
          {t.navigation.leaderboard}
        </Link>
        <Link href="/portfolio" onClick={() => mobile && setIsOpen(false)} className={getLinkClass('/portfolio')}>
          <BarChart3 className="w-5 h-5 md:w-4 md:h-4" />
          {t.navigation.portfolio}
        </Link>
        <Link href="/profile" onClick={() => mobile && setIsOpen(false)} className={getLinkClass('/profile')}>
          <User className="w-5 h-5 md:w-4 md:h-4" />
          {t.navigation.profile || 'Profile'}
        </Link>
      </div>
    );
  };

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent hover:opacity-80 transition-opacity whitespace-nowrap overflow-hidden text-clip ml-2 lg:ml-0">
            <TrendingUp className="w-6 h-6 text-cyan-400 shrink-0" />
            NEXUS
          </Link>

          {/* Navigation Links - Desktop */}
          <NavLinks />

          {/* Wallet Connection & Language Switcher & Notifications */}
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0 whitespace-nowrap">
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
            
            {/* Hamburger Mobile Toggle */}
            <div className="md:hidden flex items-center pr-1">
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full">
                    <Menu className="w-5 h-5 text-slate-300" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-slate-900 border-l border-slate-700/50 p-6">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <div className="mb-8 mt-4 flex items-center gap-2 text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                    <TrendingUp className="w-6 h-6 text-cyan-400 shrink-0" />
                    NEXUS
                  </div>
                  
                  {/* Reuse Nav component strictly in Mobile layout format */}
                  <NavLinks mobile={true} />
                </SheetContent>
              </Sheet>
            </div>
            
            <div className="scale-75 sm:scale-90 md:scale-100 origin-right transition-transform shrink-0">
              <ConnectButton 
                accountStatus={{
                  smallScreen: 'avatar',
                  largeScreen: 'full',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
