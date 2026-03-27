# NEXUS - Prediction Market V2

Nexus is a decentralized prediction market platform built with modern technologies. It features AI-powered match analysis for the 2026 World Cup and real-time multi-language support.

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+ 
- pnpm (`npm install -g pnpm`)

### 2. Installation
```bash
# Install dependencies
pnpm install

# Setup environment variables (copy example)
cp .env.example .env
```

### 3. Database Setup (Optional for mock data)
The project uses Drizzle ORM with MySQL. If you want to use a real database:
```bash
# Push schema to your database
pnpm db:push
```

### 4. Run Development Server
```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🌟 Key Features
- **AI-Powered Multi-Language Support**: Real-time translation for dynamic market content across 7 languages.
- **2026 World Cup Specials**: AI match analysis, confidence scores, and trending markets for the upcoming World Cup.
- **Copy Trading & Leaderboard**: Follow top traders and copy their strategies.
- **Responsive UI**: Sleek, glassmorphic design optimized for all devices.

## 🛠 Tech Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend**: Express, tRPC
- **Blockchain**: Viem, Wagmi, RainbowKit
- **Database**: Drizzle ORM, MySQL (mysql2)
- **AI**: Existing LLM infrastructure for translation and match analysis

## 📁 Project Structure
- `client/`: Frontend application code
- `server/`: Backend API and specialized services (AI, translation)
- `contracts/`: Solidity smart contracts
- `messages/`: Localization JSON files
- `scripts/`: Deployment and maintenance scripts

## 📄 Documentation
- [FEATURE_MANUAL.md](./FEATURE_MANUAL.md) - Feature guide (English)
- [NEXUS_FEATURE_MANUAL_ZH.md](./NEXUS_FEATURE_MANUAL_ZH.md) - 功能說明書 (中文)
- [QUICKSTART.md](./QUICKSTART.md) - Detailed setup guide
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design overview
- [walkthrough.md](./walkthrough.md) - Recent development history

---
*Nexus - Predict the Future, Trade the Truth.*
