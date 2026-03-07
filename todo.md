# NEXUS - Prediction Market MVP TODO

## Smart Contracts
- [x] BinaryMarket.sol - Binary Yes/No market contract with buyYes(), buyNo(), claimWinnings()
- [x] BinaryMarket.sol - adminResolve() simple oracle function
- [x] CopyTradingVault.sol - Vault contract for USDC deposits and auto-following
- [x] CopyTradingVault.sol - Proportional bet following mechanism
- [x] Hardhat configuration and deployment scripts
- [ ] Smart contract tests and security validation

## Frontend Architecture
- [x] Setup Web3 dependencies (ethers.js, RainbowKit, wagmi)
- [ ] Create contracts ABI and TypeScript bindings
- [x] Setup environment variables for blockchain networks
- [x] Create mock data (mockData.json with 5 sports events and 3 leaders)

## Market List Page
- [x] Market list page component with card layout
- [x] Display event title, end date, and current odds (Yes/No percentages)
- [x] Market card styling with Polymarket-inspired design
- [x] Responsive grid layout for market cards
- [x] Filter and sort functionality (optional)

## Leaderboard Page
- [x] Leaderboard page component with trader table
- [x] Display trader name, ROI, win rate, and other mock stats
- [x] Sortable table columns
- [x] Elegant table styling with Polymarket design language

## Betting Modal
- [x] Betting modal component for market interaction
- [x] USDC amount input field with validation
- [x] Yes/No selection toggle
- [x] Wallet connection check before betting
- [x] Transaction confirmation flow
- [x] Success/error state handling

## RainbowKit Integration
- [x] Install and configure RainbowKit
- [x] Setup wagmi client with Polygon PoS and Base network support
- [x] Implement wallet connection button
- [ ] Display connected wallet address and balance
- [ ] Network switching functionality

## Design & Styling
- [x] Implement Polymarket-inspired elegant design system
- [x] Global color palette and typography setup
- [x] Responsive design for mobile and desktop
- [ ] Dark/light theme support
- [x] Smooth animations and transitions

## Testing & Deployment
- [ ] Write unit tests for smart contracts
- [ ] Write integration tests for frontend-blockchain interaction
- [ ] Test wallet connection flow
- [ ] Test betting transaction flow
- [ ] Prepare deployment documentation

## Market List Enhancements
- [x] Add "Trending Markets" filter tag to Markets page
- [x] Update mockData.json to mark trending markets
- [x] Implement trending market filtering logic
- [x] Add trending badge/icon to market cards
- [x] Implement UI response effects and animations
- [x] Add hover effects and transitions


## Social Copy Trading Features
- [x] Create CopyTradingModal component for deposit and follow
- [x] Add "Copy Trading" button to leaderboard trader rows
- [x] Implement copy trading state management (following status)
- [x] Add visual indicators for followed traders
- [x] Implement deposit amount input validation
- [x] Add success/error notifications for copy trading actions
- [ ] Create copy trading history display
- [x] Add animations and transitions for copy trading UI


## Smart Contract Improvements
- [x] Add emergency cancel functionality to BinaryMarket
- [x] Fix resolution math for correct payout calculation
- [x] Implement fee mechanism (basis points and treasury)
- [x] Add claimRefund() function for cancelled markets
- [x] Handle edge case where winning pool is 0
- [x] Test all contract improvements


## CopyTradingVault Rewrite
- [x] Redesign vault using pooled fund model (no loops)
- [x] Implement ERC-20 style share system
- [x] Add asset tracking and totalAssets() function
- [x] Implement performance fee (20%) mechanism
- [x] Add high watermark tracking for MVP
- [x] Test pooled vault implementation


## Frontend Vault Display Updates
- [x] Create VaultStats component showing total assets and NAV
- [x] Create VaultDetails page with performance fee info
- [x] Update Leaderboard to show vault statistics
- [ ] Add vault asset breakdown visualization
- [ ] Implement real-time NAV calculation
- [x] Add performance fee history display
- [x] Create vault position tracking UI
- [x] Add responsive design for vault pages


## Bug Fixes
- [x] Fix "process is not defined" error in web3Config.ts
- [x] Fix nested <a> tag error on homepage (React DOM validation error)
- [x] Hotfix: Force display hardcoded mock market data on Markets page
- [x] Hotfix: Make homepage directly render MarketList with mock data cards
- [x] Hotfix: Switch to dark crypto theme and ensure cards render unconditionally
- [x] Create server-side Polymarket API fetch utility
- [x] Add tRPC procedure for fetching live market data
- [x] Map Polymarket API response to Market interface
- [x] Update Home.tsx to fetch live data with loading/error/fallback
- [x] Update Markets.tsx to fetch live data with loading/error/fallback
- [x] Add tests for Polymarket integration


## Phase 2: Smart Contract Integration
- [x] Create useNexus.ts custom hook for contract interaction
- [x] Implement BinaryMarket read functions (odds, title, pool sizes)
- [x] Implement CopyTradingVault read functions (NAV, total assets, followers)
- [x] Implement deposit function for copy trading
- [x] Implement buyYes/buyNo functions for betting
- [x] Create Leaderboard page with vault listing
- [x] Implement copy trading modal with USDC approval
- [ ] Create Market List page with market cards
- [ ] Implement betting modal for market interaction
- [ ] Add real-time contract data updates


