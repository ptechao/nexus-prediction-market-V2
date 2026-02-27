/**
 * 告警服務
 * 
 * 用於創建、觸發和管理告警。
 * 支持多個告警級別和通知渠道。
 * 提供告警去重、升級和歷史查詢功能。
 */

/**
 * 告警級別
 */
export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

/**
 * 通知渠道
 */
export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SLACK = 'SLACK',
  SMS = 'SMS',
}

/**
 * 告警狀態
 */
export enum AlertStatus {
  ACTIVE = 'ACTIVE',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
  RESOLVED = 'RESOLVED',
}

/**
 * 告警對象
 */
export interface Alert {
  id: string;
  title: string;
  description: string;
  level: AlertLevel;
  status: AlertStatus;
  timestamp: number;
  source: string;
  metadata?: Record<string, any>;
}

/**
 * 告警規則
 */
export interface AlertRule {
  id: string;
  name: string;
  condition: (data: any) => boolean;
  level: AlertLevel;
  channels: NotificationChannel[];
  enabled: boolean;
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  email?: {
    enabled: boolean;
    recipients: string[];
    from: string;
  };
  slack?: {
    enabled: boolean;
    webhookUrl: string;
    channel: string;
  };
  sms?: {
    enabled: boolean;
    recipients: string[];
    provider: string;
  };
}

/**
 * 告警服務類
 */
export class AlertService {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private notificationConfig: NotificationConfig;
  private deduplicationWindow: number = 60000; // 1 分鐘
  private lastAlertTime: Map<string, number> = new Map();

  constructor(notificationConfig: NotificationConfig) {
    this.notificationConfig = notificationConfig;
  }

  /**
   * 創建告警
   * 
   * @param title - 告警標題
   * @param description - 告警描述
   * @param level - 告警級別
   * @param source - 告警來源
   * @param metadata - 額外元數據
   * @returns 告警對象
   */
  createAlert(
    title: string,
    description: string,
    level: AlertLevel,
    source: string,
    metadata?: Record<string, any>
  ): Alert {
    const alert: Alert = {
      id: this.generateAlertId(),
      title,
      description,
      level,
      status: AlertStatus.ACTIVE,
      timestamp: Date.now(),
      source,
      metadata,
    };

    this.alerts.set(alert.id, alert);
    return alert;
  }

  /**
   * 觸發告警
   * 
   * @param alert - 告警對象
   * @returns 是否成功觸發
   */
  async triggerAlert(alert: Alert): Promise<boolean> {
    // 檢查去重
    if (!this.shouldTriggerAlert(alert)) {
      console.log(`Alert deduplicated: ${alert.id}`);
      return false;
    }

    // 記錄觸發時間
    const deduplicationKey = `${alert.source}:${alert.title}`;
    this.lastAlertTime.set(deduplicationKey, Date.now());

    // 發送通知
    const channels = this.getChannelsForLevel(alert.level);
    const results = await Promise.all(
      channels.map((channel) => this.sendNotification(alert, channel))
    );

    return results.every((result) => result);
  }

  /**
   * 確認告警
   * 
   * @param alertId - 告警 ID
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = AlertStatus.ACKNOWLEDGED;
    }
  }

  /**
   * 解決告警
   * 
   * @param alertId - 告警 ID
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = AlertStatus.RESOLVED;
    }
  }

  /**
   * 升級告警
   * 
   * @param alertId - 告警 ID
   * @param newLevel - 新的告警級別
   */
  escalateAlert(alertId: string, newLevel: AlertLevel): void {
    const alert = this.alerts.get(alertId);
    if (alert && this.isHigherLevel(newLevel, alert.level)) {
      alert.level = newLevel;
      // 重新觸發告警
      this.triggerAlert(alert);
    }
  }

