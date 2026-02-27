/**
 * 部署隊列處理 Cron 任務
 * 
 * 每 30 秒檢查一次部署隊列，批量處理待部署項目。
 * 支持失敗重試和告警通知。
 */

import { db } from '../db';
import { BlockchainDeploymentService } from '../services/blockchainDeployment';
import { AlertService, AlertLevel } from '../services/alertService';

/**
 * 部署隊列項目
 */
export interface DeploymentQueueItem {
  id: string;
  type: 'BinaryMarket' | 'CopyTradingVault';
  params: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  maxRetries: number;
  createdAt: number;
  updatedAt: number;
  error?: string;
}

/**
 * 部署隊列處理器
 */
export class DeploymentQueueProcessor {
  private deploymentService: BlockchainDeploymentService;
  private alertService: AlertService;
  private isProcessing: boolean = false;
  private batchSize: number = 5;

  constructor(
    deploymentService: BlockchainDeploymentService,
    alertService: AlertService
  ) {
    this.deploymentService = deploymentService;
    this.alertService = alertService;
  }

  /**
   * 處理部署隊列
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing) {
      console.log('Deployment queue is already being processed');
      return;
    }

    this.isProcessing = true;

    try {
      // 獲取待處理的隊列項目
      const items = await this.getQueueItems('pending', this.batchSize);

      if (items.length === 0) {
        console.log('No pending deployment items');
        return;
      }

      console.log(`Processing ${items.length} deployment items`);

      // 處理每個項目
      for (const item of items) {
        await this.processQueueItem(item);
      }

      // 重試失敗的項目
      const failedItems = await this.getQueueItems('failed', this.batchSize);
      for (const item of failedItems) {
        if (item.retryCount < item.maxRetries) {
          await this.retryQueueItem(item);
        } else {
          await this.markQueueItemFailed(item, 'Max retries exceeded');
        }
      }
    } catch (error) {
      console.error('Error processing deployment queue:', error);
      this.alertService.createAlert(
        'Deployment Queue Processing Error',
        `Failed to process deployment queue: ${(error as Error).message}`,
        AlertLevel.CRITICAL,
        'deployment-queue'
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 處理單個隊列項目
   * 
   * @param item - 隊列項目
   */
  private async processQueueItem(item: DeploymentQueueItem): Promise<void> {
    try {
      // 標記為處理中
      await this.updateQueueItemStatus(item.id, 'processing');

      // 執行部署
      let result;
      if (item.type === 'BinaryMarket') {
        result = await this.deploymentService.deployBinaryMarketContract(item.params);
      } else if (item.type === 'CopyTradingVault') {
        result = await this.deploymentService.deployCopyTradingVaultContract(item.params);
      } else {
        throw new Error(`Unknown deployment type: ${item.type}`);
      }

      // 保存部署結果
      await this.saveDeploymentResult(item, result);

      // 標記為完成
      await this.updateQueueItemStatus(item.id, 'completed');

      // 發送成功通知
      this.alertService.createAlert(
        `${item.type} Deployment Successful`,
        `Contract deployed successfully at ${result.contractAddress}`,
        AlertLevel.INFO,
        'deployment-queue',
        { contractAddress: result.contractAddress, transactionHash: result.transactionHash }
      );
    } catch (error) {
      console.error(`Error processing queue item ${item.id}:`, error);

      // 標記為失敗
      await this.markQueueItemFailed(item, (error as Error).message);

      // 發送失敗通知
      this.alertService.createAlert(
        `${item.type} Deployment Failed`,
        `Deployment failed: ${(error as Error).message}`,
        AlertLevel.WARNING,
        'deployment-queue',
        { queueItemId: item.id }
      );
    }
  }

  /**
   * 重試隊列項目
   * 
   * @param item - 隊列項目
   */
  private async retryQueueItem(item: DeploymentQueueItem): Promise<void> {
    console.log(`Retrying deployment item ${item.id} (attempt ${item.retryCount + 1}/${item.maxRetries})`);

    // 增加重試計數
    item.retryCount++;

    // 重新處理
    await this.processQueueItem(item);
  }

  /**
   * 獲取隊列項目
   * 
   * @param status - 項目狀態
   * @param limit - 限制數量
   * @returns 隊列項目列表
   */
  private async getQueueItems(
    status: string,
    limit: number
  ): Promise<DeploymentQueueItem[]> {
    // 實現數據庫查詢邏輯
    // 這裡是示例實現
    return [];
  }

  /**
   * 更新隊列項目狀態
   * 
   * @param itemId - 項目 ID
   * @param status - 新狀態
   */
  private async updateQueueItemStatus(itemId: string, status: string): Promise<void> {
    // 實現數據庫更新邏輯
    console.log(`Updated queue item ${itemId} status to ${status}`);
  }

  /**
   * 標記隊列項目為失敗
   * 
   * @param item - 隊列項目
   * @param error - 錯誤信息
   */
  private async markQueueItemFailed(item: DeploymentQueueItem, error: string): Promise<void> {
    item.error = error;
    await this.updateQueueItemStatus(item.id, 'failed');
  }

  /**
   * 保存部署結果
   * 
   * @param item - 隊列項目
   * @param result - 部署結果
   */
  private async saveDeploymentResult(item: DeploymentQueueItem, result: any): Promise<void> {
    // 實現數據庫保存邏輯
    console.log(`Saved deployment result for item ${item.id}:`, result);
  }

  /**
   * 設置批處理大小
   * 
   * @param size - 批處理大小
   */
  setBatchSize(size: number): void {
    this.batchSize = size;
  }

  /**
   * 獲取隊列統計
   * 
   * @returns 隊列統計信息
   */
  async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    // 實現統計邏輯
    return {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
  }
}

/**
 * 創建部署隊列處理器實例
 * 
 * @param deploymentService - 部署服務
 * @param alertService - 告警服務
 * @returns 隊列處理器實例
 */
export function createDeploymentQueueProcessor(
  deploymentService: BlockchainDeploymentService,
  alertService: AlertService
): DeploymentQueueProcessor {
  return new DeploymentQueueProcessor(deploymentService, alertService);
}

/**
 * 啟動部署隊列處理 Cron 任務
 * 
 * @param processor - 隊列處理器
 * @param intervalMs - 檢查間隔（毫秒）
 * @returns 停止函數
 */
export function startDeploymentQueueCron(
  processor: DeploymentQueueProcessor,
  intervalMs: number = 30000
): () => void {
  console.log(`Starting deployment queue processor (interval: ${intervalMs}ms)`);

  const intervalId = setInterval(async () => {
    try {
      await processor.processQueue();
    } catch (error) {
      console.error('Error in deployment queue cron:', error);
    }
  }, intervalMs);

  // 返回停止函數
  return () => {
    console.log('Stopping deployment queue processor');
    clearInterval(intervalId);
  };
}

export default {
  DeploymentQueueProcessor,
  createDeploymentQueueProcessor,
  startDeploymentQueueCron,
};
