import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, CheckCircle, Loader2, TrendingUp, Users, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Leader {
  id: number;
  name: string;
  handle: string;
  avatar: string;
  roi: number;
  winRate: number;
  followers: number;
  vaultSize: number;
}

interface CopyTradingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leader: Leader | null;
  onConfirm: (amount: number) => Promise<void>;
}

export default function CopyTradingModal({
  open,
  onOpenChange,
  leader,
  onConfirm,
}: CopyTradingModalProps) {
  const [depositAmount, setDepositAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!leader) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDepositAmount(value);
      setError('');
    }
  };

  const validateAmount = (): boolean => {
    if (!depositAmount || depositAmount === '0') {
      setError('Please enter a valid deposit amount');
      return false;
    }
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Deposit amount must be greater than 0');
      return false;
    }
    if (amount > 1000000) {
      setError('Maximum deposit amount is $1,000,000');
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!validateAmount()) return;

    setLoading(true);
    setError('');
    try {
      await onConfirm(parseFloat(depositAmount));
      setSuccess(true);
      setTimeout(() => {
        setDepositAmount('');
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete copy trading');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setDepositAmount('');
      setError('');
      setSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-lg opacity-75 animate-pulse"></div>
              <CheckCircle className="w-16 h-16 text-green-500 relative" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Success!</h2>
            <p className="text-center text-slate-600">
              You are now following <span className="font-semibold">{leader.name}</span>
            </p>
            <p className="text-sm text-slate-500">
              Deposited: <span className="font-semibold">${parseFloat(depositAmount).toLocaleString()}</span>
            </p>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Copy Trading
              </DialogTitle>
              <DialogDescription>
                Follow this trader and automatically copy their positions
              </DialogDescription>
            </DialogHeader>

            {/* Leader Profile Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={leader.avatar}
                  alt={leader.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{leader.name}</h3>
                  <p className="text-sm text-slate-600">{leader.handle}</p>
                </div>
              </div>

              {/* Leader Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-xs text-slate-600">ROI</p>
                  <p className="font-bold text-green-600">{leader.roi.toFixed(1)}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-slate-600">Win Rate</p>
                  <p className="font-bold text-blue-600">{(leader.winRate * 100).toFixed(0)}%</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-slate-600">Followers</p>
                  <p className="font-bold text-purple-600">{leader.followers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            {/* Deposit Amount Input */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="deposit-amount" className="text-slate-900 font-semibold">
                  Deposit Amount (USDC)
                </Label>
                <p className="text-xs text-slate-600 mt-1">
                  Vault Size: ${leader.vaultSize.toLocaleString()}
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-slate-600 font-semibold">$</span>
                <Input
                  id="deposit-amount"
                  type="text"
                  placeholder="Enter amount (e.g., 1000)"
                  value={depositAmount}
                  onChange={handleAmountChange}
                  disabled={loading}
                  className="pl-8 text-lg font-semibold"
                />
              </div>

              {/* Quick Amount Buttons */}
              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => setDepositAmount(amount.toString())}
                    disabled={loading}
                    className="flex-1 text-xs"
                  >
                    ${amount.toLocaleString()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Info Alert */}
            <Alert className="bg-blue-50 border-blue-200">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Your deposit will automatically follow this trader's positions proportionally.
              </AlertDescription>
            </Alert>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading || !depositAmount}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Start Following
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
