/**
 * Phase B - Copy Trading Service
 * 負責 Vault 管理、Follower 訂閱、份額計算、績效費分帳
 */

import { eq, and } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { db } from '../db';
import {
  copyTradingVaults,
  followerTrades,
  vaultPositions,
  users,
} from '@/drizzle/schema';
import { logAudit } from './auditLogger';
import { notifyOwner } from '../_core/notification';

export interface VaultConfig {
  leaderId: bigint;
  vaultName: string;
  initialCapital: Decimal;
  performanceFeeBps: number; // 20% = 2000
  managementFeeBps: number; // 2% = 200
  minFollowerAmount: Decimal;
  maxFollowers: number;
}

export interface FollowerSubscription {
  followerId: bigint;
  vaultId: bigint;
  depositAmount: Decimal;
}

export interface TradeExecution {
  vaultId: bigint;
  marketId: bigint;
  side: 'BUY' | 'SELL';
  amount: Decimal;
  price: Decimal;
}

export class CopyTradingService {
  /**
   * 創建 Vault
   */
  async createVault(config: VaultConfig): Promise<bigint> {
    // 驗證配置
    if (config.performanceFeeBps < 0 || config.performanceFeeBps > 10000) {
      throw new Error('Performance fee must be between 0 and 10000 bps');
    }

    if (config.initialCapital.lte(0)) {
      throw new Error('Initial capital must be greater than 0');
    }

    // 創建 Vault
    const [vault] = await db
      .insert(copyTradingVaults)
      .values({
        leaderId: config.leaderId,
        vaultName: config.vaultName,
        totalCapital: config.initialCapital,
        totalShares: config.initialCapital, // 初始 1:1
        performanceFeeBps: config.performanceFeeBps,
        managementFeeBps: config.managementFeeBps,
        minFollowerAmount: config.minFollowerAmount,
        maxFollowers: config.maxFollowers,
        currentFollowers: 0,
        isActive: true,
        createdAt: new Date(),
      })
      .returning({ id: copyTradingVaults.id });

    // 審計日誌
    await logAudit('VAULT_CREATED', 'vault', vault.id, config.leaderId, {
      vaultName: config.vaultName,
      initialCapital: config.initialCapital.toString(),
      performanceFeeBps: config.performanceFeeBps,
    });

    console.log(`[Copy Trading] Vault ${vault.id} created by leader ${config.leaderId}`);
    return vault.id;
  }

  /**
   * Follower 訂閱 Vault
   */
  async subscribeFollower(subscription: FollowerSubscription): Promise<{
    vaultId: bigint;
    followerShares: Decimal;
    totalShares: Decimal;
  }> {
    // 獲取 Vault 信息
    const vault = await db
      .select()
      .from(copyTradingVaults)
      .where(eq(copyTradingVaults.id, subscription.vaultId))
      .limit(1);

    if (!vault.length) {
      throw new Error(`Vault ${subscription.vaultId} not found`);
    }

    const vaultData = vault[0];

    // 驗證條件
    if (!vaultData.isActive) {
      throw new Error('Vault is not active');
    }

    if (subscription.depositAmount.lt(vaultData.minFollowerAmount)) {
      throw new Error(
        `Deposit amount must be at least ${vaultData.minFollowerAmount}`
      );
    }

    if (vaultData.currentFollowers >= vaultData.maxFollowers) {
      throw new Error('Vault has reached maximum followers');
    }

    // 計算份額 (按當前總份額比例)
    const totalCapital = new Decimal(vaultData.totalCapital.toString());
    const totalShares = new Decimal(vaultData.totalShares.toString());
    const depositAmount = new Decimal(subscription.depositAmount.toString());

    const followerShares = depositAmount
      .mul(totalShares)
      .div(totalCapital);

    // 更新 Vault
    const newTotalCapital = totalCapital.add(depositAmount);
    const newTotalShares = totalShares.add(followerShares);

    await db
      .update(copyTradingVaults)
      .set({
        totalCapital: newTotalCapital,
        totalShares: newTotalShares,
        currentFollowers: vaultData.currentFollowers + 1,
      })
      .where(eq(copyTradingVaults.id, subscription.vaultId));

    // 記錄 Follower Trade
    await db.insert(followerTrades).values({
      vaultId: subscription.vaultId,
      followerId: subscription.followerId,
      tradeType: 'SUBSCRIPTION',
      amount: depositAmount,
      followerShares: followerShares,
      totalShares: newTotalShares,
      isVirtual: true,
      createdAt: new Date(),
    });

    // 審計日誌
    await logAudit('FOLLOWER_SUBSCRIBED', 'vault', subscription.vaultId, subscription.followerId, {
      depositAmount: depositAmount.toString(),
      followerShares: followerShares.toString(),
      totalShares: newTotalShares.toString(),
    });

    console.log(
      `[Copy Trading] Follower ${subscription.followerId} subscribed to vault ${subscription.vaultId}`
    );

    return {
      vaultId: subscription.vaultId,
      followerShares,
      totalShares: newTotalShares,
    };
  }

