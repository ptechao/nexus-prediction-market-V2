# NEXUS - Prediction Market MVP Architecture

## Project Overview

NEXUS is a decentralized prediction market platform built on Polygon PoS and Base networks. It combines binary prediction markets with social copy trading functionality, allowing users to bet on real-world events and automatically follow top traders' strategies.

## Technology Stack

### Smart Contracts
- **Solidity 0.8.20** - Smart contract language
- **Hardhat** - Development framework and deployment tools
- **OpenZeppelin Contracts** - Secure contract libraries

### Frontend
- **Next.js with React 19** - UI framework
- **Tailwind CSS 4** - Styling
- **RainbowKit** - Wallet connection UI
- **wagmi** - Web3 hooks and utilities
- **ethers.js** - Blockchain interaction
- **TypeScript** - Type safety

### Backend
- **Express.js** - API server
- **tRPC** - Type-safe RPC framework
- **Drizzle ORM** - Database management

## Project Structure

```
nexus-prediction-market/
├── contracts/                    # Solidity smart contracts
│   ├── BinaryMarket.sol         # Binary Yes/No market contract
│   └── CopyTradingVault.sol     # Copy trading vault contract
├── scripts/                      # Deployment and utility scripts
├── client/                       # Frontend application
│   ├── src/
│   │   ├── pages/               # Page components
│   │   │   ├── Home.tsx         # Landing page
│   │   │   ├── Markets.tsx      # Market list page
│   │   │   └── Leaderboard.tsx  # Top traders leaderboard
│   │   ├── components/          # Reusable components
│   │   │   ├── Navigation.tsx   # Main navigation
│   │   │   ├── BettingModal.tsx # Betting interface
│   │   │   └── ui/              # shadcn/ui components
│   │   ├── lib/
│   │   │   ├── web3Config.ts    # Web3 configuration
│   │   │   └── trpc.ts          # tRPC client
│   │   ├── App.tsx              # Root component
│   │   └── index.css            # Global styles
│   └── public/
│       └── mockData.json        # Mock market and leader data
├── server/                      # Backend server
│   ├── routers.ts               # tRPC procedure definitions
│   ├── db.ts                    # Database queries
│   └── _core/                   # Framework internals
├── drizzle/                     # Database schema
│   └── schema.ts                # Drizzle schema definitions
├── hardhat.config.ts            # Hardhat configuration
├── vite.config.ts               # Vite configuration
└── package.json                 # Dependencies
```

## Smart Contract Architecture

### BinaryMarket.sol

The core prediction market contract implementing a binary (Yes/No) betting mechanism.

**Key Features:**
- Accept USDC bets on Yes or No outcomes
- Track individual user positions
- Calculate real-time odds based on pool ratios
- Simple admin-controlled resolution (MVP oracle)
- Proportional payout distribution to winners

**Core Functions:**
```solidity
- buyYes(uint256 amount) - Place a YES bet
- buyNo(uint256 amount) - Place a NO bet
- claimWinnings() - Claim winnings after resolution
- adminResolve(uint256 outcome) - Resolve market (admin only)
- getYesOdds() - Get current YES odds (0-100%)
- getNoOdds() - Get current NO odds (0-100%)
```

**State Variables:**
- `marketId` - Unique market identifier
- `eventTitle` - Market title/description
- `endTime` - Market end timestamp
- `status` - Market status (OPEN, RESOLVED, CANCELLED)
- `yesPoolAmount` - Total YES bets
- `noPoolAmount` - Total NO bets
- `yesBets[address]` - User YES bet amounts
- `noBets[address]` - User NO bet amounts

### CopyTradingVault.sol

Vault contract enabling users to deposit USDC and automatically follow leader trades.

**Key Features:**
- Accept USDC deposits from followers
- Track follower balances and allocations
- Leader-initiated proportional bet allocation
- Automatic fund distribution based on leader decisions

**Core Functions:**
```solidity
- deposit(uint256 amount) - Deposit USDC into vault
- withdraw(uint256 amount) - Withdraw USDC from vault
- leaderBuyYes(address market, uint256 amount) - Leader bets YES
- leaderBuyNo(address market, uint256 amount) - Leader bets NO
- getFollowerBalance(address) - Get follower's balance
- getVaultStats() - Get vault statistics
```

**State Variables:**
- `leader` - Vault owner/leader address
- `leaderName` - Leader display name
- `followers[]` - Array of follower addresses
- `followerDeposits[address]` - Follower USDC balances
- `totalDeposited` - Total USDC deposited
- `totalWithdrawn` - Total USDC withdrawn

## Frontend Architecture

### Pages

**Home.tsx**
- Landing page with hero section
- Feature highlights
- How it works explanation
- Call-to-action buttons

**Markets.tsx**
- Market list with card layout
- Filter by event type (Sports, Crypto, Entertainment, Finance)
- Display market title, description, odds, and pool size
- Responsive grid layout
- Integration with BettingModal

