'use client';

import { useCallback, useState } from 'react';
import { useAccount, useContractRead, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
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

  // ==================== Write Contract Hooks ====================

  // USDC Approve
  const { writeContract: writeApproveUsdc, isPending: isApprovePending } = useWriteContract();

  // Vault Deposit
  const { writeContract: writeDepositVault, isPending: isDepositPending } = useWriteContract();

  // Buy YES
  const { writeContract: writeBuyYes, isPending: isBuyYesPending } = useWriteContract();

  // Buy NO
  const { writeContract: writeBuyNo, isPending: isBuyNoPending } = useWriteContract();

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
   * Read USDC allowance for vault
   */
  const { data: usdcAllowance } = useContractRead({
    address: CONTRACT_ADDRESSES.USDC as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: [userAddress as `0x${string}`, vaultAddress as `0x${string}`],
    query: {
      enabled: !!userAddress && !!vaultAddress && isConnected,
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
    async (amount: string): Promise<boolean> => {
      if (!marketAddress || !userAddress) {
        setError('Wallet not connected or market not selected');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        const amountInWei = parseUnits(amount, 6);

        return new Promise((resolve) => {
          writeBuyYes(
            {
              address: marketAddress as `0x${string}`,
              abi: BINARY_MARKET_ABI,
              functionName: 'buyYes',
              args: [amountInWei],
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
    async (amount: string): Promise<boolean> => {
      if (!marketAddress || !userAddress) {
        setError('Wallet not connected or market not selected');
        return false;
      }

      try {
        setIsLoading(true);
        setError(null);
        const amountInWei = parseUnits(amount, 6);

        return new Promise((resolve) => {
          writeBuyNo(
            {
              address: marketAddress as `0x${string}`,
              abi: BINARY_MARKET_ABI,
              functionName: 'buyNo',
              args: [amountInWei],
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

    // Write functions
    approveUsdc,
    depositToVault,
    buyYes,
    buyNo,
    claimWinnings,

    // State
    isLoading: isLoading || isApprovePending || isDepositPending || isBuyYesPending || isBuyNoPending,
    error,
    txHash,
    isConnected,
  };
}
