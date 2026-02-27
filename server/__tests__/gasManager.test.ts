/**
 * Gas 管理服務測試
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GasManager, createGasManager } from '../services/gasManager';
import { ethers } from 'ethers';

// Mock Provider
const mockProvider = {
  getGasPrice: vi.fn(),
  getFeeData: vi.fn(),
  estimateGas: vi.fn(),
} as any;

describe('GasManager', () => {
  let gasManager: GasManager;

  beforeEach(() => {
    gasManager = new GasManager(mockProvider, {
      priceMultiplier: 1.2,
      limitMultiplier: 1.3,
      maxGasPriceGwei: 500,
      minGasPriceGwei: 1,
      ethPriceUSD: 2000,
    });
  });

  describe('getGasPrice', () => {
    it('should return gas price with multiplier applied', async () => {
      const baseGasPrice = BigInt('20000000000'); // 20 Gwei
      mockProvider.getGasPrice.mockResolvedValue(baseGasPrice);

      const gasPrice = await gasManager.getGasPrice();

      // 20 Gwei * 1.2 = 24 Gwei
      expect(gasPrice).toBe(BigInt('24000000000'));
    });

    it('should handle gas price errors gracefully', async () => {
      mockProvider.getGasPrice.mockRejectedValue(new Error('RPC error'));

      await expect(gasManager.getGasPrice()).rejects.toThrow();
    });
  });

  describe('getEIP1559Fees', () => {
    it('should return EIP-1559 fees with multiplier applied', async () => {
      const feeData = {
        maxFeePerGas: BigInt('30000000000'), // 30 Gwei
        maxPriorityFeePerGas: BigInt('2000000000'), // 2 Gwei
      };
      mockProvider.getFeeData.mockResolvedValue(feeData);

      const fees = await gasManager.getEIP1559Fees();

      // 30 Gwei * 1.2 = 36 Gwei
      // 2 Gwei * 1.2 = 2.4 Gwei
      expect(fees.maxFeePerGas).toBe(BigInt('36000000000'));
      expect(fees.maxPriorityFeePerGas).toBe(BigInt('2400000000'));
    });

    it('should throw error if fee data is missing', async () => {
      mockProvider.getFeeData.mockResolvedValue({
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
      });

      await expect(gasManager.getEIP1559Fees()).rejects.toThrow(
        'Failed to get EIP-1559 fees'
      );
    });
  });

  describe('estimateTransactionGas', () => {
    it('should estimate transaction gas with multiplier applied', async () => {
      const baseGasEstimate = BigInt('100000');
      mockProvider.estimateGas.mockResolvedValue(baseGasEstimate);

      const transaction = { to: '0x...', data: '0x...' };
      const gasLimit = await gasManager.estimateTransactionGas(transaction);

      // 100000 * 1.3 = 130000
      expect(gasLimit).toBe(BigInt('130000'));
    });

    it('should return default gas limit on error', async () => {
      mockProvider.estimateGas.mockRejectedValue(new Error('Estimation failed'));

      const transaction = { to: '0x...', data: '0x...' };
      const gasLimit = await gasManager.estimateTransactionGas(transaction);

      expect(gasLimit).toBe(BigInt('300000'));
    });
  });

  describe('estimateGas', () => {
    it('should return complete gas estimate', async () => {
      mockProvider.getGasPrice.mockResolvedValue(BigInt('20000000000'));
      mockProvider.getFeeData.mockResolvedValue({
        maxFeePerGas: BigInt('30000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
      });
      mockProvider.estimateGas.mockResolvedValue(BigInt('100000'));

      const transaction = { to: '0x...', data: '0x...' };
      const estimate = await gasManager.estimateGas(transaction);

      expect(estimate.gasLimit).toBe(BigInt('130000'));
      expect(estimate.maxFeePerGas).toBe(BigInt('36000000000'));
      expect(estimate.maxPriorityFeePerGas).toBe(BigInt('2400000000'));
      expect(estimate.totalCost).toBeGreaterThan(BigInt(0));
      expect(estimate.totalCostInUSD).toBeGreaterThan(0);
    });
  });

  describe('isWithinBudget', () => {
    it('should return true if cost is within budget', () => {
      const estimate = {
        gasLimit: BigInt('100000'),
        gasPrice: BigInt('20000000000'),
        maxFeePerGas: BigInt('30000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
        totalCost: BigInt('3000000000000000'), // 0.003 ETH
        totalCostInUSD: 6, // 0.003 ETH * 2000 = 6 USD
      };

      expect(gasManager.isWithinBudget(estimate, 10)).toBe(true);
    });

    it('should return false if cost exceeds budget', () => {
      const estimate = {
        gasLimit: BigInt('100000'),
        gasPrice: BigInt('20000000000'),
        maxFeePerGas: BigInt('30000000000'),
        maxPriorityFeePerGas: BigInt('2000000000'),
        totalCost: BigInt('3000000000000000'),
        totalCostInUSD: 6,
      };

      expect(gasManager.isWithinBudget(estimate, 5)).toBe(false);
    });
  });

  describe('isValidGasPrice', () => {
    it('should return true for valid gas price', () => {
      expect(gasManager.isValidGasPrice(50)).toBe(true);
      expect(gasManager.isValidGasPrice(1)).toBe(true);
      expect(gasManager.isValidGasPrice(500)).toBe(true);
    });

    it('should return false for invalid gas price', () => {
      expect(gasManager.isValidGasPrice(0.5)).toBe(false);
      expect(gasManager.isValidGasPrice(501)).toBe(false);
    });
  });

  describe('setEthPrice', () => {
    it('should update ETH price', () => {
      gasManager.setEthPrice(3000);
      const config = gasManager.getConfig();
      expect(config.ethPriceUSD).toBe(3000);
    });
  });

  describe('getConfig', () => {
    it('should return current configuration', () => {
      const config = gasManager.getConfig();
      expect(config.priceMultiplier).toBe(1.2);
      expect(config.limitMultiplier).toBe(1.3);
      expect(config.maxGasPriceGwei).toBe(500);
      expect(config.minGasPriceGwei).toBe(1);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      gasManager.updateConfig({
        priceMultiplier: 1.5,
        maxGasPriceGwei: 600,
      });

      const config = gasManager.getConfig();
      expect(config.priceMultiplier).toBe(1.5);
      expect(config.maxGasPriceGwei).toBe(600);
      expect(config.limitMultiplier).toBe(1.3); // 未改變
    });
  });

  describe('createGasManager', () => {
    it('should create GasManager instance', () => {
      const manager = createGasManager(mockProvider, {
        priceMultiplier: 1.5,
      });

      expect(manager).toBeInstanceOf(GasManager);
      expect(manager.getConfig().priceMultiplier).toBe(1.5);
    });
  });
});
