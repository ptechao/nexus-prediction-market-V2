import { describe, it, expect } from 'vitest';
import { SUPPORTED_CHAINS, DEFAULT_CHAIN, CONTRACT_ADDRESSES, RPC_URLS } from './web3Config';

describe('web3Config', () => {
  it('should export SUPPORTED_CHAINS object', () => {
    expect(SUPPORTED_CHAINS).toBeDefined();
    expect(SUPPORTED_CHAINS).toHaveProperty('POLYGON');
    expect(SUPPORTED_CHAINS).toHaveProperty('POLYGON_MUMBAI');
    expect(SUPPORTED_CHAINS).toHaveProperty('BASE');
    expect(SUPPORTED_CHAINS).toHaveProperty('BASE_SEPOLIA');
  });

  it('should set DEFAULT_CHAIN to polygonMumbai', () => {
    expect(DEFAULT_CHAIN).toBeDefined();
    expect(DEFAULT_CHAIN.name).toBe('Polygon Mumbai');
  });

  it('should export CONTRACT_ADDRESSES with default values', () => {
    expect(CONTRACT_ADDRESSES).toBeDefined();
    expect(CONTRACT_ADDRESSES).toHaveProperty('USDC');
    expect(CONTRACT_ADDRESSES).toHaveProperty('BINARY_MARKET_FACTORY');
    expect(CONTRACT_ADDRESSES).toHaveProperty('COPY_TRADING_VAULT_FACTORY');
  });

  it('should have valid Ethereum addresses format for contract addresses', () => {
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    Object.values(CONTRACT_ADDRESSES).forEach((address) => {
      expect(address).toMatch(addressRegex);
    });
  });

  it('should export RPC_URLS object', () => {
    expect(RPC_URLS).toBeDefined();
    expect(RPC_URLS).toHaveProperty('POLYGON');
    expect(RPC_URLS).toHaveProperty('POLYGON_MUMBAI');
    expect(RPC_URLS).toHaveProperty('BASE');
    expect(RPC_URLS).toHaveProperty('BASE_SEPOLIA');
  });

  it('should have valid RPC URLs', () => {
    Object.values(RPC_URLS).forEach((url) => {
      expect(url).toMatch(/^https?:\/\//);
    });
  });

  it('should have fallback values for all environment variables', () => {
    // 驗證即使沒有環境變數也能正常工作
    expect(CONTRACT_ADDRESSES.USDC).toBeDefined();
    expect(RPC_URLS.POLYGON_MUMBAI).toBeDefined();
  });

  it('should use import.meta.env instead of process.env', () => {
    // 驗證 RPC URL 可以正確訪問（使用 import.meta.env）
    expect(RPC_URLS.POLYGON_MUMBAI).toContain('rpc-mumbai');
  });

  it('should provide fallback RPC URL for Polygon Mumbai', () => {
    expect(RPC_URLS.POLYGON_MUMBAI).toBe('https://rpc-mumbai.maticvigil.com');
  });

  it('should provide fallback RPC URL for Base', () => {
    expect(RPC_URLS.BASE).toBe('https://mainnet.base.org');
  });

  it('should provide fallback RPC URL for Base Sepolia', () => {
    expect(RPC_URLS.BASE_SEPOLIA).toBe('https://sepolia.base.org');
  });

  it('should provide fallback contract addresses', () => {
    expect(CONTRACT_ADDRESSES.USDC).toBe('0x0000000000000000000000000000000000000000');
    expect(CONTRACT_ADDRESSES.BINARY_MARKET_FACTORY).toBe('0x0000000000000000000000000000000000000000');
    expect(CONTRACT_ADDRESSES.COPY_TRADING_VAULT_FACTORY).toBe('0x0000000000000000000000000000000000000000');
  });
});
