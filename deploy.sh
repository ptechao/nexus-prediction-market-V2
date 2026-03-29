#!/bin/bash
set -e

echo "[1/5] Checking System & Resources..."
# Install curl if missing
apt-get update && apt-get install -y curl git build-essential

# Ensure Swap (2GB) to prevent OOM
if [ ! -f /swapfile ]; then
  echo "Setting up 2GB swap file..."
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' | tee -a /etc/fstab
fi

echo "[2/5] Installing Node.js 20 & pnpm..."
if ! command -v node &> /dev/null || [[ $(node -v) != v20.* ]]; then
  echo "Installing Node.js 20 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

if ! command -v pnpm &> /dev/null; then
  npm install -g pnpm
fi

if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

echo "[3/5] Cloning and Preparing Code..."
rm -rf nexus-prediction-market-V2
git clone https://github.com/ptechao/nexus-prediction-market-V2.git
cd nexus-prediction-market-V2

echo "[4/5] Configuring Environment..."
cat <<EOF > .env
DATABASE_URL="REPLACE_WITH_YOUR_TURSO_URL"
DATABASE_AUTH_TOKEN="REPLACE_WITH_YOUR_TURSO_TOKEN"
OPENAI_API_KEY="REPLACE_WITH_YOUR_OPENAI_KEY"
PORT=3000
ENABLE_AI_PREDICTIONS=true
ENABLE_COPY_TRADING=true
ENABLE_WORLD_CUP_MARKETS=true
LOG_LEVEL=info
SESSION_SECRET="nexus-vps-stable-secret"
EOF

echo "[5/5] Compiling and Launching (Robust Mode)..."
# Increase memory limit for the build process
export NODE_OPTIONS="--max-old-space-size=1536"

pnpm install
pnpm build

# Start with PM2
pm2 delete nexus || true
pm2 start dist/index.js --name nexus

# Setup persistence
pm2 save
# pm2 startup | bash

echo "SUCCESS! Service is live at http://38.54.107.190:3000"
curl --retry 3 --retry-delay 5 localhost:3000/health || echo "Health check failed, manually check pm2 logs nexus"
