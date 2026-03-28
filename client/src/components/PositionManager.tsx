import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Wallet, ArrowRightLeft, Sparkles } from 'lucide-react';
import { formatUnits } from 'viem';
import { useNexus } from '@/hooks/useNexus';
import { toast } from 'sonner';
import { AITranslatedText } from '@/components/AITranslatedText';

interface PositionManagerProps {
  marketAddress: string;
}

export const PositionManager: React.FC<PositionManagerProps> = ({ marketAddress }) => {
  const { 
    yesBalance, 
    noBalance, 
    yesPrice, 
    noPrice, 
    sellYes, 
    sellNo, 
    isLoading 
  } = useNexus(marketAddress);

  const hasPositions = (yesBalance && yesBalance > 0n) || (noBalance && noBalance > 0n);

  if (!hasPositions) return null;

  const handleSell = async (isYes: boolean, amount: bigint) => {
    try {
      const shares = formatUnits(amount, 6);
      const success = isYes ? await sellYes(shares) : await sellNo(shares);
      if (success) {
        toast.success(<AITranslatedText text={`Successfully sold ${isYes ? 'YES' : 'NO'} shares!`} />);
      }
    } catch (err) {
      toast.error(<AITranslatedText text="Failed to sell position" />);
    }
  };

  const renderPosition = (isYes: boolean, balance: bigint, price: bigint) => {
    const value = (balance * price) / 1000000n;
    const priceNum = Number(formatUnits(price, 6));

    return (
      <div className="flex flex-col p-4 rounded-xl bg-slate-900/40 border border-slate-700/50 backdrop-blur-sm group hover:border-slate-500/50 transition-all duration-300">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isYes ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {isYes ? 
                <TrendingUp className="w-5 h-5 text-green-400" /> : 
                <TrendingDown className="w-5 h-5 text-red-400" />
              }
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400 capitalize">
                <AITranslatedText text={isYes ? 'YES Position' : 'NO Position'} />
              </p>
              <h4 className="text-xl font-bold text-white">
                {Number(formatUnits(balance, 6)).toLocaleString()} <span className="text-xs text-slate-500 font-normal"><AITranslatedText text="Shares" /></span>
              </h4>
            </div>
          </div>
          <Badge variant="outline" className={`${isYes ? 'text-green-400 border-green-400/30' : 'text-red-400 border-red-400/30'} bg-transparent`}>
            ${priceNum.toFixed(2)} / <AITranslatedText text="Share" />
          </Badge>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <div>
            <p className="text-xs text-slate-500 mb-1"><AITranslatedText text="Estimated Value" /></p>
            <p className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              ${Number(formatUnits(value, 6)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <Button 
            onClick={() => handleSell(isYes, balance)}
            disabled={isLoading}
            variant="ghost" 
            className="rounded-lg h-9 px-4 hover:bg-white/10 text-white font-semibold border border-white/10 hover:border-white/20 transition-all group"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            <AITranslatedText text="Sell back" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6 bg-slate-950/80 border-slate-800 backdrop-blur-md overflow-hidden relative">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16" />

      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-bold text-white tracking-wide"><AITranslatedText text="Your Active Positions" /></h3>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
          <Wallet className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[10px] font-bold text-blue-400 tracking-wider">
             <AITranslatedText text="AMM LIQUIDITY ON" />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
        {yesBalance && yesBalance > 0n && renderPosition(true, yesBalance, yesPrice || 500000n)}
        {noBalance && noBalance > 0n && renderPosition(false, noBalance, noPrice || 500000n)}
      </div>

      <div className="mt-4 text-[10px] text-slate-600 text-center uppercase tracking-[0.2em]">
        <AITranslatedText text="Pricing based on current pool liquidity • 2% swap fee applies" />
      </div>
    </Card>
  );
};
