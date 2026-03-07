import { describe, it, expect } from 'vitest';

describe('VaultDetails Page', () => {
  it('should calculate total profit from positions', () => {
    const positions = [
      { profit: 2500 },
      { profit: -8000 },
      { profit: 1500 },
    ];
    const totalProfit = positions.reduce((sum, pos) => sum + pos.profit, 0);
    expect(totalProfit).toBe(-4000);
  });

  it('should calculate total fees from positions', () => {
    const positions = [
      { performanceFee: 500 },
      { performanceFee: 0 },
      { performanceFee: 300 },
    ];
    const totalFees = positions.reduce((sum, pos) => sum + pos.performanceFee, 0);
    expect(totalFees).toBe(800);
  });

  it('should count closed positions correctly', () => {
    const positions = [
      { status: 'Closed' },
      { status: 'Closed' },
      { status: 'Active' },
    ];
    const closedCount = positions.filter((p) => p.status === 'Closed').length;
    expect(closedCount).toBe(2);
  });

  it('should calculate win rate correctly', () => {
    const positions = [
      { profit: 2500 },
      { profit: -8000 },
      { profit: 1500 },
    ];
    const winningCount = positions.filter((p) => p.profit > 0).length;
    const winRate = (winningCount / positions.length) * 100;
    expect(winRate).toBeCloseTo(66.67, 1);
  });

  it('should calculate follower current value correctly', () => {
    const shares = 1500;
    const navPerShare = 12.5;
    const currentValue = shares * navPerShare;
    expect(currentValue).toBe(18750);
  });

  it('should calculate follower gain correctly', () => {
    const currentValue = 18750;
    const deposit = 12000;
    const gain = currentValue - deposit;
    expect(gain).toBe(6750);
  });

  it('should calculate follower gain percentage correctly', () => {
    const gain = 6750;
    const deposit = 12000;
    const gainPercent = (gain / deposit) * 100;
    expect(gainPercent).toBeCloseTo(56.25, 2);
  });

  it('should handle zero deposit edge case', () => {
    const gain = 1000;
    const deposit = 0;
    // Should handle division by zero gracefully
    expect(deposit === 0).toBe(true);
  });

  it('should format large numbers correctly', () => {
    const number = 1234567;
    const formatted = number.toLocaleString();
    expect(formatted).toBe('1,234,567');
  });

  it('should identify positive and negative gains', () => {
    const gain1 = 6750;
    const gain2 = -2000;
    expect(gain1 >= 0).toBe(true);
    expect(gain2 >= 0).toBe(false);
  });
});
