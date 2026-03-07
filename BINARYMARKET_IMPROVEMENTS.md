# BinaryMarket.sol 合約改進文檔

## 概述

本文檔詳細說明了 NEXUS 預測市場中 BinaryMarket.sol 合約的三項重要改進：緊急取消功能、正確的結算數學邏輯，以及費用機制。這些改進提升了合約的安全性、可靠性和商業可行性。

---

## 改進 1：緊急取消功能

### 功能描述

緊急取消功能允許市場所有者在特殊情況下（如技術故障、數據不可靠等）取消市場，並允許用戶領取退款。

### 實現細節

**新增狀態**：
- `MarketStatus.CANCELLED` - 市場已取消狀態

**新增函數**：
```solidity
function cancelMarket() external onlyOwner {
    require(status == MarketStatus.OPEN, "Market already resolved or cancelled");
    status = MarketStatus.CANCELLED;
    emit MarketCancelled(block.timestamp);
}
```

**退款函數**：
```solidity
function claimRefund() external nonReentrant {
    require(status == MarketStatus.CANCELLED, "Market is not cancelled");
    require(!hasClaimedRefund[msg.sender], "Already claimed refund");
    
    uint256 refundAmount = yesBets[msg.sender] + noBets[msg.sender];
    require(refundAmount > 0, "No bets to refund");
    
    hasClaimedRefund[msg.sender] = true;
    require(usdc.transfer(msg.sender, refundAmount), "USDC refund transfer failed");
    
    emit RefundClaimed(msg.sender, refundAmount, block.timestamp);
}
```

### 使用場景

1. **技術故障**：市場數據源出現問題
2. **不公平情況**：發現市場操縱或欺詐
3. **監管要求**：根據法律要求取消市場
4. **用戶保護**：在特殊情況下保護用戶資金

### 安全性考慮

- 只有所有者可以取消市場（`onlyOwner` 修飾符）
- 用戶只能領取一次退款（`hasClaimedRefund` 映射）
- 使用 `ReentrancyGuard` 防止重入攻擊
- 退款金額為用戶的完整本金（不扣費用）

---

## 改進 2：正確的結算數學邏輯

### 問題

原始合約的結算邏輯存在以下問題：
1. 未正確處理贏家池為零的邊界情況
2. 結算公式可能導致分母為零的錯誤

### 解決方案

**正確的結算公式**：
```
payout = (userBet * totalPool) / winningPool
```

**完整的結算函數**：
```solidity
function claimWinnings() external nonReentrant {
    require(status == MarketStatus.RESOLVED, "Market is not resolved");
    require(!hasClaimed[msg.sender], "Already claimed winnings");
    
    uint256 userBet = 0;
    uint256 winningPool = 0;
    uint256 totalPool = yesPoolAmount + noPoolAmount;
    
    // 根據結算結果確定用戶的賭注和贏家池
    if (resolvedOutcome == Outcome.YES) {
        userBet = yesBets[msg.sender];
        winningPool = yesPoolAmount;
        require(userBet > 0, "No YES bets to claim");
    } else if (resolvedOutcome == Outcome.NO) {
        userBet = noBets[msg.sender];
        winningPool = noPoolAmount;
        require(userBet > 0, "No NO bets to claim");
    } else {
        revert("Market outcome is unresolved");
    }
    
    hasClaimed[msg.sender] = true;
    
    uint256 winnings = 0;
    
    // 邊界情況：如果贏家池為 0，退款用戶的本金
    if (winningPool == 0) {
        winnings = userBet;
    } else {
        // 標準結算：(userBet * totalPool) / winningPool
        winnings = (userBet * totalPool) / winningPool;
    }
    
    // 計算並扣除協議費用
    uint256 feeAmount = (winnings * feeBps) / 10000;
    uint256 netPayout = winnings - feeAmount;
    
    // 將淨結算轉移給用戶
    require(usdc.transfer(msg.sender, netPayout), "USDC transfer to user failed");
    
    // 將費用轉移到金庫
    if (feeAmount > 0) {
        require(usdc.transfer(treasury, feeAmount), "USDC transfer to treasury failed");
    }
    
    emit WinningsClaimed(msg.sender, winnings, feeAmount, netPayout, block.timestamp);
}
```