  /**
   * Leader 執行交易
   */
  async executeLeaderTrade(trade: TradeExecution): Promise<void> {
    // 獲取 Vault 信息
    const vault = await db
      .select()
      .from(copyTradingVaults)
      .where(eq(copyTradingVaults.id, trade.vaultId))
      .limit(1);

    if (!vault.length) {
      throw new Error(`Vault ${trade.vaultId} not found`);
    }

    const vaultData = vault[0];
    const tradeValue = trade.amount.mul(trade.price);

    // 創建 Vault Position
    await db.insert(vaultPositions).values({
      vaultId: trade.vaultId,
      marketId: trade.marketId,
      side: trade.side,
      amount: trade.amount,
      price: trade.price,
      totalValue: tradeValue,
      status: 'OPEN',
      createdAt: new Date(),
    });

    // 審計日誌
    await logAudit('POSITION_CREATED', 'vault', trade.vaultId, vaultData.leaderId, {
      marketId: trade.marketId,
      side: trade.side,
      amount: trade.amount.toString(),
      price: trade.price.toString(),
    });

    console.log(
      `[Copy Trading] Leader executed ${trade.side} trade in vault ${trade.vaultId}`
    );
  }

  /**
   * 計算績效費
   */
  async calculatePerformanceFee(vaultId: bigint, profitAmount: Decimal): Promise<Decimal> {
    const vault = await db
      .select()
      .from(copyTradingVaults)
      .where(eq(copyTradingVaults.id, vaultId))
      .limit(1);

    if (!vault.length) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    const vaultData = vault[0];
    const performanceFeeBps = vaultData.performanceFeeBps;
    const performanceFee = profitAmount
      .mul(performanceFeeBps)
      .div(10000);

    return performanceFee;
  }

  /**
   * 分配績效費
   */
  async distributePerformanceFee(
    vaultId: bigint,
    totalProfit: Decimal
  ): Promise<{
    leaderFee: Decimal;
    followerRefund: Decimal;
  }> {
    const vault = await db
      .select()
      .from(copyTradingVaults)
      .where(eq(copyTradingVaults.id, vaultId))
      .limit(1);

    if (!vault.length) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    const vaultData = vault[0];

    // 計算 Leader 績效費 (20%)
    const leaderFee = await this.calculatePerformanceFee(vaultId, totalProfit);

    // Follower 獲得剩餘利潤
    const followerRefund = totalProfit.sub(leaderFee);

    // 記錄分配
    await logAudit('FEE_DISTRIBUTED', 'vault', vaultId, vaultData.leaderId, {
      totalProfit: totalProfit.toString(),
      leaderFee: leaderFee.toString(),
      followerRefund: followerRefund.toString(),
    });

    console.log(
      `[Copy Trading] Performance fee distributed for vault ${vaultId}: Leader ${leaderFee}, Followers ${followerRefund}`
    );

    return {
      leaderFee,
      followerRefund,
    };
  }

