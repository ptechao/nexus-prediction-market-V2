import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Settings, Shield, Bell, Globe, LogOut, ChevronRight, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';
import { useNexus } from '@/hooks/useNexus';
import { formatUnits } from 'viem';
import { Sparkles, Share2, Copy, Check, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { AITranslatedText } from '@/components/AITranslatedText';

export default function Profile() {
  const { address, isConnected } = useAccount();
  const { referrerEarnings } = useNexus();
  const { language, setLanguage } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;
  
  const [isCopied, setIsCopied] = useState(false);
  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}?ref=${address || ''}` : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-background">
        <div className="p-6 rounded-full bg-secondary/50 mb-6">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <AITranslatedText as="h2" className="text-2xl font-bold text-foreground mb-2" text={t.navigation.profile || 'Profile'} />
        <AITranslatedText as="p" className="text-muted-foreground mb-8 text-center max-w-md" text={t.errors.walletNotConnected || 'Connect your wallet to manage your profile and settings.'} />
        <ConnectButton />
      </div>
    );
  }

  const settingsItems = [
    { icon: <Settings className="w-5 h-5" />, label: t.common.settings || 'Settings', desc: 'Account preferences' },
    { icon: <Shield className="w-5 h-5" />, label: 'Security', desc: 'Manage your security' },
    { icon: <Bell className="w-5 h-5" />, label: t.common.notifications || 'Notifications', desc: 'Alert preferences' },
    { icon: <Globe className="w-5 h-5" />, label: t.common.language || 'Language', desc: <span><AITranslatedText text="Current" />: {language.toUpperCase()}</span> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-secondary border border-border mb-6 shadow-sm">
            <User className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t.navigation.profile}</h1>
          <div className="flex items-center justify-center gap-2">
            <p className="font-mono text-sm text-muted-foreground">{address ? truncateAddress(address) : <AITranslatedText text="No address" />}</p>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary hover:bg-primary/5">
              <AITranslatedText text="Copy" />
            </Button>
          </div>
        </div>

        {/* KOL Dashboard / Referral Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="p-8 bg-gradient-to-br from-indigo-900/40 via-slate-900/60 to-purple-900/40 border-indigo-500/30 relative overflow-hidden group shadow-xl">
             <div className="absolute -right-8 -bottom-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Sparkles className="w-48 h-48 text-indigo-400 rotate-12" />
             </div>
             
             <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                   <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                      <TrendingUp className="w-6 h-6 text-indigo-400" />
                   </div>
                   <div>
                      <AITranslatedText as="h2" className="text-xl font-bold text-white tracking-tight" text="KOL Dashboard" />
                      <AITranslatedText as="p" className="text-xs text-slate-500 uppercase tracking-widest mt-0.5" text="Referral Program" />
                   </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1 font-bold"><AITranslatedText text="50% FEE SPLIT" /></Badge>
             </div>

             <div className="space-y-6">
                <div>
                   <AITranslatedText as="p" className="text-sm text-slate-400 mb-2" text="Total Referral Earnings" />
                   <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-white">$</span>
                      <span className="text-5xl font-black bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                         {referrerEarnings ? Number(formatUnits(referrerEarnings, 6)).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
                      </span>
                      <span className="text-sm font-bold text-slate-500 ml-1">USDC</span>
                   </div>
                </div>
                
                <div className="pt-4 border-t border-slate-800/50">
                   <AITranslatedText as="p" className="text-xs text-slate-500 mb-3 font-bold uppercase tracking-tight" text="Your Promotion System" />
                   <div className="flex gap-2">
                      <div className="flex-1 bg-slate-950/80 rounded-xl px-4 py-3 border border-slate-800 text-xs text-slate-400 font-mono truncate flex items-center shadow-inner">
                         {referralLink}
                      </div>
                      <Button 
                        size="icon" 
                        variant="secondary"
                        onClick={handleCopyLink}
                        className="rounded-xl h-11 w-11 bg-white hover:bg-slate-200 text-slate-950 shadow-lg shadow-white/5 transition-all"
                      >
                         {isCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </Button>
                   </div>
                   <AITranslatedText as="p" className="text-[10px] text-slate-500 mt-3 italic text-center" text="*Earnings are instantly distributed to your wallet upon user transactions." />
                </div>
             </div>
          </Card>

          <Card className="p-8 bg-slate-900 border-slate-800 shadow-xl flex flex-col justify-center text-center">
             <div className="p-4 rounded-full bg-slate-800 w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Share2 className="w-8 h-8 text-slate-400" />
             </div>
             <AITranslatedText as="h3" className="text-lg font-bold text-white mb-2" text="Ready to Promote?" />
             <AITranslatedText as="p" className="text-sm text-slate-500 mb-8 max-w-sm mx-auto" text="Share any market with your audience. You will earn 50% of our platform fee from every trade they make, for life." />
             <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                   <p className="text-2xl font-bold text-white">10%</p>
                   <AITranslatedText as="p" className="text-[10px] text-slate-500 uppercase tracking-tighter" text="Avg conversion" />
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                   <AITranslatedText as="p" className="text-2xl font-bold text-white" text="Instant" />
                   <AITranslatedText as="p" className="text-[10px] text-slate-500 uppercase tracking-tighter" text="Payout freq" />
                </div>
             </div>
          </Card>
        </div>

        {/* Profile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left: Account Summary */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-card border-border p-6 shadow-sm">
              <h3 className="text-xs font-bold text-muted-foreground mb-4 flex items-center gap-2 uppercase tracking-wider">
                <Wallet className="w-4 h-4" />
                {t.portfolio.wallet || 'Wallet'}
              </h3>
              <div className="space-y-4">
                <div>
                  <AITranslatedText as="p" className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1" text="Network" />
                  <p className="text-sm font-bold text-foreground">Polygon PoS</p>
                </div>
                <div>
                  <AITranslatedText as="p" className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1" text="Status" />
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    <AITranslatedText as="p" className="text-sm font-bold text-green-600 dark:text-green-500" text="Connected" />
                  </div>
                </div>
              </div>
            </Card>

            <Button
              variant="outline"
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/20 transition-colors py-6 shadow-none font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              <AITranslatedText text="Disconnect" />
            </Button>
          </div>

          {/* Right: Settings List */}
          <div className="md:col-span-2">
            <Card className="bg-card border-border divide-y divide-border overflow-hidden shadow-sm">
              {settingsItems.map((item, index) => (
                <button
                  key={index}
                  className="w-full flex items-center justify-between p-6 hover:bg-secondary/50 transition-colors group text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-secondary rounded-lg text-muted-foreground group-hover:text-primary transition-colors">
                      {item.icon}
                    </div>
                    <div>
                      <AITranslatedText as="p" className="text-sm font-bold text-foreground" text={item.label} />
                      <AITranslatedText as="p" className="text-xs text-muted-foreground mt-0.5" text={item.desc} />
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-all translate-x-0 group-hover:translate-x-1" />
                </button>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