  /**
   * 獲取告警歷史
   * 
   * @param source - 告警來源（可選）
   * @param status - 告警狀態（可選）
   * @param limit - 限制數量
   * @returns 告警列表
   */
  getAlertHistory(
    source?: string,
    status?: AlertStatus,
    limit: number = 100
  ): Alert[] {
    let alerts = Array.from(this.alerts.values());

    if (source) {
      alerts = alerts.filter((alert) => alert.source === source);
    }

    if (status) {
      alerts = alerts.filter((alert) => alert.status === status);
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  /**
   * 添加告警規則
   * 
   * @param rule - 告警規則
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * 移除告警規則
   * 
   * @param ruleId - 規則 ID
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * 評估規則
   * 
   * @param data - 評估數據
   * @returns 觸發的規則列表
   */
  evaluateRules(data: any): Alert[] {
    const triggeredAlerts: Alert[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(data)) {
          const alert = this.createAlert(
            rule.name,
            `Rule triggered: ${rule.name}`,
            rule.level,
            'rule-engine',
            { ruleId: rule.id, data }
          );
          triggeredAlerts.push(alert);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    return triggeredAlerts;
  }

  /**
   * 獲取告警統計
   * 
   * @returns 統計信息
   */
  getStatistics(): {
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    byLevel: Record<AlertLevel, number>;
  } {
    const alerts = Array.from(this.alerts.values());

    return {
      total: alerts.length,
      active: alerts.filter((a) => a.status === AlertStatus.ACTIVE).length,
      acknowledged: alerts.filter((a) => a.status === AlertStatus.ACKNOWLEDGED).length,
      resolved: alerts.filter((a) => a.status === AlertStatus.RESOLVED).length,
      byLevel: {
        [AlertLevel.INFO]: alerts.filter((a) => a.level === AlertLevel.INFO).length,
        [AlertLevel.WARNING]: alerts.filter((a) => a.level === AlertLevel.WARNING).length,
        [AlertLevel.CRITICAL]: alerts.filter((a) => a.level === AlertLevel.CRITICAL).length,
      },
    };
  }

  /**
   * 檢查是否應該觸發告警（去重）
   * 
   * @param alert - 告警對象
   * @returns 是否應該觸發
   */
  private shouldTriggerAlert(alert: Alert): boolean {
    const deduplicationKey = `${alert.source}:${alert.title}`;
    const lastTime = this.lastAlertTime.get(deduplicationKey);

    if (!lastTime) {
      return true;
    }

    return Date.now() - lastTime > this.deduplicationWindow;
  }

  /**
   * 根據級別獲取通知渠道
   * 
   * @param level - 告警級別
   * @returns 通知渠道列表
   */
  private getChannelsForLevel(level: AlertLevel): NotificationChannel[] {
    switch (level) {
      case AlertLevel.CRITICAL:
        return [
          NotificationChannel.EMAIL,
          NotificationChannel.SLACK,
          NotificationChannel.SMS,
        ];
      case AlertLevel.WARNING:
        return [NotificationChannel.EMAIL, NotificationChannel.SLACK];
      case AlertLevel.INFO:
        return [NotificationChannel.SLACK];
      default:
        return [];
    }
  }

  /**
   * 發送通知
   * 
   * @param alert - 告警對象
   * @param channel - 通知渠道
   * @returns 是否成功發送
   */
  private async sendNotification(alert: Alert, channel: NotificationChannel): Promise<boolean> {
    try {
      switch (channel) {
        case NotificationChannel.EMAIL:
          return await this.sendEmailNotification(alert);
        case NotificationChannel.SLACK:
          return await this.sendSlackNotification(alert);
        case NotificationChannel.SMS:
          return await this.sendSmsNotification(alert);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to send ${channel} notification:`, error);
      return false;
    }
  }

  /**
   * 發送 Email 通知
   * 
   * @param alert - 告警對象
   * @returns 是否成功發送
   */
  private async sendEmailNotification(alert: Alert): Promise<boolean> {
    if (!this.notificationConfig.email?.enabled) {
      return false;
    }

    console.log(`Sending email notification for alert: ${alert.id}`);
    // 實現 Email 發送邏輯
    return true;
  }

  /**
   * 發送 Slack 通知
   * 
   * @param alert - 告警對象
   * @returns 是否成功發送
   */
  private async sendSlackNotification(alert: Alert): Promise<boolean> {
    if (!this.notificationConfig.slack?.enabled) {
      return false;
    }

    console.log(`Sending Slack notification for alert: ${alert.id}`);
    // 實現 Slack 發送邏輯
    return true;
  }

  /**
   * 發送 SMS 通知
   * 
   * @param alert - 告警對象
   * @returns 是否成功發送
   */
  private async sendSmsNotification(alert: Alert): Promise<boolean> {
    if (!this.notificationConfig.sms?.enabled) {
      return false;
    }

    console.log(`Sending SMS notification for alert: ${alert.id}`);
    // 實現 SMS 發送邏輯
    return true;
  }

  /**
   * 檢查是否是更高級別
   * 
   * @param newLevel - 新級別
   * @param currentLevel - 當前級別
   * @returns 是否是更高級別
   */
  private isHigherLevel(newLevel: AlertLevel, currentLevel: AlertLevel): boolean {
    const levelOrder = {
      [AlertLevel.INFO]: 0,
      [AlertLevel.WARNING]: 1,
      [AlertLevel.CRITICAL]: 2,
    };
    return levelOrder[newLevel] > levelOrder[currentLevel];
  }

  /**
   * 生成告警 ID
   * 
   * @returns 告警 ID
   */
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 設置去重窗口
   * 
   * @param windowMs - 窗口時間（毫秒）
   */
  setDeduplicationWindow(windowMs: number): void {
    this.deduplicationWindow = windowMs;
  }

  /**
   * 清空所有告警
   */
  clearAllAlerts(): void {
    this.alerts.clear();
    this.lastAlertTime.clear();
  }
}

/**
 * 創建告警服務實例
 * 
 * @param notificationConfig - 通知配置
 * @returns 告警服務實例
 */
export function createAlertService(notificationConfig: NotificationConfig): AlertService {
  return new AlertService(notificationConfig);
}

export default {
  AlertService,
  AlertLevel,
  AlertStatus,
  NotificationChannel,
  createAlertService,
};