  /**
   * 關閉 Position
   */
  async closePosition(
    vaultId: bigint,
    positionId: bigint,
    exitPrice: Decimal
  ): Promise<{
    profit: Decimal;
    profitPercentage: Decimal;
  }> {
    // 獲取 Position
    const position = await db
      .select()
      .from(vaultPositions)
      .where(
        and(
          eq(vaultPositions.id, positionId),
          eq(vaultPositions.vaultId, vaultId)
        )
      )
      .limit(1);

    if (!position.length) {
      throw new Error(`Position ${positionId} not found`);
    }

    const pos = position[0];
    const entryValue = new Decimal(pos.totalValue.toString());
    const exitValue = pos.amount.mul(exitPrice);
    const profit = exitValue.sub(entryValue);
    const profitPercentage = profit.div(entryValue).mul(100);

    // 更新 Position 狀態
    await db
      .update(vaultPositions)
      .set({
        status: 'CLOSED',
        exitPrice: exitPrice,
        profit: profit,
        profitPercentage: profitPercentage,
        closedAt: new Date(),
      })
      .where(eq(vaultPositions.id, positionId));

    // 分配績效費
    if (profit.gt(0)) {
      await this.distributePerformanceFee(vaultId, profit);
    }

    // 審計日誌
    await logAudit('POSITION_CLOSED', 'vault', vaultId, null, {
      positionId: positionId,
      profit: profit.toString(),
      profitPercentage: profitPercentage.toString(),
    });

    console.log(
      `[Copy Trading] Position ${positionId} closed with profit ${profit} (${profitPercentage}%)`
    );

    return {
      profit,
      profitPercentage,
    };
  }

  /**
   * 獲取 Vault 詳情
   */
  async getVaultDetails(vaultId: bigint): Promise<any> {
    const vault = await db
      .select()
      .from(copyTradingVaults)
      .where(eq(copyTradingVaults.id, vaultId))
      .limit(1);

    if (!vault.length) {
      throw new Error(`Vault ${vaultId} not found`);
    }

    const vaultData = vault[0];

    // 獲取 Leader 信息
    const leader = await db
      .select()
      .from(users)
      .where(eq(users.id, vaultData.leaderId))
      .limit(1);

    // 獲取 Positions
    const positions = await db
      .select()
      .from(vaultPositions)
      .where(eq(vaultPositions.vaultId, vaultId));

    // 計算統計
    const totalProfit = positions.reduce((sum, pos) => {
      return sum.add(new Decimal(pos.profit?.toString() || '0'));
    }, new Decimal(0));

    return {
      id: vaultData.id,
      vaultName: vaultData.vaultName,
      leader: leader.length ? leader[0] : null,
      totalCapital: new Decimal(vaultData.totalCapital.toString()),
      totalShares: new Decimal(vaultData.totalShares.toString()),
      currentFollowers: vaultData.currentFollowers,
      performanceFeeBps: vaultData.performanceFeeBps,
      isActive: vaultData.isActive,
      totalProfit: totalProfit,
      positions: positions,
      createdAt: vaultData.createdAt,
    };
  }

  /**
   * 獲取 Follower 的 Vault 列表
   */
  async getFollowerVaults(followerId: bigint): Promise<any[]> {
    const trades = await db
      .select()
      .from(followerTrades)
      .where(eq(followerTrades.followerId, followerId));

    const vaultIds = [...new Set(trades.map(t => t.vaultId))];

    const vaults = await Promise.all(
      vaultIds.map(vaultId => this.getVaultDetails(vaultId))
    );

    return vaults;
  }

  /**
   * 禁用 Vault
   */
  async disableVault(vaultId: bigint): Promise<void> {
    await db
      .update(copyTradingVaults)
      .set({ isActive: false })
      .where(eq(copyTradingVaults.id, vaultId));

    await logAudit('VAULT_DISABLED', 'vault', vaultId, null, {});

    console.log(`[Copy Trading] Vault ${vaultId} disabled`);
  }
}

export const copyTradingService = new CopyTradingService();
