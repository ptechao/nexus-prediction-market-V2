/**
 * 區塊鏈部署服務
 * 
 * 用於部署智能合約到以太坊區塊鏈。
 * 支持 BinaryMarket 和 CopyTradingVault 合約的部署。
 * 提供交易簽署、確認等待、失敗重試等功能。
 */

import { ethers, Signer, Provider, TransactionResponse } from 'ethers';
import { GasManager } from './gasManager';
import BinaryMarketABI from '../contracts/abis/BinaryMarket.json';
import CopyTradingVaultABI from '../contracts/abis/CopyTradingVault.json';

/**
 * 部署配置
 */
export interface DeploymentConfig {
  timeoutSeconds: number;
  confirmationBlocks: number;
  maxRetries: number;
  retryDelayMs: number;
  gasManager: GasManager;
}

/**
 * 部署結果
 */
export interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: bigint;
  deploymentTime: number;
  confirmations: number;
}

/**
 * BinaryMarket 部署參數
 */
export interface BinaryMarketDeployParams {
  title: string;
  description: string;
  endTime: number;
  oracleAddress: string;
  initialLiquidity: bigint;
}

/**
 * CopyTradingVault 部署參數
 */
export interface CopyTradingVaultDeployParams {
  leader: string;
  name: string;
  performanceFee: number;
  managementFee: number;
}

/**
 * 區塊鏈部署服務類
 */
export class BlockchainDeploymentService {
  private signer: Signer;
  private provider: Provider;
  private config: DeploymentConfig;

  constructor(signer: Signer, provider: Provider, config: DeploymentConfig) {
    this.signer = signer;
    this.provider = provider;
    this.config = config;
  }

  /**
   * 部署 BinaryMarket 合約
   * 
   * @param params - 部署參數
   * @returns 部署結果
   */
  async deployBinaryMarketContract(
    params: BinaryMarketDeployParams
  ): Promise<DeploymentResult> {
    const startTime = Date.now();

    try {
      // 驗證參數
      this.validateBinaryMarketParams(params);

      // 創建合約工廠
      const factory = new ethers.ContractFactory(
        BinaryMarketABI.abi,
        BinaryMarketABI.bytecode || '0x',
        this.signer
      );

      // 估算 Gas
      const gasEstimate = await this.config.gasManager.estimateGas({
        data: factory.getDeployTransaction(
          params.title,
          params.description,
          params.endTime,
          params.oracleAddress,
          params.initialLiquidity
        ).data,
      });

      // 部署合約
      const contract = await factory.deploy(
        params.title,
        params.description,
        params.endTime,
        params.oracleAddress,
        params.initialLiquidity,
        {
          gasLimit: gasEstimate.gasLimit,
          maxFeePerGas: gasEstimate.maxFeePerGas,
          maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
        }
      );

      // 等待確認
      const receipt = await this.waitForConfirmation(contract.deploymentTransaction()!);

      if (!receipt) {
        throw new Error('Deployment failed: no receipt received');
      }

      const deploymentTime = Date.now() - startTime;

      return {
        contractAddress: contract.address,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        deploymentTime,
        confirmations: receipt.confirmations || 0,
      };
    } catch (error) {
      console.error('BinaryMarket deployment failed:', error);
      throw error;
    }
  }

  /**
   * 部署 CopyTradingVault 合約
   * 
   * @param params - 部署參數
   * @returns 部署結果
   */
  async deployCopyTradingVaultContract(
    params: CopyTradingVaultDeployParams
  ): Promise<DeploymentResult> {
    const startTime = Date.now();

    try {
      // 驗證參數
      this.validateCopyTradingVaultParams(params);

      // 創建合約工廠
      const factory = new ethers.ContractFactory(
        CopyTradingVaultABI.abi,
        CopyTradingVaultABI.bytecode || '0x',
        this.signer
      );

      // 估算 Gas
      const gasEstimate = await this.config.gasManager.estimateGas({
        data: factory.getDeployTransaction(
          params.leader,
          params.name,
          params.performanceFee,
          params.managementFee
        ).data,
      });

      // 部署合約
      const contract = await factory.deploy(
        params.leader,
        params.name,
        params.performanceFee,
        params.managementFee,
        {
          gasLimit: gasEstimate.gasLimit,
          maxFeePerGas: gasEstimate.maxFeePerGas,
          maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
        }
      );

      // 等待確認
      const receipt = await this.waitForConfirmation(contract.deploymentTransaction()!);

      if (!receipt) {
        throw new Error('Deployment failed: no receipt received');
      }

      const deploymentTime = Date.now() - startTime;

      return {
        contractAddress: contract.address,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed,
        deploymentTime,
        confirmations: receipt.confirmations || 0,
      };
    } catch (error) {
      console.error('CopyTradingVault deployment failed:', error);
      throw error;
    }
  }

