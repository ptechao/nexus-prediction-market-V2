# 區塊鏈配置指南

## 環境變量配置

### Sepolia 測試網配置

```bash
# RPC 提供商配置
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY

# 部署者賬戶
SEPOLIA_DEPLOYER_PRIVATE_KEY=your_private_key_here
SEPOLIA_DEPLOYER_ADDRESS=0x...
```

### 以太坊主網配置

```bash
# RPC 提供商配置
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# 部署者賬戶
MAINNET_DEPLOYER_PRIVATE_KEY=your_private_key_here
MAINNET_DEPLOYER_ADDRESS=0x...
```

## Gas 管理配置

```bash
# Gas 價格乘數（用於增加安全邊際）
GAS_PRICE_MULTIPLIER=1.2

# Gas 限額乘數
GAS_LIMIT_MULTIPLIER=1.3

# 最大 Gas 價格（Gwei）
MAX_GAS_PRICE_GWEI=500

# 最小 Gas 價格（Gwei）
MIN_GAS_PRICE_GWEI=1
```

## 部署配置

```bash
# 部署超時時間（秒）
DEPLOYMENT_TIMEOUT_SECONDS=300

# 交易確認區塊數
DEPLOYMENT_CONFIRMATION_BLOCKS=3

# 最大重試次數
DEPLOYMENT_MAX_RETRIES=3

# 重試延遲（毫秒）
DEPLOYMENT_RETRY_DELAY_MS=1000

# Oracle 白名單（逗號分隔）
ORACLE_WHITELIST=0x...,0x...,0x...
```

## RPC 提供商推薦

### Infura
- **URL**: https://infura.io
- **優點**: 可靠性高、支持多個網絡
- **缺點**: 免費層有速率限制

### Alchemy
- **URL**: https://www.alchemy.com
- **優點**: 高性能、良好的監控工具
- **缺點**: 需要註冊

### QuickNode
- **URL**: https://www.quicknode.com
- **優點**: 快速、支持多個網絡
- **缺點**: 付費服務

## 部署者賬戶設置

### 1. 生成新賬戶

```bash
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

### 2. 資金轉入

**Sepolia 測試網**:
- 使用 Sepolia 水龍頭：https://sepoliafaucet.com
- 或通過 Infura 水龍頭

**以太坊主網**:
- 從交易所轉入 ETH
- 確保有足夠的 Gas 費用

### 3. 驗證賬戶

```bash
node -e "const ethers = require('ethers'); const provider = new ethers.JsonRpcProvider('YOUR_RPC_URL'); const address = '0x...'; provider.getBalance(address).then(balance => console.log('Balance:', ethers.formatEther(balance), 'ETH'));"
```

## 安全最佳實踐

### ✅ 推薦做法

1. **使用環境變量**：永遠不要在代碼中硬編碼私鑰
2. **使用硬件錢包**：生產環境使用 Ledger 或 Trezor
3. **限制私鑰權限**：使用只能部署合約的賬戶
4. **監控交易**：使用 Etherscan 監控所有交易
5. **備份私鑰**：安全地備份私鑰

### ❌ 避免做法

1. 在代碼中硬編碼私鑰
2. 在 Git 中提交 .env 文件
3. 在公共網絡上暴露私鑰
4. 使用主要賬戶進行測試
5. 忘記備份私鑰

## 合約部署流程

### 1. 準備階段

- 驗證 RPC 連接
- 檢查部署者賬戶餘額
- 驗證合約字節碼

### 2. 部署階段

- 估算 Gas 費用
- 簽署交易
- 提交交易
- 等待確認

### 3. 驗證階段

- 檢查部署狀態
- 驗證合約代碼
- 記錄合約地址

## 故障排查

### 問題：交易失敗

**原因**:
- 賬戶餘額不足
- Gas 限額太低
- RPC 連接失敗

**解決方案**:
1. 檢查賬戶餘額
2. 增加 Gas 限額
3. 切換 RPC 提供商

### 問題：交易掛起

**原因**:
- Gas 價格太低
- 網絡擁塞
- RPC 超時

**解決方案**:
1. 增加 Gas 價格
2. 等待網絡恢復
3. 重新提交交易

### 問題：合約部署失敗

**原因**:
- 合約代碼有誤
- 構造函數參數不正確
- 合約大小超過限制

**解決方案**:
1. 檢查合約代碼
2. 驗證構造函數參數
3. 優化合約代碼

## 監控和告警

### 部署監控

- 監控部署交易狀態
- 記錄部署日誌
- 追蹤 Gas 費用

### 告警規則

- 部署失敗時發送告警
- Gas 價格異常時發送告警
- 交易掛起時發送告警

## 相關資源

- [ethers.js 文檔](https://docs.ethers.org/v6/)
- [Hardhat 文檔](https://hardhat.org/docs)
- [Sepolia 測試網](https://sepolia.dev/)
- [Etherscan](https://etherscan.io/)
