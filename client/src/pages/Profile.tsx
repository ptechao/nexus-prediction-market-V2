import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Settings, Shield, Bell, Globe, LogOut, ChevronRight, Wallet } from 'lucide-react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useLanguageContext } from '@/contexts/LanguageContext';
import messages from '../../../messages';

export default function Profile() {
  const { address, isConnected } = useAccount();
  const { language, setLanguage } = useLanguageContext();
  const t = (messages as Record<string, any>)[language] || messages.en;

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 bg-background">
        <div className="p-6 rounded-full bg-secondary/50 mb-6">
          <User className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">{t.navigation.profile || 'Profile'}</h2>
        <p className="text-muted-foreground mb-8 text-center max-w-md">
          {t.errors.walletNotConnected || 'Connect your wallet to manage your profile and settings.'}
        </p>
        <ConnectButton />
      </div>
    );
  }

  const settingsItems = [
    { icon: <Settings className="w-5 h-5" />, label: t.common.settings || 'Settings', desc: 'Account preferences' },
    { icon: <Shield className="w-5 h-5" />, label: 'Security', desc: 'Manage your security' },
    { icon: <Bell className="w-5 h-5" />, label: t.common.notifications || 'Notifications', desc: 'Alert preferences' },
    { icon: <Globe className="w-5 h-5" />, label: t.common.language || 'Language', desc: `Current: ${language.toUpperCase()}` },
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
            <p className="font-mono text-sm text-muted-foreground">{address ? truncateAddress(address) : 'No address'}</p>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-primary hover:bg-primary/5">
              Copy
            </Button>
          </div>
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
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Network</p>
                  <p className="text-sm font-bold text-foreground">Polygon PoS</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    <p className="text-sm font-bold text-green-600 dark:text-green-500">Connected</p>
                  </div>
                </div>
              </div>
            </Card>

            <Button
              variant="outline"
              className="w-full bg-red-50 hover:bg-red-100 text-red-600 border-red-200 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 dark:border-red-500/20 transition-colors py-6 shadow-none font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
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
                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
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

