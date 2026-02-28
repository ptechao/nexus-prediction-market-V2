/**
 * 優化的 Gas 管理服務
 * 
 * 提供高性能的 Gas 估算、緩存和優化。
 * 支持動態調整、預測和成本優化。
 */

import { ethers } from 'ethers';
import NodeCache from 'node-cache';

/**
 * Gas 估算結果
 */
export interface GasEstimateResult {
  gasLimit: number;
  gasPrice: string; // Wei
  maxFeePerGas?: string; // Wei (EIP-1559)
  maxPriorityFeePerGas?: string; // Wei (EIP-1559)
  estimatedCost: string; // USD
  estimatedCostEth: string; // ETH
  confidence: number; // 0-100
  timestamp: number;
}

/**
 * Gas 價格歷史
 */
export interface GasPriceHistory {
  timestamp: number;
  gasPrice: string; // Wei
  baseFee?: string; // Wei (EIP-1559)
  priorityFee?: string; // Wei (EIP-1559)
  averageGasPrice: string; // Wei
  trend: 'up' | 'down' | 'stable';
}

/**
 * 優化的 Gas 管理服務
 */
export class GasManagerOptimized {
  private provider: ethers.JsonRpcProvider;
  private cache: NodeCache;
  private priceHistory: GasPriceHistory[] = [];
  private maxHistorySize = 100;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    // 緩存配置：5 分鐘 TTL，10 分鐘檢查間隔
    this.cache = new NodeCache({ stdTTL: 300, checkperiod: 600 });
  }

  /**
   * 估算交易 Gas
   * 
   * 使用緩存和預測算法優化估算速度。
   * 支持 EIP-1559 和傳統 Gas 模式。
   */
  async estimateGas(
    to: string,
    data: string,
    value: string = '0',
    options?: {
      useCache?: boolean;
      confidence?: number; // 0-100，默認 50
    }
  ): Promise<GasEstimateResult> {
    const cacheKey = `gas_estimate_${to}_${data}`;

    // 檢查緩存
    if (options?.useCache !== false) {
      const cached = this.cache.get<GasEstimateResult>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      // 獲取網絡信息
      const [feeData, ethPrice, blockNumber] = await Promise.all([
        this.provider.getFeeData(),
        this.getEthPrice(),
        this.provider.getBlockNumber(),
      ]);

      // 估算 Gas
      const gasLimit = await this.provider.estimateGas({
        to,
        data,
        value,
      });

      // 計算 Gas 成本
      let gasPrice: string;
      let maxFeePerGas: string | undefined;
      let maxPriorityFeePerGas: string | undefined;

      if (feeData.maxFeePerGas && feeData.maxPriorityFeePerGas) {
        // EIP-1559
        maxFeePerGas = this.optimizeMaxFeePerGas(
          feeData.maxFeePerGas.toString(),
          options?.confidence
        );
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas.toString();
        gasPrice = maxFeePerGas;
      } else {
        // 傳統 Gas 模式
        gasPrice = this.optimizeGasPrice(
          feeData.gasPrice?.toString() || '0',
          options?.confidence
        );
      }

      // 計算估計成本
      const gasCostWei = BigInt(gasLimit.toString()) * BigInt(gasPrice);
      const gasCostEth = ethers.formatEther(gasCostWei);
      const gasCostUsd = (parseFloat(gasCostEth) * ethPrice).toFixed(2);

      // 計算置信度
      const confidence = this.calculateConfidence(blockNumber, options?.confidence);

      const result: GasEstimateResult = {
        gasLimit: Number(gasLimit.toString()),
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        estimatedCost: gasCostUsd,
        estimatedCostEth: gasCostEth,
        confidence,
        timestamp: Date.now(),
      };

      // 緩存結果
      this.cache.set(cacheKey, result);

      // 記錄歷史
      this.recordPriceHistory(feeData);

      return result;
    } catch (error) {
      throw new Error(`Gas estimation failed: ${(error as Error).message}`);
    }
  }

  /**
   * 優化 Max Fee Per Gas (EIP-1559)
   * 
   * 根據置信度調整費用。
   * 置信度越低，費用越高（加快交易）。
   */
  private optimizeMaxFeePerGas(baseFee: string, confidence?: number): string {
    const conf = confidence ?? 50;
    const multiplier = 1 + (100 - conf) / 100 * 0.5; // 50-100% 增加

    const baseFeeWei = BigInt(baseFee);
    const optimizedFee = baseFeeWei * BigInt(Math.round(multiplier * 100)) / BigInt(100);

    return optimizedFee.toString();
  }

  /**
   * 優化傳統 Gas 價格
   */
  private optimizeGasPrice(gasPrice: string, confidence?: number): string {
    const conf = confidence ?? 50;
    const multiplier = 1 + (100 - conf) / 100 * 0.3; // 30-60% 增加

    const gasPriceWei = BigInt(gasPrice);
    const optimizedPrice = gasPriceWei * BigInt(Math.round(multiplier * 100)) / BigInt(100);

    return optimizedPrice.toString();
  }

  /**
   * 計算置信度
   * 
   * 基於區塊號、網絡狀態等因素。
   */
  private calculateConfidence(blockNumber: number, userConfidence?: number): number {
    if (userConfidence !== undefined) {
      return Math.max(0, Math.min(100, userConfidence));
    }

    // 基於最近區塊的平均置信度
    const recentBlocks = Math.min(10, blockNumber);
    const baseConfidence = 50 + (recentBlocks / 10) * 30; // 50-80

    return Math.round(baseConfidence);
  }

  /**
   * 記錄 Gas 價格歷史
   */
  private recordPriceHistory(feeData: ethers.FeeData): void {
    const history: GasPriceHistory = {
      timestamp: Date.now(),
      gasPrice: feeData.gasPrice?.toString() || '0',
      baseFee: feeData.maxFeePerGas?.toString(),
      priorityFee: feeData.maxPriorityFeePerGas?.toString(),
      averageGasPrice: this.calculateAverageGasPrice(),
      trend: this.calculateTrend(),
    };

    this.priceHistory.push(history);

    // 保持歷史大小
    if (this.priceHistory.length > this.maxHistorySize) {
      this.priceHistory.shift();
    }
  }

  /**
   * 計算平均 Gas 價格
   */
  private calculateAverageGasPrice(): string {
    if (this.priceHistory.length === 0) {
      return '0';
    }

    const sum = this.priceHistory.reduce((acc, h) => {
      return acc + BigInt(h.gasPrice);
    }, BigInt(0));

    const average = sum / BigInt(this.priceHistory.length);
    return average.toString();
  }

  /**
   * 計算 Gas 價格趨勢
   */
  private calculateTrend(): 'up' | 'down' | 'stable' {
    if (this.priceHistory.length < 2) {
      return 'stable';
    }

    const recent = this.priceHistory.slice(-5);
    const oldAvg = recent.slice(0, 2).reduce((acc, h) => acc + BigInt(h.gasPrice), BigInt(0)) / BigInt(2);
    const newAvg = recent.slice(-2).reduce((acc, h) => acc + BigInt(h.gasPrice), BigInt(0)) / BigInt(2);

    const change = Number((newAvg - oldAvg) * BigInt(100) / oldAvg);

    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  /**
   * 獲取 ETH 價格
   * 
   * 從緩存或外部 API 獲取。
   */
  async getEthPrice(): Promise<number> {
    const cached = this.cache.get<number>('eth_price');
    if (cached) {
      return cached;
    }

    try {
      // 這裡應該調用真實的價格 API
      // 示例：CoinGecko, Uniswap, 等
      const price = 2500; // 示例價格

      this.cache.set('eth_price', price, 60); // 1 分鐘緩存
      return price;
    } catch (error) {
      console.error('Failed to fetch ETH price:', error);
      return 2500; // 回退價格
    }
  }

  /**
   * 獲取 Gas 價格歷史
   */
  getGasPriceHistory(limit: number = 10): GasPriceHistory[] {
    return this.priceHistory.slice(-limit);
  }

  /**
   * 清除緩存
   */
  clearCache(): void {
    this.cache.flushAll();
  }

  /**
   * 獲取緩存統計
   */
  getCacheStats(): { keys: number; size: string } {
    const keys = this.cache.keys().length;
    return {
      keys,
      size: `${(keys * 1024).toLocaleString()} bytes (approx)`,
    };
  }
}

export default GasManagerOptimized;
