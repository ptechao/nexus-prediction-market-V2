import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';

export interface PortfolioPosition {
  marketId: string;
  marketTitle: string;
  side: 'yes' | 'no';
  shares: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  timestamp: number;
}

export interface PortfolioStats {
  totalInvested: number;
  totalValue: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  positions: PortfolioPosition[];
  winRate: number;
  totalTrades: number;
}

const PORTFOLIO_STORAGE_KEY = 'nexus_portfolio';

export function useUserPortfolio() {
  const { address } = useAccount();
  const [portfolio, setPortfolio] = useState<PortfolioStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load portfolio from localStorage
  const loadPortfolio = useCallback(() => {
    if (!address) {
      setPortfolio(null);
      return;
    }

    try {
      setLoading(true);
      const stored = localStorage.getItem(`${PORTFOLIO_STORAGE_KEY}_${address}`);
      if (stored) {
        const data = JSON.parse(stored) as PortfolioStats;
        setPortfolio(data);
      } else {
        setPortfolio({
          totalInvested: 0,
          totalValue: 0,
          unrealizedPnL: 0,
          unrealizedPnLPercent: 0,
          positions: [],
          winRate: 0,
          totalTrades: 0,
        });
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load portfolio');
      setPortfolio(null);
    } finally {
      setLoading(false);
    }
  }, [address]);

  // Save portfolio to localStorage
  const savePortfolio = useCallback(
    (newPortfolio: PortfolioStats) => {
      if (!address) return;
      try {
        localStorage.setItem(`${PORTFOLIO_STORAGE_KEY}_${address}`, JSON.stringify(newPortfolio));
        setPortfolio(newPortfolio);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save portfolio');
      }
    },
    [address]
  );

  // Add position to portfolio
  const addPosition = useCallback(
    (position: PortfolioPosition) => {
      if (!portfolio) return;

      const existingIndex = portfolio.positions.findIndex(
        (p) => p.marketId === position.marketId && p.side === position.side
      );

      let updatedPositions: PortfolioPosition[];
      if (existingIndex >= 0) {
        // Update existing position (average down/up)
        const existing = portfolio.positions[existingIndex];
        const totalShares = existing.shares + position.shares;
        const avgPrice = (existing.shares * existing.entryPrice + position.shares * position.entryPrice) / totalShares;
        updatedPositions = [...portfolio.positions];
        updatedPositions[existingIndex] = {
          ...existing,
          shares: totalShares,
          entryPrice: avgPrice,
        };
      } else {
        updatedPositions = [...portfolio.positions, position];
      }

      const newPortfolio = calculatePortfolioStats(updatedPositions, portfolio);
      savePortfolio(newPortfolio);
    },
    [portfolio, savePortfolio]
  );

  // Close position
  const closePosition = useCallback(
    (marketId: string, side: 'yes' | 'no', shares: number) => {
      if (!portfolio) return;

      const positionIndex = portfolio.positions.findIndex(
        (p) => p.marketId === marketId && p.side === side
      );

      if (positionIndex < 0) return;

      const position = portfolio.positions[positionIndex];
      let updatedPositions: PortfolioPosition[];

      if (shares >= position.shares) {
        // Close entire position
        updatedPositions = portfolio.positions.filter((_, i) => i !== positionIndex);
      } else {
        // Partial close
        updatedPositions = [...portfolio.positions];
        updatedPositions[positionIndex] = {
          ...position,
          shares: position.shares - shares,
        };
      }

      const newPortfolio = calculatePortfolioStats(updatedPositions, portfolio);
      savePortfolio(newPortfolio);
    },
    [portfolio, savePortfolio]
  );

  // Update position prices
  const updatePositionPrices = useCallback(
    (priceUpdates: Record<string, { yes: number; no: number }>) => {
      if (!portfolio) return;

      const updatedPositions = portfolio.positions.map((position) => {
        const prices = priceUpdates[position.marketId];
        if (!prices) return position;

        const currentPrice = position.side === 'yes' ? prices.yes : prices.no;
        const unrealizedPnL = (currentPrice - position.entryPrice) * position.shares;
        const unrealizedPnLPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

        return {
          ...position,
          currentPrice,
          unrealizedPnL,
          unrealizedPnLPercent,
        };
      });

      const newPortfolio = calculatePortfolioStats(updatedPositions, portfolio);
      savePortfolio(newPortfolio);
    },
    [portfolio, savePortfolio]
  );

  // Clear portfolio
  const clearPortfolio = useCallback(() => {
    if (!address) return;
    try {
      localStorage.removeItem(`${PORTFOLIO_STORAGE_KEY}_${address}`);
      setPortfolio(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear portfolio');
    }
  }, [address]);

  // Load portfolio on mount or address change
  useEffect(() => {
    loadPortfolio();
  }, [address, loadPortfolio]);

  return {
    portfolio,
    loading,
    error,
    addPosition,
    closePosition,
    updatePositionPrices,
    clearPortfolio,
    reload: loadPortfolio,
  };
}

// Helper function to calculate portfolio statistics
function calculatePortfolioStats(positions: PortfolioPosition[], currentPortfolio: PortfolioStats): PortfolioStats {
  const totalInvested = positions.reduce((sum, p) => sum + p.entryPrice * p.shares, 0);
  const totalValue = positions.reduce((sum, p) => sum + p.currentPrice * p.shares, 0);
  const unrealizedPnL = positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
  const unrealizedPnLPercent = totalInvested > 0 ? (unrealizedPnL / totalInvested) * 100 : 0;

  // Calculate win rate based on closed positions
  const winningTrades = currentPortfolio.positions.filter((p) => p.unrealizedPnL > 0).length;
  const totalTrades = currentPortfolio.totalTrades + 1;
  const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0;

  return {
    totalInvested,
    totalValue,
    unrealizedPnL,
    unrealizedPnLPercent,
    positions,
    winRate,
    totalTrades,
  };
}
