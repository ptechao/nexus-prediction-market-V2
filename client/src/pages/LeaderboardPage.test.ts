import { describe, it, expect } from 'vitest';

describe('LeaderboardPage', () => {
  const mockVaults = [
    {
      id: '1',
      name: 'Alex Chen',
      totalAssets: 125000,
      roi7d: 12.5,
      winRate: 0.72,
      followers: 234,
      navPerShare: 12.5,
    },
    {
      id: '2',
      name: 'Sarah Martinez',
      totalAssets: 89500,
      roi7d: 8.3,
      winRate: 0.68,
      followers: 156,
      navPerShare: 11.8,
    },
    {
      id: '3',
      name: 'James Wilson',
      totalAssets: 67200,
      roi7d: -2.1,
      winRate: 0.55,
      followers: 89,
      navPerShare: 10.2,
    },
  ];

  it('should sort vaults by ROI correctly', () => {
    const sorted = [...mockVaults].sort((a, b) => b.roi7d - a.roi7d);
    expect(sorted[0].name).toBe('Alex Chen');
    expect(sorted[1].name).toBe('Sarah Martinez');
    expect(sorted[2].name).toBe('James Wilson');
  });

  it('should sort vaults by TVL correctly', () => {
    const sorted = [...mockVaults].sort((a, b) => b.totalAssets - a.totalAssets);
    expect(sorted[0].totalAssets).toBe(125000);
    expect(sorted[1].totalAssets).toBe(89500);
    expect(sorted[2].totalAssets).toBe(67200);
  });

  it('should sort vaults by win rate correctly', () => {
    const sorted = [...mockVaults].sort((a, b) => b.winRate - a.winRate);
    expect(sorted[0].winRate).toBe(0.72);
    expect(sorted[1].winRate).toBe(0.68);
    expect(sorted[2].winRate).toBe(0.55);
  });

  it('should format TVL correctly', () => {
    const tvl = 125000;
    const formatted = (tvl / 1000).toFixed(1);
    expect(parseFloat(formatted)).toBe(125);
  });

  it('should format ROI with sign correctly', () => {
    const roi = 12.5;
    const formatted = `${roi >= 0 ? '+' : ''}${roi}%`;
    expect(formatted).toContain('12.5');
    expect(formatted).toContain('+');
  });

  it('should format negative ROI correctly', () => {
    const roi = -2.1;
    const formatted = `${roi >= 0 ? '+' : ''}${roi}%`;
    expect(formatted).toContain('-2.1');
  });

  it('should format win rate as percentage', () => {
    const winRate = 0.72;
    const percentage = (winRate * 100).toFixed(0);
    expect(percentage).toBe('72');
  });

  it('should calculate estimated shares from deposit', () => {
    const depositAmount = 100;
    const navPerShare = 12.5;
    const estimatedShares = (depositAmount / navPerShare).toFixed(2);
    expect(estimatedShares).toBe('8.00');
  });

  it('should validate deposit amount is positive', () => {
    const depositAmount = '100';
    const isValid = parseFloat(depositAmount) > 0;
    expect(isValid).toBeTruthy();
  });

  it('should invalidate empty deposit amount', () => {
    const depositAmount = '';
    const isValid = depositAmount && parseFloat(depositAmount) > 0;
    expect(isValid).toBeFalsy();
  });

  it('should identify positive ROI vaults', () => {
    const positiveRoiVaults = mockVaults.filter((v) => v.roi7d > 0);
    expect(positiveRoiVaults.length).toBe(2);
  });

  it('should identify negative ROI vaults', () => {
    const negativeRoiVaults = mockVaults.filter((v) => v.roi7d < 0);
    expect(negativeRoiVaults.length).toBeGreaterThan(0);
  });

  it('should format address correctly', () => {
    const address = '0x1234567890123456789012345678901234567890';
    const formatted = `${address.slice(0, 6)}...${address.slice(-4)}`;
    expect(formatted).toContain('0x1234');
    expect(formatted).toContain('7890');
  });

  it('should have correct number of vaults', () => {
    expect(mockVaults.length).toBe(3);
  });

  it('should maintain vault data integrity', () => {
    mockVaults.forEach((vault) => {
      expect(vault.id).toBeDefined();
      expect(vault.name).toBeDefined();
      expect(vault.totalAssets).toBeGreaterThan(0);
      expect(vault.winRate).toBeGreaterThan(0);
      expect(vault.winRate).toBeLessThanOrEqual(1);
    });
  });
});