### 邊界情況處理

**場景**：沒有人在贏家結果上下注（贏家池 = 0）

**例子**：
- YES 池：0 USDC（沒人下注 YES）
- NO 池：1000 USDC
- 市場結算為 YES

**結果**：
- 所有 NO 下注者獲得本金退款（1000 USDC）
- 不收取費用
- 防止除以零錯誤

### 結算示例

**場景 1：正常情況**
```
YES 池：1000 USDC
NO 池：2000 USDC
總池：3000 USDC
用戶 YES 下注：500 USDC
市場結算為 YES

結算計算：
payout = (500 * 3000) / 1000 = 1500 USDC

費用（2%）：
fee = (1500 * 200) / 10000 = 30 USDC

淨結算：
net = 1500 - 30 = 1470 USDC
```

**場景 2：邊界情況（贏家池 = 0）**
```
YES 池：0 USDC
NO 池：1000 USDC
市場結算為 YES

結算計算：
winnings = userBet = 500 USDC（本金）
fee = 0（無費用）
net = 500 USDC
```

---

## 改進 3：費用機制

### 商業模式

費用機制是 NEXUS 的核心商業模式。協議從每筆獲勝的結算中收取一定比例的費用，並將其發送到金庫地址。

### 實現細節

**費用狀態變量**：
```solidity
// 費用（基點）- 例如 200 = 2%
uint256 public feeBps;
address public treasury;
```

**費用計算**：
```solidity
uint256 feeAmount = (winnings * feeBps) / 10000;
uint256 netPayout = winnings - feeAmount;
```

**費用管理函數**：
```solidity
// 更新費用（基點）
function setFeeBps(uint256 newFeeBps) external onlyOwner {
    require(newFeeBps <= 10000, "Fee cannot exceed 100%");
    feeBps = newFeeBps;
    emit FeeUpdated(newFeeBps, block.timestamp);
}

// 更新金庫地址
function setTreasury(address newTreasury) external onlyOwner {
    require(newTreasury != address(0), "Invalid treasury address");
    treasury = newTreasury;
    emit TreasuryUpdated(newTreasury, block.timestamp);
}
```

### 費用流程

1. **用戶下注**：用戶將 USDC 存入市場
2. **市場結算**：市場所有者解決結果
3. **領取獲勝**：獲勝者領取獎金
4. **費用扣除**：協議自動從獎金中扣除費用
5. **金庫轉移**：費用自動轉移到金庫地址

### 費用示例

**基點轉換表**：
| 基點 | 百分比 | 例子 |
|------|--------|------|
| 100 | 1% | 1000 USDC 獎金 → 10 USDC 費用 |
| 200 | 2% | 1000 USDC 獎金 → 20 USDC 費用 |
| 250 | 2.5% | 1000 USDC 獎金 → 25 USDC 費用 |
| 500 | 5% | 1000 USDC 獎金 → 50 USDC 費用 |
| 1000 | 10% | 1000 USDC 獎金 → 100 USDC 費用 |

**完整的費用示例**：
```
市場配置：
- YES 池：1000 USDC
- NO 池：2000 USDC
- 費用：2%（200 基點）

用戶 A 下注 YES：500 USDC
用戶 B 下注 YES：500 USDC
用戶 C 下注 NO：2000 USDC

市場結算為 YES：

用戶 A 的結算：
- 原始獎金：(500 * 3000) / 1000 = 1500 USDC
- 費用：(1500 * 200) / 10000 = 30 USDC
- 淨結算：1500 - 30 = 1470 USDC

用戶 B 的結算：
- 原始獎金：(500 * 3000) / 1000 = 1500 USDC
- 費用：(1500 * 200) / 10000 = 30 USDC
- 淨結算：1500 - 30 = 1470 USDC

金庫收入：
- 用戶 A 費用：30 USDC
- 用戶 B 費用：30 USDC
- 總費用：60 USDC
```

### 費用靈活性

