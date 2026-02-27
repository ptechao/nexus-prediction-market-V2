/**
 * 部署驗證服務
 * 
 * 用於驗證部署參數和合約狀態。
 * 提供參數驗證、Oracle 白名單檢查、合約字節碼驗證等功能。
 */

import { ethers, Provider } from 'ethers';

/**
 * 驗證結果
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Oracle 配置
 */
export interface OracleConfig {
  whitelist: string[];
  maxAge: number; // 秒
}

/**
 * 部署驗證服務類
 */
export class DeploymentValidator {
  private provider: Provider;
  private oracleConfig: OracleConfig;

  constructor(provider: Provider, oracleConfig: OracleConfig) {
    this.provider = provider;
    this.oracleConfig = oracleConfig;
  }

  /**
   * 驗證部署參數
   * 
   * @param params - 部署參數
   * @returns 驗證結果
   */
  validateDeploymentParams(params: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 驗證標題
    if (!params.title || typeof params.title !== 'string') {
      errors.push('Invalid title: must be a non-empty string');
    } else if (params.title.length > 256) {
      warnings.push('Title is very long (> 256 characters)');
    }

    // 驗證描述
    if (!params.description || typeof params.description !== 'string') {
      errors.push('Invalid description: must be a non-empty string');
    } else if (params.description.length > 1024) {
      warnings.push('Description is very long (> 1024 characters)');
    }

    // 驗證結束時間
    if (!params.endTime || typeof params.endTime !== 'number') {
      errors.push('Invalid endTime: must be a number');
    } else {
      const now = Math.floor(Date.now() / 1000);
      if (params.endTime <= now) {
        errors.push('Invalid endTime: must be in the future');
      } else if (params.endTime - now < 3600) {
        warnings.push('endTime is less than 1 hour away');
      }
    }

    // 驗證 Oracle 地址
    if (params.oracleAddress) {
      const oracleValidation = this.validateOracleAddress(params.oracleAddress);
      errors.push(...oracleValidation.errors);
      warnings.push(...oracleValidation.warnings);
    } else {
      errors.push('Missing oracleAddress');
    }

    // 驗證初始流動性
    if (params.initialLiquidity !== undefined) {
      if (typeof params.initialLiquidity !== 'bigint' && typeof params.initialLiquidity !== 'number') {
        errors.push('Invalid initialLiquidity: must be a number or bigint');
      } else if (params.initialLiquidity <= 0) {
        errors.push('Invalid initialLiquidity: must be greater than 0');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 驗證 Oracle 地址
   * 
   * @param address - Oracle 地址
   * @returns 驗證結果
   */
  validateOracleAddress(address: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 驗證地址格式
    if (!ethers.isAddress(address)) {
      errors.push('Invalid Oracle address: not a valid Ethereum address');
      return { isValid: false, errors, warnings };
    }

    // 檢查白名單
    const isWhitelisted = this.oracleConfig.whitelist.some(
      (whitelistedAddress) =>
        whitelistedAddress.toLowerCase() === address.toLowerCase()
    );

    if (!isWhitelisted) {
      errors.push(
        `Oracle address not in whitelist. Whitelisted addresses: ${this.oracleConfig.whitelist.join(', ')}`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 驗證合約字節碼
   * 
   * @param address - 合約地址
   * @returns 驗證結果
   */
  async validateContractBytecode(address: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 驗證地址格式
    if (!ethers.isAddress(address)) {
      errors.push('Invalid contract address: not a valid Ethereum address');
      return { isValid: false, errors, warnings };
    }

    try {
      // 獲取合約字節碼
      const bytecode = await this.provider.getCode(address);

      if (bytecode === '0x') {
        errors.push('Contract not deployed at this address');
      } else if (bytecode.length < 100) {
        warnings.push('Contract bytecode is very short, may be a proxy or minimal contract');
      }
    } catch (error) {
      errors.push(`Failed to verify contract bytecode: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 驗證交易
   * 
   * @param txHash - 交易哈希
   * @returns 驗證結果
   */
  async validateTransaction(txHash: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 獲取交易
      const tx = await this.provider.getTransaction(txHash);

      if (!tx) {
        errors.push('Transaction not found');
        return { isValid: false, errors, warnings };
      }

      // 獲取交易收據
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        warnings.push('Transaction not yet confirmed');
      } else if (receipt.status === 0) {
        errors.push('Transaction failed (status = 0)');
      }

      // 檢查 Gas 使用
      if (receipt && receipt.gasUsed) {
        const gasUsedPercent = (Number(receipt.gasUsed) / Number(receipt.gasLimit)) * 100;
        if (gasUsedPercent > 90) {
          warnings.push(`High gas usage: ${gasUsedPercent.toFixed(2)}% of limit`);
        }
      }
    } catch (error) {
      errors.push(`Failed to validate transaction: ${(error as Error).message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 驗證 Gas 預算
   * 
   * @param gasLimit - Gas 限額
   * @param gasPrice - Gas 價格（Wei）
   * @param maxBudgetUSD - 最大預算（USD）
   * @param ethPriceUSD - ETH 價格（USD）
   * @returns 驗證結果
   */
  validateGasBudget(
    gasLimit: bigint,
    gasPrice: bigint,
    maxBudgetUSD: number,
    ethPriceUSD: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const totalCost = gasLimit * gasPrice;
    const totalCostInETH = Number(ethers.formatEther(totalCost));
    const totalCostInUSD = totalCostInETH * ethPriceUSD;

    if (totalCostInUSD > maxBudgetUSD) {
      errors.push(
        `Gas cost exceeds budget: $${totalCostInUSD.toFixed(2)} > $${maxBudgetUSD}`
      );
    } else if (totalCostInUSD > maxBudgetUSD * 0.8) {
      warnings.push(
        `Gas cost is high: $${totalCostInUSD.toFixed(2)} (80% of budget)`
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * 設置 Oracle 白名單
   * 
   * @param whitelist - 白名單地址數組
   */
  setOracleWhitelist(whitelist: string[]): void {
    this.oracleConfig.whitelist = whitelist.map((addr) => addr.toLowerCase());
  }

  /**
   * 獲取 Oracle 白名單
   * 
   * @returns 白名單地址數組
   */
  getOracleWhitelist(): string[] {
    return [...this.oracleConfig.whitelist];
  }

  /**
   * 添加 Oracle 地址到白名單
   * 
   * @param address - Oracle 地址
   */
  addOracleToWhitelist(address: string): void {
    if (ethers.isAddress(address)) {
      const lowerAddress = address.toLowerCase();
      if (!this.oracleConfig.whitelist.includes(lowerAddress)) {
        this.oracleConfig.whitelist.push(lowerAddress);
      }
    }
  }

  /**
   * 從白名單中移除 Oracle 地址
   * 
   * @param address - Oracle 地址
   */
  removeOracleFromWhitelist(address: string): void {
    const lowerAddress = address.toLowerCase();
    this.oracleConfig.whitelist = this.oracleConfig.whitelist.filter(
      (addr) => addr !== lowerAddress
    );
  }
}

/**
 * 創建部署驗證服務實例
 * 
 * @param provider - 以太坊提供商
 * @param oracleConfig - Oracle 配置
 * @returns 驗證服務實例
 */
export function createDeploymentValidator(
  provider: Provider,
  oracleConfig: OracleConfig
): DeploymentValidator {
  return new DeploymentValidator(provider, oracleConfig);
}

export default {
  DeploymentValidator,
  createDeploymentValidator,
};
