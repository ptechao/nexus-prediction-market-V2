/**
 * Phase A - Market Resolution Service
 * 負責市場狀態解析、去重檢查、部署隊列管理
 */

import { eq, and } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { db } from '../db';
import { markets, contractDeployQueue, auditLogs, oracleWhitelist } from '@/drizzle/schema';
import { notifyOwner } from '../_core/notification';
import { logAudit } from './auditLogger';

export interface MarketData {
  id: bigint;
  title: string;
  description?: string;
  sourceId: string;
  sourceType: 'api-football' | 'polymarket' | 'custom';
  fixtureStatus: string;
  endDate: Date;
  oracleAddress: string;
}

export interface DeploymentQueueItem {
  id: bigint;
  marketId: bigint;
  contractType: 'BinaryMarket' | 'CopyTradingVault';
  deploymentStatus: 'PENDING' | 'DEPLOYING' | 'DEPLOYED' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
  deploymentParams: {
    title: string;
    endDate: string;
    oracleAddress: string;
  };
  deployedAddress?: string;
  deploymentTx?: string;
  gasUsed?: bigint;
  gasPrice?: Decimal;
}

export class MarketResolutionService {
  /**
   * 解析市場狀態
   * 支持: OPEN, RESOLVED, CANCELLED, POSTPONED, SUSPENDED, DISPUTE_PENDING
   */
  async resolveMarketStatus(fixtureStatus: string): Promise<string> {
    const statusMap: Record<string, string> = {
      'NS': 'OPEN',           // Not Started
      'LIVE': 'OPEN',         // Live
      'FT': 'RESOLVED',       // Finished
      'AET': 'RESOLVED',      // Finished After Extra Time
      'PEN': 'RESOLVED',      // Finished After Penalties
      'PST': 'POSTPONED',     // Postponed
      'CANC': 'CANCELLED',    // Cancelled
      'ABD': 'ABANDONED',     // Abandoned
      'SUSP': 'SUSPENDED',    // Suspended
    };

    return statusMap[fixtureStatus] || 'OPEN';
  }

  /**
   * 檢查重複市場 (基於 sourceId)
   */
  async isDuplicateMarket(sourceId: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(markets)
      .where(eq(markets.sourceId, sourceId))
      .limit(1);

    return existing.length > 0;
  }

  /**
   * 驗證 Oracle 地址
   */
  async isOracleWhitelisted(oracleAddress: string): Promise<boolean> {
    const oracle = await db
      .select()
      .from(oracleWhitelist)
      .where(
        and(
          eq(oracleWhitelist.oracleAddress, oracleAddress),
          eq(oracleWhitelist.isActive, true)
        )
      )
      .limit(1);

    return oracle.length > 0;
  }

  /**
   * 創建市場並加入部署隊列
   */
  async createMarketAndQueue(marketData: MarketData): Promise<{ marketId: bigint; queueId: bigint }> {
    // 檢查重複
    if (await this.isDuplicateMarket(marketData.sourceId)) {
      throw new Error(`Market with sourceId ${marketData.sourceId} already exists`);
    }

    // 驗證 Oracle
    if (!await this.isOracleWhitelisted(marketData.oracleAddress)) {
      throw new Error(`Oracle address ${marketData.oracleAddress} is not whitelisted`);
    }

    // 解析市場狀態
    const marketStatus = await this.resolveMarketStatus(marketData.fixtureStatus);

    // 創建市場
    const [marketResult] = await db
      .insert(markets)
      .values({
        title: marketData.title,
        description: marketData.description,
        sourceId: marketData.sourceId,
        sourceType: marketData.sourceType,
        fixtureStatus: marketData.fixtureStatus,
        marketStatus: marketStatus as any,
        endDate: marketData.endDate,
        oracleAddress: marketData.oracleAddress,
        deploymentStatus: 'PENDING',
        deploymentRetries: 0,
      })
      .returning({ id: markets.id });

    const marketId = marketResult.id;

    // 加入部署隊列
    const [queueResult] = await db
      .insert(contractDeployQueue)
      .values({
        marketId,
        contractType: 'BinaryMarket',
        deploymentStatus: 'PENDING',
        retryCount: 0,
        maxRetries: 3,
        deploymentParams: JSON.stringify({
          title: marketData.title,
          endDate: marketData.endDate.toISOString(),
          oracleAddress: marketData.oracleAddress,
        }),
      })
      .returning({ id: contractDeployQueue.id });

    // 審計日誌
    await logAudit('MARKET_CREATED', 'market', marketId, null, {
      title: marketData.title,
      sourceId: marketData.sourceId,
      oracleAddress: marketData.oracleAddress,
    });

    return {
      marketId,
      queueId: queueResult.id,
    };
  }

