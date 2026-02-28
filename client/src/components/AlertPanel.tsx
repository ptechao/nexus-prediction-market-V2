/**
 * 告警面板組件
 * 
 * 顯示和管理系統告警。
 * 支持告警過濾、搜索和確認。
 */

import { useState, useMemo } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * 告警級別
 */
export type AlertLevel = 'INFO' | 'WARNING' | 'CRITICAL';

/**
 * 告警狀態
 */
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

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
  source?: string;
  metadata?: Record<string, any>;
}

/**
 * 告警面板組件屬性
 */
interface AlertPanelProps {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
  maxHeight?: string;
  compact?: boolean;
}

/**
 * 告警面板組件
 */
export function AlertPanel({
  alerts,
  onAcknowledge,
  onDismiss,
  maxHeight = 'max-h-96',
  compact = false,
}: AlertPanelProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<AlertLevel | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<AlertStatus | 'ALL'>('ALL');

  // 過濾告警
  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      // 搜索過濾
      const matchesSearch =
        alert.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.description.toLowerCase().includes(searchTerm.toLowerCase());

      // 級別過濾
      const matchesLevel = filterLevel === 'ALL' || alert.level === filterLevel;

      // 狀態過濾
      const matchesStatus = filterStatus === 'ALL' || alert.status === filterStatus;

      return matchesSearch && matchesLevel && matchesStatus;
    });
  }, [alerts, searchTerm, filterLevel, filterStatus]);

  // 按級別統計
  const alertStats = useMemo(() => {
    return {
      critical: alerts.filter((a) => a.level === 'CRITICAL').length,
      warning: alerts.filter((a) => a.level === 'WARNING').length,
      info: alerts.filter((a) => a.level === 'INFO').length,
    };
  }, [alerts]);

  if (compact) {
    return <CompactAlertPanel alerts={alerts} onAcknowledge={onAcknowledge} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('deployment.alerts') || 'Alerts'}</CardTitle>
        <CardDescription>
          {t('deployment.alertsDesc') || 'System alerts and notifications'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 統計信息 */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          <div className="p-2 bg-red-50 rounded border border-red-200">
            <div className="text-red-600 font-semibold">{alertStats.critical}</div>
            <div className="text-red-600 text-xs">{t('deployment.critical') || 'Critical'}</div>
          </div>
          <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
            <div className="text-yellow-600 font-semibold">{alertStats.warning}</div>
            <div className="text-yellow-600 text-xs">{t('deployment.warning') || 'Warning'}</div>
          </div>
          <div className="p-2 bg-blue-50 rounded border border-blue-200">
            <div className="text-blue-600 font-semibold">{alertStats.info}</div>
            <div className="text-blue-600 text-xs">{t('deployment.info') || 'Info'}</div>
          </div>
        </div>

        {/* 搜索和過濾 */}
        <div className="space-y-2">
          <Input
            placeholder={t('common.search') || 'Search...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-sm"
          />

          <div className="flex gap-2 flex-wrap">
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as AlertLevel | 'ALL')}
              className="text-sm px-2 py-1 border rounded"
            >
              <option value="ALL">{t('deployment.allLevels') || 'All Levels'}</option>
              <option value="CRITICAL">{t('deployment.critical') || 'Critical'}</option>
              <option value="WARNING">{t('deployment.warning') || 'Warning'}</option>
              <option value="INFO">{t('deployment.info') || 'Info'}</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AlertStatus | 'ALL')}
              className="text-sm px-2 py-1 border rounded"
            >
              <option value="ALL">{t('deployment.allStatuses') || 'All Statuses'}</option>
              <option value="ACTIVE">{t('deployment.active') || 'Active'}</option>
              <option value="ACKNOWLEDGED">{t('deployment.acknowledged') || 'Acknowledged'}</option>
              <option value="RESOLVED">{t('deployment.resolved') || 'Resolved'}</option>
            </select>
          </div>
        </div>

        {/* 告警列表 */}
        <div className={`space-y-2 ${maxHeight} overflow-y-auto`}>
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {t('deployment.noAlerts') || 'No alerts'}
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onAcknowledge={onAcknowledge}
                onDismiss={onDismiss}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 告警項目組件
 */
function AlertItem({
  alert,
  onAcknowledge,
  onDismiss,
}: {
  alert: Alert;
  onAcknowledge?: (alertId: string) => void;
  onDismiss?: (alertId: string) => void;
}) {
  const { t } = useTranslation();

  const levelConfig: Record<AlertLevel, { icon: React.ReactNode; color: string; bgColor: string }> = {
    CRITICAL: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
    },
    WARNING: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 border-yellow-200',
    },
    INFO: {
      icon: <Info className="h-4 w-4" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
    },
  };

  const config = levelConfig[alert.level];

  return (
    <div className={`p-3 rounded border ${config.bgColor} space-y-2`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <div className={config.color}>{config.icon}</div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm">{alert.title}</div>
            <div className="text-xs text-gray-600 mt-1">{alert.description}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(alert.timestamp).toLocaleString()}
            </div>
          </div>
        </div>
        <Badge
          variant={alert.status === 'ACTIVE' ? 'destructive' : 'secondary'}
          className="flex-shrink-0"
        >
          {alert.status === 'ACTIVE'
            ? t('deployment.active') || 'Active'
            : alert.status === 'ACKNOWLEDGED'
              ? t('deployment.acknowledged') || 'Acknowledged'
              : t('deployment.resolved') || 'Resolved'}
        </Badge>
      </div>

      {/* 操作按鈕 */}
      <div className="flex gap-2">
        {alert.status === 'ACTIVE' && onAcknowledge && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAcknowledge(alert.id)}
            className="text-xs"
          >
            {t('deployment.acknowledge') || 'Acknowledge'}
          </Button>
        )}
        {onDismiss && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDismiss(alert.id)}
            className="text-xs"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * 緊湊告警面板組件
 */
function CompactAlertPanel({
  alerts,
  onAcknowledge,
}: {
  alerts: Alert[];
  onAcknowledge?: (alertId: string) => void;
}) {
  const { t } = useTranslation();

  const activeAlerts = alerts.filter((a) => a.status === 'ACTIVE');
  const criticalAlerts = activeAlerts.filter((a) => a.level === 'CRITICAL');

  if (activeAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {criticalAlerts.slice(0, 3).map((alert) => (
        <div key={alert.id} className="p-3 bg-red-50 border border-red-200 rounded">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 flex-1">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-red-900">{alert.title}</div>
                <div className="text-xs text-red-700 mt-1">{alert.description}</div>
              </div>
            </div>
            {onAcknowledge && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onAcknowledge(alert.id)}
                className="text-xs flex-shrink-0"
              >
                {t('deployment.acknowledge') || 'Ack'}
              </Button>
            )}
          </div>
        </div>
      ))}

      {activeAlerts.length > 3 && (
        <div className="text-xs text-gray-600 px-3">
          {t('deployment.moreAlerts') || `+${activeAlerts.length - 3} more alerts`}
        </div>
      )}
    </div>
  );
}

export default AlertPanel;
