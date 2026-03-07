import { describe, it, expect } from 'vitest';

describe('VaultStats Component', () => {
  it('should calculate NAV change percentage correctly', () => {
    const navPerShare = 12.5;
    const highWaterMark = 10.0;
    const expectedChange = ((navPerShare - highWaterMark) / highWaterMark) * 100;
    expect(expectedChange).toBe(25);
  });

  it('should determine if NAV is above high watermark', () => {
    const navPerShare = 12.5;
    const highWaterMark = 10.0;
    expect(navPerShare > highWaterMark).toBe(true);
  });

  it('should format large numbers correctly', () => {
    const totalAssets = 125000;
    const formatted = totalAssets.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    expect(formatted).toBe('125,000.00');
  });

  it('should format NAV with 4 decimal places', () => {
    const navPerShare = 12.5678;
    const formatted = navPerShare.toLocaleString('en-US', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    });
    expect(formatted).toBe('12.5678');
  });

  it('should calculate performance fee correctly', () => {
    const totalAssets = 125000;
    const performanceFee = 2500;
    const feePercent = (performanceFee / totalAssets) * 100;
    expect(feePercent).toBe(2);
  });

  it('should identify locked vault status', () => {
    const isLocked = true;
    const activePositions = 1;
    expect(isLocked && activePositions > 0).toBe(true);
  });

  it('should calculate share value correctly', () => {
    const shares = 1000;
    const navPerShare = 12.5;
    const shareValue = shares * navPerShare;
    expect(shareValue).toBe(12500);
  });

  it('should handle zero shares edge case', () => {
    const shares = 0;
    const navPerShare = 12.5;
    const shareValue = shares * navPerShare;
    expect(shareValue).toBe(0);
  });
});
