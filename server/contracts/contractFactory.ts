/**
 * 合約工廠 - 用於創建合約實例
 * 
 * 此模塊提供了創建和管理以太坊智能合約實例的工廠函數。
 * 支持 BinaryMarket 和 CopyTradingVault 合約。
 */

import { ethers, Contract, Provider, Signer } from 'ethers';
import BinaryMarketABI from './abis/BinaryMarket.json';
import CopyTradingVaultABI from './abis/CopyTradingVault.json';

/**
 * 合約類型定義
 */
export interface ContractInstance {
  address: string;
  contract: Contract;
  abi: any[];
}

/**
 * BinaryMarket 合約實例
 */
export interface BinaryMarketContract extends Contract {
  placeBet(outcome: boolean, options?: any): Promise<any>;
  resolveMarket(outcome: boolean): Promise<any>;
  claimWinnings(): Promise<any>;
  getMarketInfo(): Promise<any>;
  getOdds(): Promise<any>;
  getTraderBets(trader: string): Promise<any>;
}

/**
 * CopyTradingVault 合約實例
 */
export interface CopyTradingVaultContract extends Contract {
  deposit(options?: any): Promise<any>;
  withdraw(shares: number): Promise<any>;
  executeTrade(market: string, outcome: boolean, amount: number): Promise<any>;
  getVaultInfo(): Promise<any>;
  getFollowerInfo(follower: string): Promise<any>;
  sharesToAssets(shares: number): Promise<any>;
}

/**
 * 創建 BinaryMarket 合約實例
 * 
 * @param contractAddress - 合約地址
 * @param signerOrProvider - 簽署者或提供商
 * @returns BinaryMarket 合約實例
 */
export function createBinaryMarketContract(
  contractAddress: string,
  signerOrProvider: Signer | Provider
): BinaryMarketContract {
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  return new Contract(
    contractAddress,
    BinaryMarketABI.abi,
    signerOrProvider
  ) as BinaryMarketContract;
}

/**
 * 創建 CopyTradingVault 合約實例
 * 
 * @param contractAddress - 合約地址
 * @param signerOrProvider - 簽署者或提供商
 * @returns CopyTradingVault 合約實例
 */
export function createCopyTradingVaultContract(
  contractAddress: string,
  signerOrProvider: Signer | Provider
): CopyTradingVaultContract {
  if (!ethers.isAddress(contractAddress)) {
    throw new Error(`Invalid contract address: ${contractAddress}`);
  }

  return new Contract(
    contractAddress,
    CopyTradingVaultABI.abi,
    signerOrProvider
  ) as CopyTradingVaultContract;
}

/**
 * 獲取合約 ABI
 * 
 * @param contractType - 合約類型 ('BinaryMarket' | 'CopyTradingVault')
 * @returns 合約 ABI
 */
export function getContractABI(contractType: 'BinaryMarket' | 'CopyTradingVault'): any[] {
  switch (contractType) {
    case 'BinaryMarket':
      return BinaryMarketABI.abi;
    case 'CopyTradingVault':
      return CopyTradingVaultABI.abi;
    default:
      throw new Error(`Unknown contract type: ${contractType}`);
  }
}

/**
 * 驗證合約地址
 * 
 * @param address - 地址
 * @returns 是否是有效的以太坊地址
 */
export function isValidContractAddress(address: string): boolean {
  return ethers.isAddress(address);
}

/**
 * 獲取合約字節碼
 * 
 * @param provider - 以太坊提供商
 * @param address - 合約地址
 * @returns 合約字節碼
 */
export async function getContractBytecode(
  provider: Provider,
  address: string
): Promise<string> {
  if (!isValidContractAddress(address)) {
    throw new Error(`Invalid contract address: ${address}`);
  }

  return provider.getCode(address);
}

/**
 * 驗證合約是否已部署
 * 
 * @param provider - 以太坊提供商
 * @param address - 合約地址
 * @returns 合約是否已部署
 */
export async function isContractDeployed(
  provider: Provider,
  address: string
): Promise<boolean> {
  if (!isValidContractAddress(address)) {
    return false;
  }

  const bytecode = await getContractBytecode(provider, address);
  return bytecode !== '0x';
}

/**
 * 獲取合約部署區塊
 * 
 * @param provider - 以太坊提供商
 * @param address - 合約地址
 * @returns 部署區塊號
 */
export async function getContractDeploymentBlock(
  provider: Provider,
  address: string
): Promise<number | null> {
  if (!isValidContractAddress(address)) {
    throw new Error(`Invalid contract address: ${address}`);
  }

  // 通過二分查找找到部署區塊
  let low = 0;
  let high = await provider.getBlockNumber();

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const bytecode = await provider.getCode(address, mid);

    if (bytecode === '0x') {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low <= await provider.getBlockNumber() ? low : null;
}

/**
 * 批量創建合約實例
 * 
 * @param contracts - 合約配置數組
 * @param signerOrProvider - 簽署者或提供商
 * @returns 合約實例數組
 */
export function createMultipleContracts(
  contracts: Array<{
    type: 'BinaryMarket' | 'CopyTradingVault';
    address: string;
  }>,
  signerOrProvider: Signer | Provider
): ContractInstance[] {
  return contracts.map((config) => {
    const abi = getContractABI(config.type);
    const contract = new Contract(config.address, abi, signerOrProvider);

    return {
      address: config.address,
      contract,
      abi,
    };
  });
}

export default {
  createBinaryMarketContract,
  createCopyTradingVaultContract,
  getContractABI,
  isValidContractAddress,
  getContractBytecode,
  isContractDeployed,
  getContractDeploymentBlock,
  createMultipleContracts,
};