**Leaderboard.tsx**
- Top traders ranking table
- Sort by ROI, Win Rate, or Followers
- Display trader stats and badges
- Copy trading action buttons

### Components

**Navigation.tsx**
- Sticky header navigation
- Logo and brand
- Navigation links (Home, Markets, Leaderboard)
- RainbowKit wallet connection button

**BettingModal.tsx**
- Modal dialog for placing bets
- Outcome selection (Yes/No)
- USDC amount input with validation
- Potential payout calculation
- Transaction states (input, confirming, success, error)
- Wallet connection check

### Web3 Integration

**web3Config.ts**
- RainbowKit configuration
- wagmi client setup
- Supported chains (Polygon, Polygon Mumbai, Base, Base Sepolia)
- Contract address configuration
- RPC URL configuration

## Data Flow

### Betting Flow
1. User connects wallet via RainbowKit
2. User navigates to Markets page
3. User clicks "Place Bet" on a market card
4. BettingModal opens with market details
5. User selects outcome (Yes/No) and enters USDC amount
6. User confirms transaction via wallet
7. Smart contract receives bet and updates pool
8. UI shows success/error state

### Copy Trading Flow
1. User deposits USDC into a leader's vault
2. When leader places a bet on BinaryMarket
3. Vault automatically allocates follower funds proportionally
4. Follower shares in leader's bet outcome
5. Winnings distributed proportionally after market resolution

## Environment Variables

```env
# Web3
VITE_WALLET_CONNECT_PROJECT_ID=<WalletConnect Project ID>
VITE_USDC_ADDRESS=<USDC Token Address>
VITE_BINARY_MARKET_FACTORY_ADDRESS=<Factory Contract Address>
VITE_COPY_TRADING_VAULT_FACTORY_ADDRESS=<Factory Contract Address>

# RPC URLs
VITE_POLYGON_RPC_URL=https://polygon-rpc.com
VITE_POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
VITE_BASE_RPC_URL=https://mainnet.base.org
VITE_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Hardhat
PRIVATE_KEY=<Your Private Key>
MUMBAI_RPC_URL=<Mumbai RPC URL>
POLYGON_RPC_URL=<Polygon RPC URL>
BASE_SEPOLIA_RPC_URL=<Base Sepolia RPC URL>
BASE_RPC_URL=<Base RPC URL>
POLYGONSCAN_API_KEY=<Polygonscan API Key>
BASESCAN_API_KEY=<Basescan API Key>
```

## Design System

### Color Palette
- **Primary Blue**: `#2563eb` - Main brand color
- **Success Green**: `#16a34a` - YES outcomes
- **Danger Red**: `#dc2626` - NO outcomes
- **Neutral Slate**: `#64748b` - Text and backgrounds
- **White**: `#ffffff` - Card backgrounds

### Typography
- **Headings**: Bold, large sizes (3xl-5xl)
- **Body**: Regular weight, readable sizes
- **Accent**: Medium weight for emphasis

### Components
- **Cards**: Rounded corners, subtle shadows, hover effects
- **Buttons**: Gradient backgrounds, smooth transitions
- **Modals**: Centered, semi-transparent overlay
- **Tables**: Clean, sortable columns

## Deployment

### Smart Contracts
```bash
# Compile contracts
npx hardhat compile

# Deploy to Mumbai testnet
npx hardhat run scripts/deploy.ts --network mumbai

# Deploy to Polygon mainnet
npx hardhat run scripts/deploy.ts --network polygon
```

### Frontend
The frontend is deployed via Manus platform with automatic CI/CD integration.

## Security Considerations

1. **Smart Contracts**
   - Use OpenZeppelin's audited contracts
   - Implement ReentrancyGuard for critical functions
   - Validate all inputs
   - Use SafeMath implicitly (Solidity 0.8+)

2. **Frontend**
   - Validate user inputs before submission
   - Check wallet connection before transactions
   - Display clear transaction confirmation
   - Handle errors gracefully

3. **Web3 Integration**
   - Use wagmi for safe contract interaction
   - Implement proper error handling
   - Validate contract addresses
   - Use environment variables for sensitive data

## Future Enhancements

1. **Oracle Integration**
   - Replace adminResolve with UMA or Chainlink oracle
   - Implement dispute resolution mechanism

2. **Advanced Features**
   - Partial fills and order books
   - Liquidity pools and AMM
   - Governance token and DAO
   - Referral program

3. **Scaling**
   - Layer 2 optimization
   - Cross-chain bridges
   - Subgraph indexing

4. **User Experience**
   - Mobile app
   - Advanced charting
   - Portfolio tracking
   - Notification system

## Testing

### Smart Contract Tests
```bash
npx hardhat test
```

### Frontend Tests
```bash
pnpm test
```

## Resources

- [Solidity Documentation](https://docs.soliditylang.org/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [RainbowKit Documentation](https://www.rainbowkit.com/)
- [wagmi Documentation](https://wagmi.sh/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
