# Nexus Prediction Market: VPS 部署與穩定運行手冊

本手冊旨在幫助您將 Nexus 平台從限制較多的 Render 免費版遷移至更加穩定、資源充足的 **VPS (Virtual Private Server)** 環境。

---

## 🚀 為什麼要遷移到 VPS？

- **解鎖 512MB 限制**：不再因為同步幾百個市場或執行造市邏輯而導致 OOM 崩潰。
- **24/7 恆定運行**：不會有 Render 免費版自動休眠或導流 502 的問題。
- **極速響應**：撮合引擎與數據同步頻率已恢復至最高效能級別（每分鐘掃描一次）。

---

## 🛠️ 第一步：伺服器環境初始化

在您的 VPS (推薦 Ubuntu 22.04 LTS) 上執行以下指令：

```bash
# 1. 更新系統
sudo apt update && sudo apt upgrade -y

# 2. 安裝 Node.js 20 (使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. 安裝 pnpm
sudo npm install -g pnpm

# 4. 安裝 PM2 (進程管理器)
sudo npm install -g pm2
```

---

## 📂 第二步：代碼與依賴準備

```bash
# 1. 複製您的代碼
git clone https://github.com/ptechao/nexus-prediction-market-V2.git
cd nexus-prediction-market-V2

# 2. 安裝依賴
pnpm install

# 3. 編譯項目
pnpm build
```

---

## 🔐 第三步：環境變數配置

在項目根目錄創建 `.env` 檔案，確保包含以下關鍵參數：

```bash
DATABASE_URL="libsql://your-db-url"
DATABASE_AUTH_TOKEN="your-token"
OPENAI_API_KEY="your-key"
PORT=3000
# 若需足球即時數據，請補上：
API_FOOTBALL_KEY="your-rapidapi-key"
```

---

## 🏃 第四步：使用 PM2 點火啟動

PM2 將確保您的伺服器崩潰後自動重啟，並在系統開機時自動執行。

```bash
# 1. 啟動服務 (指定名稱為 nexus)
pm2 start dist/index.js --name nexus

# 2. 查看運行日誌
pm2 logs nexus

# 3. 查看資源佔用 (現在您可以放心看到它穩定運行)
pm2 monit

# 4. 設定開機自啟
pm2 save
pm2 startup
```

---

## 🌐 第五步：域名與 Nginx (建議)

如果您有域名，建議使用 Nginx 進行反向代理 (Port 80 -> 3000)：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

> [!TIP]
> **當前代碼狀態**：目前的 Git 最新代碼 (`master` 分支) 已經針對 VPS 進行了 **效能全開** 調整。
> - 同步數量恢復為 **Top 100** 市場。
> - 撮合頻率恢復為 **每分鐘一次**。
> - 市場同步頻率恢復為 **每 15 分鐘一次**。

**祝您的預測市場平台大獲成功！如果您在 VPS 配置過程中遇到任何問題，請隨時召喚我。**
