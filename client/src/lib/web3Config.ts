import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  polygon,
  polygonMumbai,
  base,
  baseSepolia,
} from 'wagmi/chains';

// 使用 import.meta.env 而不是 process.env（Vite 在客戶端使用）
const getEnv = (key: string, fallback: string): string => {
  return (import.meta.env as Record<string, string>)[key] || fallback;
};

export const web3Config = getDefaultConfig({
  appName: 'NEXUS - Prediction Market',
  projectId: getEnv('VITE_WALLET_CONNECT_PROJECT_ID', 'nexus-prediction-market'),
  chains: [
    mainnet,
    polygon,
    polygonMumbai,
    base,
    baseSepolia,
  ],
  ssr: false,
});

// Supported chains for the application
export const SUPPORTED_CHAINS = {
  POLYGON: polygon,
  POLYGON_MUMBAI: polygonMumbai,
  BASE: base,
  BASE_SEPOLIA: baseSepolia,
};

// Default chain for the application
export const DEFAULT_CHAIN = polygonMumbai;

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  USDC: getEnv('VITE_USDC_ADDRESS', '0x5FbDB2315678afecb367f032d93F642f64180aa3'),
  BINARY_MARKET_FACTORY: getEnv('VITE_BINARY_MARKET_FACTORY_ADDRESS', '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'),
  COPY_TRADING_VAULT_FACTORY: getEnv('VITE_COPY_TRADING_VAULT_FACTORY_ADDRESS', '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'),
};

// RPC URLs
export const RPC_URLS = {
  POLYGON: getEnv('VITE_POLYGON_RPC_URL', 'https://polygon-rpc.com'),
  POLYGON_MUMBAI: getEnv('VITE_POLYGON_MUMBAI_RPC_URL', 'https://rpc-mumbai.maticvigil.com'),
  BASE: getEnv('VITE_BASE_RPC_URL', 'https://mainnet.base.org'),
  BASE_SEPOLIA: getEnv('VITE_BASE_SEPOLIA_RPC_URL', 'https://sepolia.base.org'),
};
