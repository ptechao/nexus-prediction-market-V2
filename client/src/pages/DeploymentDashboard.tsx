/**
 * 部署管理儀表板
 * 
 * 用於管理和監控智能合約部署。
 * 顯示部署列表、狀態、歷史和告警。
 */

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * 部署狀態類型
 */
type DeploymentStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 部署項目類型
 */
interface DeploymentItem {
  id: string;
  type: 'BinaryMarket' | 'CopyTradingVault';
  status: DeploymentStatus;
  contractAddress?: string;
  transactionHash?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
  progress: number;
}

/**
 * 告警項目類型
 */
interface AlertItem {
  id: string;
  title: string;
  description: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  timestamp: number;
}

/**
 * 部署管理儀表板組件
 */
export default function DeploymentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [deployments, setDeployments] = useState<DeploymentItem[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [activeTab, setActiveTab] = useState('deployments');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 查詢部署列表
  const { data: deploymentsData, isLoading: deploymentsLoading, refetch: refetchDeployments } =
    trpc.phaseADeployment?.getAllDeployments?.useQuery?.() || {};

  // 查詢告警列表
  const { data: alertsData, isLoading: alertsLoading, refetch: refetchAlerts } =
    trpc.phaseADeployment?.getAlerts?.useQuery?.() || {};

  // 查詢部署統計
  const { data: statsData } = trpc.phaseADeployment?.getDeploymentStats?.useQuery?.() || {};

  // 確認告警
  const acknowledgeAlertMutation = trpc.phaseADeployment?.acknowledgeAlert?.useMutation?.();

  // 重試部署
  const retryDeploymentMutation = trpc.phaseADeployment?.retryFailedDeployment?.useMutation?.();

  // 更新部署列表
  useEffect(() => {
    if (deploymentsData?.deployments) {
      setDeployments(deploymentsData.deployments);
    }
  }, [deploymentsData]);

  // 更新告警列表
  useEffect(() => {
    if (alertsData?.alerts) {
      setAlerts(alertsData.alerts);
    }
  }, [alertsData]);

  // 刷新數據
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchDeployments?.(), refetchAlerts?.()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // 確認告警
  const handleAcknowledgeAlert = async (alertId: string) => {
    try {
      await acknowledgeAlertMutation?.mutateAsync?.({ alertId });
      await refetchAlerts?.();
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  };

  // 重試部署
  const handleRetryDeployment = async (deploymentId: string) => {
    try {
      await retryDeploymentMutation?.mutateAsync?.({ deploymentId });
      await refetchDeployments?.();
    } catch (error) {
      console.error('Failed to retry deployment:', error);
    }
  };

  // 檢查用戶權限
  if (user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{t('errors.accessDenied') || 'Access Denied'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* 頁面標題 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('deployment.dashboard') || 'Deployment Dashboard'}</h1>
          <p className="text-gray-600 mt-2">
            {t('deployment.dashboardDesc') || 'Manage and monitor smart contract deployments'}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? t('common.refreshing') || 'Refreshing...' : t('common.refresh') || 'Refresh'}
        </Button>
      </div>

      {/* 統計卡片 */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('deployment.totalDeployments') || 'Total Deployments'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statsData.totalDeployments}</div>
              <p className="text-xs text-gray-500 mt-1">
                {t('deployment.allTime') || 'All time'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('deployment.successfulDeployments') || 'Successful'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statsData.successfulDeployments}</div>
              <p className="text-xs text-gray-500 mt-1">
                {statsData.successRate?.toFixed(2)}% {t('deployment.successRate') || 'success rate'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('deployment.failedDeployments') || 'Failed'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statsData.failedDeployments}</div>
              <p className="text-xs text-gray-500 mt-1">
                {t('deployment.needsAttention') || 'Needs attention'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {t('deployment.pendingDeployments') || 'Pending'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statsData.pendingDeployments}</div>
              <p className="text-xs text-gray-500 mt-1">
                {t('deployment.inQueue') || 'In queue'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 標籤頁 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="deployments">
            {t('deployment.deployments') || 'Deployments'}
          </TabsTrigger>
          <TabsTrigger value="alerts">
            {t('deployment.alerts') || 'Alerts'}
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* 部署列表標籤 */}
        <TabsContent value="deployments" className="space-y-4">
          {deploymentsLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">{t('common.loading') || 'Loading...'}</p>
              </CardContent>
            </Card>
          ) : deployments.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center">
                  {t('deployment.noDeployments') || 'No deployments yet'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {deployments.map((deployment) => (
                <DeploymentCard
                  key={deployment.id}
                  deployment={deployment}
                  onRetry={() => handleRetryDeployment(deployment.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* 告警列表標籤 */}
        <TabsContent value="alerts" className="space-y-4">
          {alertsLoading ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500">{t('common.loading') || 'Loading...'}</p>
              </CardContent>
            </Card>
          ) : alerts.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center">
                  {t('deployment.noAlerts') || 'No alerts'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <AlertCard
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
                  t={t}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * 部署卡片組件
 */
function DeploymentCard({
  deployment,
  onRetry,
  t,
}: {
  deployment: DeploymentItem;
  onRetry: () => void;
  t: (key: string) => string;
}) {
  const statusConfig: Record<DeploymentStatus, { icon: React.ReactNode; color: string; label: string }> = {
    pending: {
      icon: <Clock className="h-4 w-4" />,
      color: 'text-yellow-600',
      label: t('deployment.pending') || 'Pending',
    },
    processing: {
      icon: <RefreshCw className="h-4 w-4 animate-spin" />,
      color: 'text-blue-600',
      label: t('deployment.processing') || 'Processing',
    },
    completed: {
      icon: <CheckCircle className="h-4 w-4" />,
      color: 'text-green-600',
      label: t('deployment.completed') || 'Completed',
    },
    failed: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-red-600',
      label: t('deployment.failed') || 'Failed',
    },
  };

  const config = statusConfig[deployment.status];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={config.color}>{config.icon}</div>
            <div>
              <CardTitle className="text-base">
                {deployment.type === 'BinaryMarket'
                  ? t('deployment.binaryMarket') || 'Binary Market'
                  : t('deployment.copyTradingVault') || 'Copy Trading Vault'}
              </CardTitle>
              <CardDescription className="text-xs">
                {new Date(deployment.createdAt).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <Badge variant={deployment.status === 'completed' ? 'default' : 'secondary'}>
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 進度條 */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>{t('deployment.progress') || 'Progress'}</span>
            <span>{deployment.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${deployment.progress}%` }}
            />
          </div>
        </div>

        {/* 合約地址 */}
        {deployment.contractAddress && (
          <div className="text-xs">
            <span className="text-gray-600">{t('deployment.contractAddress') || 'Contract Address'}:</span>
            <code className="block mt-1 p-2 bg-gray-100 rounded text-gray-800 break-all">
              {deployment.contractAddress}
            </code>
          </div>
        )}

        {/* 交易哈希 */}
        {deployment.transactionHash && (
          <div className="text-xs">
            <span className="text-gray-600">{t('deployment.transactionHash') || 'Transaction Hash'}:</span>
            <code className="block mt-1 p-2 bg-gray-100 rounded text-gray-800 break-all">
              {deployment.transactionHash}
            </code>
          </div>
        )}

        {/* 錯誤信息 */}
        {deployment.error && (
          <div className="text-xs p-2 bg-red-50 border border-red-200 rounded text-red-700">
            {deployment.error}
          </div>
        )}

        {/* 操作按鈕 */}
        {deployment.status === 'failed' && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="w-full"
          >
            {t('deployment.retry') || 'Retry'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 告警卡片組件
 */
function AlertCard({
  alert,
  onAcknowledge,
  t,
}: {
  alert: AlertItem;
  onAcknowledge: () => void;
  t: (key: string) => string;
}) {
  const levelConfig: Record<string, { icon: React.ReactNode; color: string }> = {
    INFO: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
    WARNING: {
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    },
    CRITICAL: {
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-red-600 bg-red-50 border-red-200',
    },
  };

  const config = levelConfig[alert.level];

  return (
    <Card className={`border ${config.color}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={config.color}>{config.icon}</div>
            <div>
              <CardTitle className="text-base">{alert.title}</CardTitle>
              <CardDescription className="text-xs mt-1">
                {new Date(alert.timestamp).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <Badge variant={alert.status === 'ACTIVE' ? 'destructive' : 'secondary'}>
            {alert.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-gray-700">{alert.description}</p>
        {alert.status === 'ACTIVE' && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAcknowledge}
            className="w-full"
          >
            {t('deployment.acknowledge') || 'Acknowledge'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
