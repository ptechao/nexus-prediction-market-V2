import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AITranslatedText } from '@/components/AITranslatedText';
import { useNexus } from '@/hooks/useNexus';
import { useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { toast } from 'sonner';

interface BettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  marketTitle: string;
  marketAddress?: string;
  yesOdds: number;
  noOdds: number;
}

type BettingState = 'input' | 'confirming' | 'success' | 'error';

export function BettingModal({
  isOpen,
  onClose,
  marketTitle,
  marketAddress,
  yesOdds,
  noOdds,
}: BettingModalProps) {
  const { isConnected } = useAccount();
  const { 
    buyYes, 
    buyNo, 
    approveUsdc, 
    usdcBalance, 
    usdcAllowance,
    isLoading: isContractLoading,
    error: contractError 
  } = useNexus(marketAddress);

  const [betType, setBetType] = useState<'yes' | 'no'>('yes');
  const [amount, setAmount] = useState('');
  const [state, setState] = useState<BettingState>('input');
  const [errorMessage, setErrorMessage] = useState('');

  const potentialPayout = amount
    ? (parseFloat(amount) * (betType === 'yes' ? 100 : 100)) / (betType === 'yes' ? yesOdds : noOdds)
    : 0;

  useEffect(() => {
    if (contractError) {
      setErrorMessage(contractError);
      setState('error');
    }
  }, [contractError]);

  const handleBet = async () => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet first');
      setState('error');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      setState('error');
      return;
    }

    if (!marketAddress) {
      setErrorMessage('Market contract address not found');
      setState('error');
      return;
    }

    setState('confirming');

    try {
      const amountWei = parseUnits(amount, 6);
      
      // Check allowance
      if (!usdcAllowance || usdcAllowance < amountWei) {
        setState('confirming'); // Update UI to show approval
        toast.info('Need to approve USDC first');
        const approved = await approveUsdc(amount);
        if (!approved) throw new Error('USDC Approval failed');
      }

      const success = betType === 'yes' 
        ? await buyYes(amount) 
        : await buyNo(amount);

      if (success) {
        setState('success');
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Transaction failed. Please try again.');
      setState('error');
    }
  };

  const handleClose = () => {
    setAmount('');
    setState('input');
    setErrorMessage('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <AITranslatedText as="h2" className="text-2xl font-bold" text="Place Your Bet" />
        </DialogHeader>

        {state === 'input' && (
          <div className="space-y-6">
            {/* Market Title */}
            <div>
              <AITranslatedText as="p" className="text-sm text-slate-600 mb-1" text="Market" />
              <AITranslatedText as="p" className="text-lg font-semibold text-slate-900" text={marketTitle} />
            </div>

            {/* Bet Type Selection */}
            <div>
              <AITranslatedText as="label" className="text-base font-semibold mb-3 block" text="Choose Outcome" />
              <Tabs value={betType} onValueChange={(value) => setBetType(value as 'yes' | 'no')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="yes" className="text-base">
                    <span className="text-green-600 font-semibold"><AITranslatedText text="Yes" /></span>
                    <span className="ml-2 text-sm text-slate-600">{yesOdds}%</span>
                  </TabsTrigger>
                  <TabsTrigger value="no" className="text-base">
                    <span className="text-red-600 font-semibold"><AITranslatedText text="No" /></span>
                    <span className="ml-2 text-sm text-slate-600">{noOdds}%</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="yes" className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <AITranslatedText as="p" className="text-sm text-green-800" text="You're betting that this outcome will occur. Your potential payout is based on the current odds." />
                </TabsContent>

                <TabsContent value="no" className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <AITranslatedText as="p" className="text-sm text-red-800" text="You're betting against this outcome. Your potential payout is based on the current odds." />
                </TabsContent>
              </Tabs>
            </div>

            {/* Amount Input */}
            <div>
              <AITranslatedText as="label" className="text-base font-semibold mb-2 block" text="Amount (USDC)" />
              <div className="relative">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-lg py-6 pl-4 pr-12"
                  disabled={!isConnected}
                />
                <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-600 font-semibold">
                  USDC
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-2">
                <AITranslatedText text="Balance" />: 1,250.00 USDC
              </div>
            </div>

            {/* Payout Display */}
            {amount && parseFloat(amount) > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <AITranslatedText as="span" className="text-sm text-slate-600" text="Your Bet" />
                  <span className="font-semibold text-slate-900">{amount} USDC</span>
                </div>
                <div className="flex justify-between items-center">
                  <AITranslatedText as="span" className="text-sm text-slate-600" text="Potential Payout" />
                  <span className="font-bold text-lg text-blue-600">
                    {potentialPayout.toFixed(2)} USDC
                  </span>
                </div>
              </div>
            )}

            {/* Connection Warning */}
            {!isConnected && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <AITranslatedText text="Please connect your wallet to place a bet" />
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                <AITranslatedText text="Cancel" />
              </Button>
              <Button
                onClick={handleBet}
                disabled={!isConnected || !amount || parseFloat(amount) <= 0}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
              >
                <AITranslatedText text="Place Bet" />
              </Button>
            </div>
          </div>
        )}

        {state === 'confirming' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            <div className="text-center">
              <AITranslatedText as="p" className="text-lg font-semibold text-slate-900" text="Confirming Transaction" />
              <AITranslatedText as="p" className="text-sm text-slate-600 mt-1" text="Please confirm in your wallet" />
            </div>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
            <div className="text-center">
              <AITranslatedText as="p" className="text-lg font-semibold text-slate-900" text="Bet Placed Successfully!" />
              <div className="text-sm text-slate-600 mt-2">
                <AITranslatedText text={`You've bet ${amount} USDC on ${betType === 'yes' ? 'Yes' : 'No'}`} />
              </div>
              <div className="text-sm text-slate-600 mt-1">
                <AITranslatedText text={`Potential payout: ${potentialPayout.toFixed(2)} USDC`} />
              </div>
            </div>
            <Button
              onClick={handleClose}
              className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
            >
              <AITranslatedText text="Done" />
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <AlertCircle className="w-12 h-12 text-red-600" />
            <div className="text-center">
              <AITranslatedText as="p" className="text-lg font-semibold text-slate-900" text="Transaction Failed" />
              <AITranslatedText as="p" className="text-sm text-slate-600 mt-2" text={errorMessage} />
            </div>
            <Button
              onClick={() => setState('input')}
              className="w-full mt-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold"
            >
              <AITranslatedText text="Try Again" />
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
