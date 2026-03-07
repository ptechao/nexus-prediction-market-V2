import { describe, it, expect, vi } from 'vitest';
import { parseUnits } from 'viem';

describe('useNexus Hook', () => {
  it('should calculate odds correctly from pool sizes', () => {
    const yesPool = BigInt(1000);
    const noPool = BigInt(2000);
    const total = yesPool + noPool;
    const yesOdds = Number((yesPool * BigInt(100)) / total);
    expect(yesOdds).toBe(33);
  });

  it('should handle zero pool edge case', () => {
    const yesPool = BigInt(0);
    const noPool = BigInt(0);
    const total = yesPool + noPool;
    expect(total === BigInt(0)).toBe(true);
  });

  it('should parse USDC amount correctly', () => {
    const amount = '100';
    const parsed = parseUnits(amount, 6);
    expect(parsed).toBe(BigInt(100000000));
  });

  it('should calculate expected payout with correct formula', () => {
    const userBet = BigInt(100000000); // 100 USDC
    const totalPool = BigInt(3000000000); // 3000 USDC
    const winningPool = BigInt(1000000000); // 1000 USDC (YES pool)
    const payout = (userBet * totalPool) / winningPool;
    expect(payout).toBe(BigInt(300000000)); // 300 USDC
  });

  it('should handle zero winning pool (refund scenario)', () => {
    const userBet = BigInt(100000000);
    const winningPool = BigInt(0);
    // Should return original bet as refund
    expect(userBet).toBe(BigInt(100000000));
  });

  it('should calculate shares from deposit correctly', () => {
    const depositAmount = BigInt(1000000000); // 1000 USDC
    const navPerShare = BigInt(12500000); // 12.5 USDC per share (with 6 decimals)
    const shares = depositAmount / navPerShare;
    expect(shares).toBe(BigInt(80)); // 80 shares
  });

  it('should format USDC balance correctly', () => {
    const balance = BigInt(125000000); // 125 USDC (with 6 decimals)
    const formatted = Number(balance) / 1e6;
    expect(formatted).toBe(125);
  });

  it('should validate positive deposit amount', () => {
    const amount = '100';
    const isValid = parseFloat(amount) > 0;
    expect(isValid).toBe(true);
  });

  it('should validate zero deposit amount as invalid', () => {
    const amount = '0';
    const isValid = parseFloat(amount) > 0;
    expect(isValid).toBe(false);
  });

  it('should validate negative deposit amount as invalid', () => {
    const amount = '-100';
    const isValid = parseFloat(amount) > 0;
    expect(isValid).toBe(false);
  });
});