## useNexus Write Functions Implementation
- [x] Implement depositToVault with useWriteContract
- [x] Implement approveUsdc with useWriteContract
- [x] Implement buyYes with useWriteContract
- [x] Implement buyNo with useWriteContract
- [x] Add transaction confirmation handling
- [x] Add error handling and retry logic


## Mock Market Data for Demo
- [x] Create mockMarkets.ts with sample market data
- [x] Create useMarkets hook for market data management
- [x] Create Market List page with mock data display
- [x] Add market card component with odds visualization
- [x] Implement betting flow with mock data


## Polymarket API Integration
- [x] Create Polymarket API client
- [x] Fetch real market data from Gamma API
- [x] Map Polymarket data to NEXUS format
- [x] Implement demo mode for betting
- [x] Add error handling and fallback to mock data
- [x] Test real-time data fetching


## Shadow Market Mode
- [x] Create Polymarket data sync system
- [x] Implement local contract mapping mechanism
- [x] Add contract deployment automation
- [x] Update useNexus to fetch Polymarket metadata
- [x] Display local pool odds instead of Polymarket odds
- [ ] Implement market creation UI
- [x] Test Shadow Market integration


## Internationalization (i18n) Support
- [x] Install and configure next-intl
- [x] Create translation files (en.json, zh-TW.json, es.json)
- [x] Translate key UI elements
- [x] Implement language switcher in navbar
- [x] Create market title translation utility
- [x] Test i18n functionality


## Asia Market i18n Expansion
- [x] Create zh-CN, ja, ko, th translation files
- [x] Update language switcher with native names and flags
- [x] Add Google Fonts for CJK and Thai character support
- [x] Test all Asian language displays
- [x] Verify character rendering across browsers
- [x] Add backend tRPC route to fetch single market by ID
- [x] Create MarketDetail page component with full trading info
- [x] Add /markets/:id route in App.tsx
- [x] Make MarketCard clickable to navigate to detail page
- [x] Add tests for market detail feature
- [x] Add Recharts price history chart to market detail page
- [x] Add trading panel with Buy Yes/No tabs, USDC input, and estimated returns
- [x] Fix MarketCard.tsx syntax error from merge

## Polymarket Data Quality Fix
- [x] Filter out old/expired 2024 markets from API results
- [x] Optimize API query to fetch more active and recent markets
- [x] Ensure only currently active markets are displayed
- [x] Increase market count and diversity of categories

## World Cup 2026 Integration (Phase A)
- [ ] Create server/data/worldcupMatches.ts with WorldCupMatch interface and 64 matches
- [ ] Create server/worldcup.ts with mapMatchToMarket and fetchWorldCupMarkets functions
- [ ] Add markets.worldCup and markets.worldCupById tRPC routes
- [ ] Update client/components/MarketCard.tsx to display World Cup ★ badge
- [ ] Update client/pages/Markets.tsx to filter and display World Cup matches
- [ ] Update client/pages/MarketDetail.tsx to show World Cup match details
- [ ] Add World Cup filtering logic to Markets page
- [ ] Write tests for World Cup integration
- [ ] Update README with World Cup data structure and API integration guide


## World Cup AI Prediction Feature
- [ ] Design AI prediction model based on FIFA rankings and team statistics
- [ ] Implement backend AI prediction service using LLM
- [ ] Create tRPC route for AI predictions (markets.worldCupPrediction)
- [ ] Add prediction confidence score and reasoning explanation
- [ ] Update MarketDetail component to display AI predictions
- [ ] Add prediction visualization (gauge, confidence bar, etc.)
- [ ] Write tests for AI prediction service
- [ ] Add translations for prediction UI elements


## Market Lifecycle Automation (Phase A)
- [x] Create sports data adapter (apiFootball.ts) with retry logic and rate limiting
- [x] Implement MarketSeed type and data normalization
- [x] Create createMarkets.ts cron job for market ingestion
- [ ] Create resolveMarkets.ts cron job for market resolution
- [x] Extend Drizzle schema with market status enum and dispute fields
- [ ] Implement dispute and refund endpoints (admin-only)
- [ ] Add cancelMarket() and claimRefund() hooks to smart contracts
- [ ] Update frontend MarketDetail to show dispute/refund UI
- [ ] Add mock fixtures for testing without API calls
- [ ] Update README with ENV variables and cron setup
- [ ] Write integration tests for market lifecycle


## Copy Trading Execution (Phase B)
- [ ] Create followersVaults table in Drizzle schema
- [ ] Create followerTrades table for tracking proportional allocations
- [ ] Implement followTrader() hook in useNexus.ts (USDC approval + vault deposit)
- [ ] Implement unfollowTrader() hook (withdraw proportional shares)
- [ ] Create tRPC route follow.toggle for storing follow relationships
- [ ] Implement proportional execution logic (calculate follower allocation)
- [ ] Create fee accounting system (platform + KOL fee splits)
- [ ] Add fees table entries for tracking fee distribution
- [ ] Update Leaderboard to show follower funds and performance fees
- [ ] Create Trader Profile modal with follower list and copy trades
- [ ] Update CopyTradingModal with actual allowance status and share estimation
- [ ] Write unit tests for proportional allocation and fee split
- [ ] Write integration tests for copy trading flow
- [ ] Update README with copy trading documentation
- [ ] Add sequence diagram for copy trading flow
