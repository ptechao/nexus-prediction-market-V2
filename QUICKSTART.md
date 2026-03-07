# NEXUS - Quick Start Guide

## Getting Started in 5 Minutes

### 1. Clone and Install

```bash
# Install dependencies
pnpm install

# Install Hardhat dependencies
pnpm add -D hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/hardhat-upgrades
```

### 2. Start Development Server

```bash
# Start the dev server
pnpm dev

# Open browser to http://localhost:3000
```

### 3. Explore the Application

- **Home Page** (`/`) - Landing page with features and how-it-works
- **Markets Page** (`/markets`) - Browse prediction markets with mock data
- **Leaderboard Page** (`/leaderboard`) - View top traders and their stats

### 4. Connect Your Wallet

Click the "Connect Wallet" button in the top-right corner and select your preferred wallet (MetaMask, WalletConnect, etc.).

### 5. Place a Bet (Mock)

1. Navigate to Markets page
2. Click "Place Bet" on any market card
3. Select Yes or No outcome
4. Enter USDC amount
5. Click "Place Bet" to confirm

## Project Structure Overview

```
nexus-prediction-market/
├── contracts/              # Smart contracts (Solidity)
├── client/src/            # Frontend React code
│   ├── pages/             # Page components
│   ├── components/        # Reusable components
│   └── lib/               # Utilities and configuration
├── server/                # Backend (tRPC)
├── scripts/               # Deployment scripts
└── package.json           # Dependencies
```

## Key Files to Explore

### Smart Contracts
- `contracts/BinaryMarket.sol` - Binary prediction market
- `contracts/CopyTradingVault.sol` - Copy trading vault

### Frontend Pages
- `client/src/pages/Home.tsx` - Landing page
- `client/src/pages/Markets.tsx` - Market list
- `client/src/pages/Leaderboard.tsx` - Top traders

### Components
- `client/src/components/Navigation.tsx` - Main navigation
- `client/src/components/BettingModal.tsx` - Betting interface

### Configuration
- `client/src/lib/web3Config.ts` - Web3 setup
- `hardhat.config.ts` - Smart contract configuration

## Common Tasks

### Add a New Market

Edit `client/public/mockData.json` and add a new market object:

```json
{
  "id": 6,
  "title": "Your Market Title",
  "description": "Market description",
  "eventType": "sports",
  "category": "Your Category",
  "endDate": "2026-12-31T23:59:59Z",
  "yesOdds": 55,
  "noOdds": 45,
  "totalPool": 1000000,
  "volume24h": 250000,
  "status": "open",
  "image": "https://example.com/image.jpg"
}
```

### Add a New Leader

Edit `client/public/mockData.json` and add a new leader object:

```json
{
  "id": 4,
  "name": "Trader Name",
  "handle": "@handle",
  "avatar": "https://example.com/avatar.jpg",
  "roi": 150.5,
  "winRate": 0.65,
  "totalTrades": 50,
  "followers": 5000,
  "vaultSize": 2000000,
  "description": "Trader description",
  "badges": ["verified", "top_trader"]
}
```

### Deploy Smart Contracts

```bash
# Compile contracts
npx hardhat compile

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.ts --network mumbai

# Deploy to Polygon mainnet
npx hardhat run scripts/deploy.ts --network polygon
```

### Run Tests

```bash
# Run frontend tests
pnpm test

# Run smart contract tests
npx hardhat test
```

## Environment Setup

### Create `.env` file

```env
# Web3
VITE_WALLET_CONNECT_PROJECT_ID=your_project_id

# Contract Addresses (optional, for deployment)
VITE_USDC_ADDRESS=0x...
VITE_BINARY_MARKET_FACTORY_ADDRESS=0x...
VITE_COPY_TRADING_VAULT_FACTORY_ADDRESS=0x...

# Hardhat (for deployment)
PRIVATE_KEY=your_private_key
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
```

## Supported Networks

- **Polygon Mumbai** (Testnet) - Default for development
- **Polygon PoS** (Mainnet) - Production
- **Base Sepolia** (Testnet) - Alternative testnet
- **Base** (Mainnet) - Alternative production

## Wallet Support

NEXUS supports multiple wallets via RainbowKit:
- MetaMask
- WalletConnect
- Coinbase Wallet
- Rainbow
- Argent
- And more...

## Useful Links

- [Polygon Faucet](https://faucet.polygon.technology/) - Get test MATIC
- [Aave Faucet](https://staging.aave.com/faucet/) - Get test USDC
- [Hardhat Docs](https://hardhat.org/) - Smart contract development
- [RainbowKit Docs](https://www.rainbowkit.com/) - Wallet integration
- [Tailwind CSS](https://tailwindcss.com/) - Styling

## Troubleshooting

### Port 3000 Already in Use
```bash
# Use a different port
PORT=3001 pnpm dev
```

### Dependencies Installation Issues
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Wallet Connection Issues
- Clear browser cache and cookies
- Try a different wallet
- Check network is supported
- Verify WalletConnect Project ID

### Smart Contract Compilation Errors
```bash
# Clean and recompile
npx hardhat clean
npx hardhat compile
```

## Next Steps

1. **Customize Design** - Edit colors and styles in `client/src/index.css`
2. **Add Features** - Create new pages and components
3. **Deploy Contracts** - Follow DEPLOYMENT.md guide
4. **Connect Real Data** - Replace mock data with API calls
5. **Add Authentication** - Implement user accounts and profiles

## Support

For more detailed information:
- See [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions
- Check [README.md](./README.md) for general information

Happy building! 🚀
