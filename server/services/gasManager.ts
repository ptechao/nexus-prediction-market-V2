/**
 * Gas 管理服務
 * 
 * 用於管理以太坊交易的 Gas 價格和 Gas 限額。
 * 提供 Gas 估算、預算檢查和動態 Gas 管理功能。
 */

import { ethers, Provider, Contract } from 'ethers';

/**
 * Gas 估算結果
 */
export interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  totalCost: bigint;
  totalCostInUSD: number;
}

/**
 * Gas 配置
 */
export interface GasConfig {
  priceMultiplier: number;
  limitMultiplier: number;
  maxGasPriceGwei: number;
  minGasPriceGwei: number;
  ethPriceUSD: number;
}

/**
 * Gas 管理服務類
 */
export class GasManager {
  private provider: Provider;
  private config: GasConfig;

  constructor(provider: Provider, config: Partial<GasConfig> = {}) {
    this.provider = provider;
    this.config = {
      priceMultiplier: config.priceMultiplier || 1.2,
      limitMultiplier: config.limitMultiplier || 1.3,
      maxGasPriceGwei: config.maxGasPriceGwei || 500,
      minGasPriceGwei: config.minGasPriceGwei || 1,
      ethPriceUSD: config.ethPriceUSD || 2000, // 默認 ETH 價格
    };
  }

  /**
   * 獲取當前 Gas 價格
   * 
   * @returns Gas 價格（Wei）
   */
  async getGasPrice(): Promise<bigint> {
    const gasPrice = await this.provider.getGasPrice();
    return this.applyMultiplier(gasPrice, this.config.priceMultiplier);
  }

  /**
   * 獲取 EIP-1559 費用
   * 
   * @returns EIP-1559 費用
   */
  async getEIP1559Fees(): Promise<{
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
  }> {
    const feeData = await this.provider.getFeeData();

    if (!feeData.maxFeePerGas || !feeData.maxPriorityFeePerGas) {
      throw new Error('Failed to get EIP-1559 fees');
    }

    return {
      maxFeePerGas: this.applyMultiplier(
        feeData.maxFeePerGas,
        this.config.priceMultiplier
      ),
      maxPriorityFeePerGas: this.applyMultiplier(
        feeData.maxPriorityFeePerGas,
        this.config.priceMultiplier
      ),
    };
  }

  /**
   * 估算合約調用的 Gas
   * 
   * @param contract - 合約實例
   * @param functionName - 函數名稱
   * @param args - 函數參數
   * @returns Gas 限額
   */
  async estimateContractGas(
    contract: Contract,
    functionName: string,
    args: any[] = []
  ): Promise<bigint> {
    try {
      const gasEstimate = await contract[functionName].estimateGas(...args);
      return this.applyMultiplier(gasEstimate, this.config.limitMultiplier);
    } catch (error) {
      console.error(`Failed to estimate gas for ${functionName}:`, error);
      // 返回默認值
      return BigInt(300000);
    }
  }

  /**
   * 估算交易的 Gas
   * 
   * @param transaction - 交易對象
   * @returns Gas 限額
   */
  async estimateTransactionGas(transaction: any): Promise<bigint> {
    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      return this.applyMultiplier(gasEstimate, this.config.limitMultiplier);
    } catch (error) {
      console.error('Failed to estimate transaction gas:', error);
      // 返回默認值
      return BigInt(300000);
    }
  }

  /**
   * 完整的 Gas 估算
   * 
   * @param transaction - 交易對象
   * @returns Gas 估算結果
   */
  async estimateGas(transaction: any): Promise<GasEstimate> {
    const gasLimit = await this.estimateTransactionGas(transaction);
    const feeData = await this.getEIP1559Fees();

    const totalCost = gasLimit * feeData.maxFeePerGas;
    const totalCostInUSD = Number(ethers.formatEther(totalCost)) * this.config.ethPriceUSD;

    return {
      gasLimit,
      gasPrice: await this.getGasPrice(),
      maxFeePerGas: feeData.maxFeePerGas,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
      totalCost,
      totalCostInUSD,
    };
  }

  /**
   * 驗證 Gas 預算
   * 
   * @param gasEstimate - Gas 估算
   * @param maxBudgetUSD - 最大預算（USD）
   * @returns 是否在預算內
   */
  isWithinBudget(gasEstimate: GasEstimate, maxBudgetUSD: number): boolean {
    return gasEstimate.totalCostInUSD <= maxBudgetUSD;
  }

  /**
   * 驗證 Gas 價格
   * 
   * @param gasPrice - Gas 價格（Gwei）
   * @returns 是否在允許範圍內
   */
  isValidGasPrice(gasPrice: number): boolean {
    return (
      gasPrice >= this.config.minGasPriceGwei &&
      gasPrice <= this.config.maxGasPriceGwei
    );
  }

  /**
   * 應用乘數
   * 
   * @param value - 原始值
   * @param multiplier - 乘數
   * @returns 應用乘數後的值
   */
  private applyMultiplier(value: bigint, multiplier: number): bigint {
    const multiplied = Number(value) * multiplier;
    return BigInt(Math.ceil(multiplied));
  }

  /**
   * 設置 ETH 價格
   * 
   * @param price - ETH 價格（USD）
   */
  setEthPrice(price: number): void {
    this.config.ethPriceUSD = price;
  }

  /**
   * 獲取配置
   * 
   * @returns 當前配置
   */
  getConfig(): GasConfig {
    return { ...this.config };
  }

  /**
   * 更新配置
   * 
   * @param config - 新配置
   */
  updateConfig(config: Partial<GasConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * 創建 Gas 管理器實例
 * 
 * @param provider - 以太坊提供商
 * @param config - Gas 配置
 * @returns Gas 管理器實例
 */
export function createGasManager(
  provider: Provider,
  config?: Partial<GasConfig>
): GasManager {
  return new GasManager(provider, config);
}

export default {
  GasManager,
  createGasManager,
};