  /**
   * 處理部署隊列 (Cron 任務)
   */
  async processDeploymentQueue(): Promise<void> {
    const pending = await db
      .select()
      .from(contractDeployQueue)
      .where(eq(contractDeployQueue.deploymentStatus, 'PENDING'))
      .limit(10);

    console.log(`[Market Resolution] Processing ${pending.length} pending deployments`);

    for (const item of pending) {
      try {
        await this.processDeploymentItem(item);
      } catch (error) {
        console.error(`[Market Resolution] Error processing deployment ${item.id}:`, error);
        await this.handleDeploymentFailure(item, error as Error);
      }
    }
  }

  /**
   * 處理單個部署項
   */
  private async processDeploymentItem(item: any): Promise<void> {
    // 更新狀態為 DEPLOYING
    await db
      .update(contractDeployQueue)
      .set({ deploymentStatus: 'DEPLOYING' })
      .where(eq(contractDeployQueue.id, item.id));

    // 獲取市場信息
    const market = await db
      .select()
      .from(markets)
      .where(eq(markets.id, item.marketId))
      .limit(1);

    if (!market.length) {
      throw new Error(`Market ${item.marketId} not found`);
    }

    // 調用部署邏輯
    const deploymentResult = await this.deployContract(item, market[0]);

    // 更新為 DEPLOYED
    await db
      .update(contractDeployQueue)
      .set({
        deploymentStatus: 'DEPLOYED',
        deployedAddress: deploymentResult.address,
        deploymentTx: deploymentResult.tx,
        gasUsed: BigInt(deploymentResult.gasUsed),
        gasPrice: new Decimal(deploymentResult.gasPrice),
      })
      .where(eq(contractDeployQueue.id, item.id));

    // 更新市場狀態
    await db
      .update(markets)
      .set({
        contractAddress: deploymentResult.address,
        deploymentStatus: 'DEPLOYED',
      })
      .where(eq(markets.id, item.marketId));

    // 審計日誌
    await logAudit('DEPLOYMENT_SUCCESS', 'deployment', item.id, null, {
      marketId: item.marketId,
      deployedAddress: deploymentResult.address,
      deploymentTx: deploymentResult.tx,
      gasUsed: deploymentResult.gasUsed,
    });

    console.log(`[Market Resolution] Deployment ${item.id} succeeded: ${deploymentResult.address}`);
  }