協議所有者可以根據市場情況調整費用：

```solidity
// 調整為 1%
market.setFeeBps(100);

// 調整為 3%
market.setFeeBps(300);

// 調整為 5%
market.setFeeBps(500);
```

---

## 新增事件

### MarketCancelled
```solidity
event MarketCancelled(uint256 timestamp);
```
當市場被取消時發出。

### RefundClaimed
```solidity
event RefundClaimed(
    address indexed user,
    uint256 amount,
    uint256 timestamp
);
```
當用戶領取退款時發出。

### WinningsClaimed（更新）
```solidity
event WinningsClaimed(
    address indexed winner,
    uint256 winnings,
    uint256 feeAmount,
    uint256 netPayout,
    uint256 timestamp
);
```
包含費用信息的完整事件。

### FeeUpdated
```solidity
event FeeUpdated(uint256 newFeeBps, uint256 timestamp);
```
當費用更新時發出。

### TreasuryUpdated
```solidity
event TreasuryUpdated(address newTreasury, uint256 timestamp);
```
當金庫地址更新時發出。

---

## 新增視圖函數

### calculateExpectedPayout
```solidity
function calculateExpectedPayout(uint256 betAmount, bool isYes) 
    external view returns (uint256 expectedPayout, uint256 expectedFee)
```
計算假設下注的預期結算和費用。

### getMarketDetails
```solidity
function getMarketDetails() external view returns (
    uint256 id,
    string memory title,
    uint256 end,
    uint256 yesPool,
    uint256 noPool,
    string memory currentStatus,
    uint256 currentFeeBps
)
```
獲取市場的完整詳細信息。

### getCollectedFees
```solidity
function getCollectedFees() external view returns (uint256)
```
獲取已收集的費用總額（用於會計）。

---

## 部署配置

### 構造函數參數

```solidity
constructor(
    address _usdc,           // USDC 代幣地址
    address _treasury,       // 金庫地址（接收費用）
    uint256 _marketId,       // 市場 ID
    string memory _eventTitle, // 事件標題
    uint256 _endTime,        // 市場結束時間
    uint256 _feeBps          // 費用（基點）
)
```

### 部署示例

```solidity
// Polygon 主網
BinaryMarket market = new BinaryMarket(
    0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174, // USDC (Polygon)
    0x1234567890123456789012345678901234567890, // 金庫地址
    1,                                            // 市場 ID
    "Lakers vs Warriors Game 5",                 // 事件標題
    1708000000,                                   // 結束時間（Unix 時間戳）
    200                                           // 2% 費用
);
```

---

## 安全性考慮

### 重入保護
所有狀態修改函數都使用 `ReentrancyGuard` 修飾符防止重入攻擊。

### 訪問控制
- 只有所有者可以取消市場
- 只有所有者可以解決市場
- 只有所有者可以更新費用和金庫

### 輸入驗證
- 驗證 USDC 地址不為零
- 驗證金庫地址不為零
- 驗證費用不超過 100%
- 驗證結束時間在未來

### 邊界情況
- 處理贏家池為零的情況
- 防止雙重領取
- 防止在市場未結束前結算

---

## 升級路徑

### 第一階段（MVP）
- 簡單的管理員解決機制
- 固定費用率
- 基本的緊急取消

### 第二階段
- 集成 UMA 或 Chainlink 預言機
- 動態費用機制
- 更複雜的市場類型

### 第三階段
- 跨鏈支持
- 高級風險管理
- 自動化市場製造商（AMM）

---

## 測試覆蓋

完整的測試套件涵蓋以下場景：

1. **緊急取消**：市場取消和退款流程
2. **結算數學**：正確的結算計算
3. **費用機制**：費用扣除和轉移
4. **邊界情況**：贏家池為零
5. **安全性**：重入保護、訪問控制
6. **集成**：完整的工作流程

---

## 結論

這三項改進使 BinaryMarket.sol 合約更加健壯、安全和可商業化。緊急取消功能提供了風險管理工具，正確的結算邏輯確保了公平性，而費用機制則建立了可持續的商業模式。
