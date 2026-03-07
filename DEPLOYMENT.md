# NEXUS - Deployment Guide

## Prerequisites

Before deploying NEXUS, ensure you have the following:

1. **Node.js** (v18+) and pnpm
2. **Hardhat** for smart contract deployment
3. **Web3 Wallet** (MetaMask, WalletConnect, etc.)
4. **Test Network Funds** (MATIC for Mumbai, ETH for Base Sepolia)
5. **RPC URLs** for target networks
6. **WalletConnect Project ID** from [WalletConnect Cloud](https://cloud.walletconnect.com/)

## Smart Contract Deployment

### 1. Setup Environment Variables

Create a `.env` file in the project root:

```env
# Private key for deployment (DO NOT commit to git)
PRIVATE_KEY=your_private_key_here

# RPC URLs
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
POLYGON_RPC_URL=https://polygon-rpc.com
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org

# Etherscan/Polygonscan API Keys (for verification)
POLYGONSCAN_API_KEY=your_polygonscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
```

### 2. Deploy to Mumbai Testnet

```bash
# Compile contracts
npx hardhat compile

# Deploy BinaryMarket and CopyTradingVault
npx hardhat run scripts/deploy.ts --network mumbai

# Verify contracts on Polygonscan (optional)
npx hardhat verify --network mumbai <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 3. Deploy to Polygon Mainnet

```bash
# Deploy to production
npx hardhat run scripts/deploy.ts --network polygon

# Verify contracts
npx hardhat verify --network polygon <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

### 4. Deploy to Base Networks

```bash
# Deploy to Base Sepolia testnet
npx hardhat run scripts/deploy.ts --network baseSepolia

# Deploy to Base mainnet
npx hardhat run scripts/deploy.ts --network base
```

## Frontend Configuration

### 1. Update Environment Variables

Update `client/.env.local` with deployed contract addresses:

```env
# Web3 Configuration
VITE_WALLET_CONNECT_PROJECT_ID=your_walletconnect_project_id

# Contract Addresses (from deployment)
VITE_USDC_ADDRESS=0x...
VITE_BINARY_MARKET_FACTORY_ADDRESS=0x...
VITE_COPY_TRADING_VAULT_FACTORY_ADDRESS=0x...

# RPC URLs
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
```

### 2. Build Frontend

```bash
# Install dependencies
pnpm install

# Build for production
pnpm build

# Start development server
pnpm dev
```

## Testing Deployment

### 1. Test on Mumbai Testnet

1. Get test MATIC from [Mumbai Faucet](https://faucet.polygon.technology/)
2. Get test USDC from [Aave Faucet](https://staging.aave.com/faucet/)
3. Connect wallet to Mumbai network
4. Test market creation and betting

### 2. Test on Base Sepolia

1. Get test ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
2. Get test USDC from Base testnet faucet
3. Connect wallet to Base Sepolia
4. Test copy trading functionality

## Production Deployment Checklist

- [ ] All smart contracts audited for security
- [ ] Contract addresses verified on block explorers
- [ ] Frontend environment variables configured
- [ ] USDC token addresses verified for each network
- [ ] RPC URLs tested and confirmed working
- [ ] WalletConnect project ID configured
- [ ] Frontend built and tested
- [ ] DNS/domain configured (if using custom domain)
- [ ] SSL certificates installed
- [ ] Monitoring and alerting setup
- [ ] Backup and disaster recovery plan

## Monitoring & Maintenance

### 1. Monitor Smart Contracts

- Watch for failed transactions
- Monitor gas prices and adjust if needed
- Track total value locked (TVL)
- Monitor user activity

### 2. Monitor Frontend

- Check error logs
- Monitor page load times
- Track user interactions
- Monitor wallet connection issues

### 3. Regular Updates

- Update dependencies regularly
- Apply security patches
- Monitor for contract vulnerabilities
- Update oracle prices if using external oracles

## Rollback Procedure

If issues occur after deployment:

1. **Pause Markets** - Call `cancelMarket()` on affected markets
2. **Withdraw Funds** - Users can withdraw via `withdraw()` function
3. **Revert Frontend** - Deploy previous working version
4. **Investigate** - Review logs and identify root cause
5. **Fix & Redeploy** - After fixing, redeploy contracts and frontend

## Support & Troubleshooting

### Common Issues

**Transaction Failed: "Insufficient Balance"**
- Ensure wallet has enough native tokens (MATIC/ETH) for gas
- Check USDC balance for betting

**Contract Deployment Failed**
- Verify RPC URL is correct
- Check private key is valid
- Ensure wallet has sufficient funds for gas

**Frontend Won't Connect to Wallet**
- Clear browser cache and cookies
- Check WalletConnect project ID
- Verify network is supported

**Betting Transaction Reverted**
- Check USDC approval (may need to approve spending)
- Verify market is still OPEN
- Check USDC balance

## Contact & Support

For deployment issues or questions:
- Review [Hardhat Documentation](https://hardhat.org/)
- Check [RainbowKit Docs](https://www.rainbowkit.com/)
- Visit [Polygon Docs](https://polygon.technology/developers/)
- Visit [Base Docs](https://docs.base.org/)