  /**
   * 等待交易確認
   * 
   * @param tx - 交易對象
   * @returns 交易收據
   */
  private async waitForConfirmation(tx: TransactionResponse): Promise<any> {
    const startTime = Date.now();
    const timeout = this.config.timeoutSeconds * 1000;

    while (Date.now() - startTime < timeout) {
      const receipt = await this.provider.getTransactionReceipt(tx.hash);

      if (receipt && receipt.confirmations! >= this.config.confirmationBlocks) {
        return receipt;
      }

      await this.sleep(1000);
    }

    throw new Error(`Deployment timeout after ${this.config.timeoutSeconds} seconds`);
  }

  /**
   * 重試失敗的部署
   * 
   * @param deployFn - 部署函數
   * @returns 部署結果
   */
  async retryDeployment(
    deployFn: () => Promise<DeploymentResult>
  ): Promise<DeploymentResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        console.log(`Deployment attempt ${attempt}/${this.config.maxRetries}`);
        return await deployFn();
      } catch (error) {
        lastError = error as Error;
        console.error(`Deployment attempt ${attempt} failed:`, error);

        if (attempt < this.config.maxRetries) {
          const delay = this.config.retryDelayMs * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Deployment failed after ${this.config.maxRetries} attempts: ${lastError?.message}`
    );
  }

  /**
   * 驗證 BinaryMarket 部署參數
   * 
   * @param params - 部署參數
   */
  private validateBinaryMarketParams(params: BinaryMarketDeployParams): void {
    if (!params.title || params.title.trim().length === 0) {
      throw new Error('Invalid title: must not be empty');
    }

    if (!params.description || params.description.trim().length === 0) {
      throw new Error('Invalid description: must not be empty');
    }

    if (params.endTime <= Date.now() / 1000) {
      throw new Error('Invalid endTime: must be in the future');
    }

    if (!ethers.isAddress(params.oracleAddress)) {
      throw new Error('Invalid oracleAddress: must be a valid Ethereum address');
    }

    if (params.initialLiquidity <= BigInt(0)) {
      throw new Error('Invalid initialLiquidity: must be greater than 0');
    }
  }

  /**
   * 驗證 CopyTradingVault 部署參數
   * 
   * @param params - 部署參數
   */
  private validateCopyTradingVaultParams(
    params: CopyTradingVaultDeployParams
  ): void {
    if (!ethers.isAddress(params.leader)) {
      throw new Error('Invalid leader: must be a valid Ethereum address');
    }

    if (!params.name || params.name.trim().length === 0) {
      throw new Error('Invalid name: must not be empty');
    }

    if (params.performanceFee < 0 || params.performanceFee > 100) {
      throw new Error('Invalid performanceFee: must be between 0 and 100');
    }

    if (params.managementFee < 0 || params.managementFee > 100) {
      throw new Error('Invalid managementFee: must be between 0 and 100');
    }
  }

  /**
   * 睡眠函數
   * 
   * @param ms - 毫秒數
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 獲取部署配置
   * 
   * @returns 部署配置
   */
  getConfig(): DeploymentConfig {
    return { ...this.config };
  }

  /**
   * 更新部署配置
   * 
   * @param config - 新配置
   */
  updateConfig(config: Partial<DeploymentConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * 創建區塊鏈部署服務實例
 * 
 * @param signer - 簽署者
 * @param provider - 提供商
 * @param config - 部署配置
 * @returns 部署服務實例
 */
export function createBlockchainDeploymentService(
  signer: Signer,
  provider: Provider,
  config: DeploymentConfig
): BlockchainDeploymentService {
  return new BlockchainDeploymentService(signer, provider, config);
}

export default {
  BlockchainDeploymentService,
  createBlockchainDeploymentService,
};