  /**
   * 部署合約 (Mock 實現 - 待集成真實部署邏輯)
   */
  private async deployContract(item: any, market: any): Promise<{
    address: string;
    tx: string;
    gasUsed: number;
    gasPrice: string;
  }> {
    // TODO: 集成真實部署邏輯
    // 1. 連接到 RPC
    // 2. 準備部署參數
    // 3. 發送交易
    // 4. 等待確認
    // 5. 返回合約地址

    // Mock 實現
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      address: `0x${Math.random().toString(16).slice(2)}`,
      tx: `0x${Math.random().toString(16).slice(2)}`,
      gasUsed: 150000,
      gasPrice: '50',
    };
  }

  /**
   * 處理部署失敗
   */
  private async handleDeploymentFailure(item: any, error: Error): Promise<void> {
    const newRetryCount = (item.retryCount || 0) + 1;

    if (newRetryCount >= item.maxRetries) {
      // 超過最大重試次數
      await db
        .update(contractDeployQueue)
        .set({
          deploymentStatus: 'FAILED',
          lastError: error.message,
        })
        .where(eq(contractDeployQueue.id, item.id));

      // 更新市場狀態
      await db
        .update(markets)
        .set({
          deploymentStatus: 'FAILED',
          lastDeploymentError: error.message,
        })
        .where(eq(markets.id, item.marketId));

      // 通知管理員
      await notifyOwner({
        title: 'Deployment Failed',
        content: `Deployment for market ${item.marketId} failed after ${newRetryCount} retries: ${error.message}`,
      });

      // 審計日誌
      await logAudit('DEPLOYMENT_FAILED', 'deployment', item.id, null, {
        error: error.message,
        retries: newRetryCount,
      });

      console.error(`[Market Resolution] Deployment ${item.id} failed after ${newRetryCount} retries`);
    } else {
      // 重試
      await db
        .update(contractDeployQueue)
        .set({
          deploymentStatus: 'PENDING',
          retryCount: newRetryCount,
          lastError: error.message,
        })
        .where(eq(contractDeployQueue.id, item.id));

      console.warn(`[Market Resolution] Deployment ${item.id} failed, retrying (${newRetryCount}/${item.maxRetries})`);
    }
  }

  /**
   * 重試失敗的部署
   */
  async retryFailedDeployments(): Promise<void> {
    const failed = await db
      .select()
      .from(contractDeployQueue)
      .where(
        and(
          eq(contractDeployQueue.deploymentStatus, 'FAILED'),
          // 只重試最近 24 小時的失敗
        )
      )
      .limit(5);

    for (const item of failed) {
      // 重置為 PENDING
      await db
        .update(contractDeployQueue)
        .set({
          deploymentStatus: 'PENDING',
          retryCount: 0,
          lastError: null,
        })
        .where(eq(contractDeployQueue.id, item.id));

      console.log(`[Market Resolution] Retrying deployment ${item.id}`);
    }
  }

  /**
   * 獲取部署隊列狀態
   */
  async getDeploymentQueueStatus(): Promise<{
    pending: number;
    deploying: number;
    deployed: number;
    failed: number;
  }> {
    const all = await db.select().from(contractDeployQueue);

    return {
      pending: all.filter(x => x.deploymentStatus === 'PENDING').length,
      deploying: all.filter(x => x.deploymentStatus === 'DEPLOYING').length,
      deployed: all.filter(x => x.deploymentStatus === 'DEPLOYED').length,
      failed: all.filter(x => x.deploymentStatus === 'FAILED').length,
    };
  }

  /**
   * 添加 Oracle 到白名單
   */
  async addOracleToWhitelist(oracleAddress: string, oracleName: string): Promise<void> {
    await db.insert(oracleWhitelist).values({
      oracleAddress,
      oracleName,
      isActive: true,
    });

    await logAudit('ORACLE_ADDED', 'oracle', BigInt(0), null, {
      oracleAddress,
      oracleName,
    });

    console.log(`[Market Resolution] Oracle ${oracleAddress} added to whitelist`);
  }

  /**
   * 移除 Oracle 白名單
   */
  async removeOracleFromWhitelist(oracleAddress: string): Promise<void> {
    await db
      .update(oracleWhitelist)
      .set({ isActive: false })
      .where(eq(oracleWhitelist.oracleAddress, oracleAddress));

    await logAudit('ORACLE_REMOVED', 'oracle', BigInt(0), null, {
      oracleAddress,
    });

    console.log(`[Market Resolution] Oracle ${oracleAddress} removed from whitelist`);
  }
}

export const marketResolutionService = new MarketResolutionService();
