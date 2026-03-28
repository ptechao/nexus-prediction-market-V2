'use client';

import { useCallback, useState } from 'react';
import { useAccount, useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES } from '@/lib/web3Config';

// ABI for BinaryMarket contract
export const BINARY_MARKET_ABI = [
  {
    type: 'function',
    name: 'getMarketDetails',
    inputs: [],
    outputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'yesPool', type: 'uint256' },
      { name: 'noPool', type: 'uint256' },
      { name: 'status', type: 'uint8' },
      { name: 'endTime', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'buyYes',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'buyNo',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'buyYesWithSlippage',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'referrer', type: 'address' },
      { name: 'minSharesOut', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'buyNoWithSlippage',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'referrer', type: 'address' },
      { name: 'minSharesOut', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'placeLimitOrder',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'price', type: 'uint256' },
      { name: 'isYes', type: 'bool' },
      { name: 'isBuying', type: 'bool' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'cancelLimitOrder',
    inputs: [{ name: 'orderId', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'fillOrder',
    inputs: [
      { name: 'orderId', type: 'uint256' },
      { name: 'amountToFill', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'referrerEarnings',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'claimWinnings',
    inputs: [],
    outputs: [{ name: 'payout', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'calculateExpectedPayout',
    inputs: [{ name: 'userBet', type: 'uint256' }, { name: 'outcome', type: 'bool' }],
    outputs: [{ name: 'payout', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'sellYes',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'sellNo',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPrice',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// ABI for CopyTradingVault contract
export const COPY_TRADING_VAULT_ABI = [
  {
    type: 'function',
    name: 'totalAssets',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'getNavPerShare',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'deposit',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'withdraw',
    inputs: [{ name: 'shares', type: 'uint256' }],
    outputs: [{ name: 'amount', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'leaderBuyYes',
    inputs: [{ name: 'market', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'leaderBuyNo',
    inputs: [{ name: 'market', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'getPosition',
    inputs: [{ name: 'marketAddress', type: 'address' }],
    outputs: [
      { name: 'market', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'outcome', type: 'bool' },
      { name: 'status', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'calculateSharesFromDeposit',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [{ name: 'shares', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

// ABI for USDC token
export const USDC_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
] as const;

interface MarketData {
  title: string;
  description: string;
  yesPool: bigint;
  noPool: bigint;
  status: number;
  endTime: bigint;
}

interface VaultData {
  totalAssets: bigint;
  navPerShare: bigint;
  totalShares: bigint;
}

interface PositionData {
  market: string;
  amount: bigint;
  outcome: boolean;
  status: number;
}

/**
 * Custom hook for NEXUS contract interactions
 * Provides read and write functions for BinaryMarket and CopyTradingVault
 */
export function useNexus(marketAddress?: string, vaultAddress?: string) {
  const { address: userAddress, isConnected } = useAccount();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const invalidateContractData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['readContract'] });
  }, [queryClient]);

  // ==================== Write Contract Hooks ====================

  // USDC Approve
  const { writeContract: writeApproveUsdc, isPending: isApprovePending } = useWriteContract();

  // Vault Deposit
  const { writeContract: writeDepositVault, isPending: isDepositPending } = useWriteContract();

  // Buy YES
  const { writeContract: writeBuyYes, isPending: isBuyYesPending } = useWriteContract();

  // Buy NO
  const { writeContract: writeBuyNo, isPending: isBuyNoPending } = useWriteContract();

  // Sell positions
  const { writeContract: writeSellYes, isPending: isSellYesPending } = useWriteContract();
  const { writeContract: writeSellNo, isPending: isSellNoPending } = useWriteContract();

  // Order Book
  const { writeContract: writePlaceOrder, isPending: isPlaceOrderPending } = useWriteContract();
  const { writeContract: writeCancelOrder, isPending: isCancelOrderPending } = useWriteContract();
  const { writeContract: writeFillOrder, isPending: isFillOrderPending } = useWriteContract();

  // ==================== BinaryMarket Read Functions ====================

  /**
   * Read market details from BinaryMarket contract
   */
  const { data: marketData } = useContractRead({
    address: marketAddress as `0x${string}`,
    abi: BINARY_MARKET_ABI,
    functionName: 'getMarketDetails',
    query: {
      enabled: !!marketAddress && isConnected,
    },
  }) as { data: MarketData | undefined };

  /**
   * Calculate odds from pool sizes
   * Yes odds = yesPool / (yesPool + noPool)
   */
  const getOdds = useCallback(() => {
    if (!marketData) return { yesOdds: 0, noOdds: 0 };
    const total = marketData.yesPool + marketData.noPool;
    if (total === BigInt(0)) return { yesOdds: 50, noOdds: 50 };
    const yesOdds = Number((marketData.yesPool * BigInt(100)) / total);
    return { yesOdds, noOdds: 100 - yesOdds };
  }, [marketData]);

  /**
   * Calculate expected payout for a bet
   */
  const { data: expectedPayout } = useContractRead({
    address: marketAddress as `0x${string}`,
    abi: BINARY_MARKET_ABI,
    functionName: 'calculateExpectedPayout',
    args: [parseUnits('100', 6), true as const], // Mock: 100 USDC on YES
    query: {
      enabled: !!marketAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  // ==================== CopyTradingVault Read Functions ====================

  /**
   * Read vault total assets
   */
  const { data: vaultTotalAssets } = useContractRead({
    address: vaultAddress as `0x${string}`,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'totalAssets',
    query: {
      enabled: !!vaultAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  /**
   * Read vault NAV per share
   */
  const { data: navPerShare } = useContractRead({
    address: vaultAddress as `0x${string}`,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'getNavPerShare',
    query: {
      enabled: !!vaultAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  /**
   * Calculate shares from deposit amount
   */
  const { data: sharesFromDeposit } = useContractRead({
    address: vaultAddress as `0x${string}`,
    abi: COPY_TRADING_VAULT_ABI,
    functionName: 'calculateSharesFromDeposit',
    args: [parseUnits('1000', 6)], // Mock: 1000 USDC
    query: {
      enabled: !!vaultAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  /**
   * Read user USDC balance
   */
  const { data: usdcBalance } = useContractRead({
    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  /**
   * Read user USDC allowance for the market
   */
  const { data: usdcAllowance } = useContractRead({
    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [userAddress as `0x${string}`, (marketAddress || vaultAddress) as `0x${string}`],
    query: {
      enabled: !!userAddress && !!(marketAddress || vaultAddress) && isConnected,
    },
  }) as { data: bigint | undefined };

  /**
   * Read user YES balance (Token ID 1)
   */
  const { data: yesBalance } = useContractRead({
    address: marketAddress as `0x${string}`,
    abi: BINARY_MARKET_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`, BigInt(1)],
    query: {
      enabled: !!userAddress && !!marketAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  /**
   * Read user NO balance (Token ID 2)
   */
  const { data: noBalance } = useContractRead({
    address: marketAddress as `0x${string}`,
    abi: BINARY_MARKET_ABI,
    functionName: 'balanceOf',
    args: [userAddress as `0x${string}`, BigInt(2)],
    query: {
      enabled: !!userAddress && !!marketAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  /**
   * Read current prices (Scaled by 1e6)
   */
  const { data: yesPrice } = useContractRead({
    address: marketAddress as `0x${string}`,
    abi: BINARY_MARKET_ABI,
    functionName: 'getPrice',
    args: [BigInt(1)],
    query: {
      enabled: !!marketAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  const { data: noPrice } = useContractRead({
    address: marketAddress as `0x${string}`,
    abi: BINARY_MARKET_ABI,
    functionName: 'getPrice',
    args: [BigInt(2)],
    query: {
      enabled: !!marketAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  /**
   * Read referrer earnings
   */
  const { data: myReferrerEarnings } = useContractRead({
    address: marketAddress as `0x${string}`,
    abi: BINARY_MARKET_ABI,
    functionName: 'referrerEarnings',
    args: [userAddress as `0x${string}`],
    query: {
      enabled: !!userAddress && !!marketAddress && isConnected,
    },
  }) as { data: bigint | undefined };

  // ==================== Write Functions ====================

  /**
   * Approve USDC for vault deposit
   * Calls USDC.approve(vaultAddress, amountInWei)
   */
  const approveUsdc = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!vaultAddress || !userAddress) {
        setError('Wallet not connected');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        const amountInWei = parseUnits(amount, 6);

        return new Promise((resolve) => {
          writeApproveUsdc(
            {
              address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
              abi: USDC_ABI,
              functionName: 'approve',
              args: [vaultAddress as `0x${string}`, amountInWei],
            },
            {
              onSuccess: (hash) => {
                setTxHash(hash);
                setError(null);
                resolve(true);
              },
              onError: (err) => {
                const errorMessage = err instanceof Error ? err.message : 'Approval failed';
                setError(errorMessage);
                resolve(false);
              },
            }
          );
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [vaultAddress, userAddress, writeApproveUsdc]
  );

  /**
   * Deposit USDC into vault
   * Calls CopyTradingVault.deposit(amountInWei)
   */
  const depositToVault = useCallback(
    async (amount: string): Promise<boolean> => {
      if (!vaultAddress || !userAddress) {
        setError('Wallet not connected');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        const amountInWei = parseUnits(amount, 6);

        return new Promise((resolve) => {
          writeDepositVault(
            {
              address: vaultAddress as `0x${string}`,
              abi: COPY_TRADING_VAULT_ABI,
              functionName: 'deposit',
              args: [amountInWei],
            },
            {
              onSuccess: (hash) => {
                setTxHash(hash);
                setError(null);
                resolve(true);
              },
              onError: (err) => {
                const errorMessage = err instanceof Error ? err.message : 'Deposit failed';
                setError(errorMessage);
                resolve(false);
              },
            }
          );
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [vaultAddress, userAddress, writeDepositVault]
  );

  /**
   * Buy YES on market
   * Calls BinaryMarket.buyYes(amountInWei)
   */
  const buyYes = useCallback(
    async (amount: string, minSharesOut: bigint = 0n, referrer?: string): Promise<boolean> => {
      if (!marketAddress || !userAddress) {
        setError('Wallet not connected or market not selected');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        const amountInWei = parseUnits(amount, 6);
        const refAddr = referrer || localStorage.getItem('nexus_referral') || '0x0000000000000000000000000000000000000000';

        return new Promise((resolve) => {
          writeBuyYes(
            {
              address: marketAddress as `0x${string}`,
              abi: BINARY_MARKET_ABI,
              functionName: 'buyYesWithSlippage',
              args: [amountInWei, refAddr as `0x${string}`, minSharesOut],
            },
            {
              onSuccess: (hash) => {
                setTxHash(hash);
                setError(null);
                resolve(true);
              },
              onError: (err) => {
                const errorMessage = err instanceof Error ? err.message : 'Buy YES failed';
                setError(errorMessage);
                resolve(false);
              },
            }
          );
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [marketAddress, userAddress, writeBuyYes]
  );

  /**
   * Buy NO on market
   * Calls BinaryMarket.buyNo(amountInWei)
   */
  const buyNo = useCallback(
    async (amount: string, minSharesOut: bigint = 0n, referrer?: string): Promise<boolean> => {
      if (!marketAddress || !userAddress) {
        setError('Wallet not connected or market not selected');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        const amountInWei = parseUnits(amount, 6);
        const refAddr = referrer || localStorage.getItem('nexus_referral') || '0x0000000000000000000000000000000000000000';

        return new Promise((resolve) => {
          writeBuyNo(
            {
              address: marketAddress as `0x${string}`,
              abi: BINARY_MARKET_ABI,
              functionName: 'buyNoWithSlippage',
              args: [amountInWei, refAddr as `0x${string}`, minSharesOut],
            },
            {
              onSuccess: (hash) => {
                setTxHash(hash);
                setError(null);
                resolve(true);
              },
              onError: (err) => {
                const errorMessage = err instanceof Error ? err.message : 'Buy NO failed';
                setError(errorMessage);
                resolve(false);
              },
            }
          );
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [marketAddress, userAddress, writeBuyNo]
  );

  /**
   * Claim winnings from market
   * Calls BinaryMarket.claimWinnings()
   */
  const claimWinnings = useCallback(
    async (): Promise<boolean> => {
      if (!marketAddress || !userAddress) {
        setError('Wallet not connected or market not selected');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);

        return new Promise((resolve) => {
          writeBuyYes(
            {
              address: marketAddress as `0x${string}`,
              abi: BINARY_MARKET_ABI,
              functionName: 'claimWinnings',
            },
            {
              onSuccess: (hash) => {
                setTxHash(hash);
                setError(null);
                resolve(true);
              },
              onError: (err) => {
                const errorMessage = err instanceof Error ? err.message : 'Claim failed';
                setError(errorMessage);
                resolve(false);
              },
            }
          );
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [marketAddress, userAddress, writeBuyYes]
  );

  return {
    // Market data
    marketData,
    getOdds,
    expectedPayout,

    // Vault data
    vaultTotalAssets,
    navPerShare,
    sharesFromDeposit,

    // User data
    usdcBalance,
    usdcAllowance,
    yesBalance,
    noBalance,
    yesPrice,
    noPrice,
    referrerEarnings: myReferrerEarnings,

    // Write functions
    approveUsdc,
    depositToVault,
    buyYes: useCallback(async (amount: string, minSharesOut: bigint = BigInt(0)): Promise<boolean> => {
      if (!marketAddress || !userAddress) return false;
      const ref = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null;
      const referrerAddr = ref && ref.startsWith('0x') ? ref : '0x0000000000000000000000000000000000000000';
      
      try {
        setIsLoading(true);
        const amountWei = parseUnits(amount, 6);
        return new Promise((resolve) => {
          writeBuyYes({ 
            address: marketAddress as `0x${string}`, 
            abi: BINARY_MARKET_ABI, 
            functionName: minSharesOut > 0 ? 'buyYesWithSlippage' : 'buyYes', 
            args: minSharesOut > 0 ? [amountWei, referrerAddr, minSharesOut] : [amountWei] 
          }, {
            onSuccess: (h) => { setTxHash(h); resolve(true); },
            onError: (err) => { setError(err.message); resolve(false); }
          });
        });
      } finally { setIsLoading(false); }
    }, [marketAddress, userAddress, writeBuyYes]),
    buyNo,
    claimWinnings,

    // Order Book
    placeLimitOrder: useCallback(async (amount: string, price: string, isYes: boolean, isBuying: boolean): Promise<boolean> => {
      if (!marketAddress || !userAddress) return false;
      try {
        setIsLoading(true);
        const amountWei = parseUnits(amount, 6);
        const priceWei = parseUnits(price, 6);
        return new Promise((resolve) => {
          writePlaceOrder({
            address: marketAddress as `0x${string}`,
            abi: BINARY_MARKET_ABI,
            functionName: 'placeLimitOrder',
            args: [amountWei, priceWei, isYes, isBuying],
          }, {
            onSuccess: (h) => { setTxHash(h); resolve(true); },
            onError: (err) => { setError(err.message); resolve(false); }
          });
        });
      } finally { setIsLoading(false); }
    }, [marketAddress, userAddress, writePlaceOrder]),

    cancelLimitOrder: useCallback(async (id: bigint): Promise<boolean> => {
      if (!marketAddress || !userAddress) return false;
      try {
        setIsLoading(true);
        return new Promise((resolve) => {
          writeCancelOrder({
            address: marketAddress as `0x${string}`,
            abi: BINARY_MARKET_ABI,
            functionName: 'cancelLimitOrder',
            args: [id],
          }, {
            onSuccess: (h) => { setTxHash(h); resolve(true); },
            onError: (err) => { setError(err.message); resolve(false); }
          });
        });
      } finally { setIsLoading(false); }
    }, [marketAddress, userAddress, writeCancelOrder]),

    fillOrder: useCallback(async (id: bigint, amount: string): Promise<boolean> => {
      if (!marketAddress || !userAddress) return false;
      try {
        setIsLoading(true);
        const amountWei = parseUnits(amount, 6);
        return new Promise((resolve) => {
          writeFillOrder({
            address: marketAddress as `0x${string}`,
            abi: BINARY_MARKET_ABI,
            functionName: 'fillOrder',
            args: [id, amountWei],
          }, {
            onSuccess: (h) => { setTxHash(h); resolve(true); },
            onError: (err) => { setError(err.message); resolve(false); }
          });
        });
      } finally { setIsLoading(false); }
    }, [marketAddress, userAddress, writeFillOrder]),

    // Sell functions
    sellYes: useCallback(async (shares: string): Promise<boolean> => {
      if (!marketAddress || !userAddress) return false;
      try {
        setIsLoading(true);
        const sharesWei = parseUnits(shares, 6);
        return new Promise((resolve) => {
          writeSellYes({
            address: marketAddress as `0x${string}`,
            abi: BINARY_MARKET_ABI,
            functionName: 'sellYes',
            args: [sharesWei],
          }, {
            onSuccess: (hash) => { setTxHash(hash); resolve(true); },
            onError: (err) => { setError(err.message); resolve(false); }
          });
        });
      } finally { setIsLoading(false); }
    }, [marketAddress, userAddress, writeSellYes]),

    sellNo: useCallback(async (shares: string): Promise<boolean> => {
      if (!marketAddress || !userAddress) return false;
      try {
        setIsLoading(true);
        const sharesWei = parseUnits(shares, 6);
        return new Promise((resolve) => {
          writeSellNo({
            address: marketAddress as `0x${string}`,
            abi: BINARY_MARKET_ABI,
            functionName: 'sellNo',
            args: [sharesWei],
          }, {
            onSuccess: (hash) => { setTxHash(hash); resolve(true); },
            onError: (err) => { setError(err.message); resolve(false); }
          });
        });
      } finally { setIsLoading(false); }
    }, [marketAddress, userAddress, writeSellNo]),

    // State
    isLoading: isLoading || isApprovePending || isDepositPending || isBuyYesPending || isBuyNoPending || isSellYesPending || isSellNoPending,
    error,
    txHash,
    isConnected,
  };
}
