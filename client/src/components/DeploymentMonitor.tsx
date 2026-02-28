/**
 * 實時監控組件
 * 
 * 顯示部署的實時監控數據。
 * 包括 Gas 價格、部署進度、交易狀態等。
 */

import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react';

/**
 * 監控數據類型
 */
export interface MonitoringData {
  gasPrice: number; // Wei
  gasLimit: number;
  estimatedCost: number; // USD
  deploymentProgress: number; // 0-100
  transactionStatus: 'pending' | 'confirmed' | 'failed';
  blockNumber: number;
  confirmations: number;
  estimatedTime: number; // 秒
  ethPrice: number; // USD
}

/**
 * 實時監控組件屬性
 */
interface DeploymentMonitorProps {
  data: MonitoringData;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * 實時監控組件
 */
export function DeploymentMonitor({
  data,
  autoRefresh = true,
  refreshInterval = 5000,
}: DeploymentMonitorProps) {
  const { t } = useTranslation();
  const [displayData, setDisplayData] = useState(data);
  const [isUpdating, setIsUpdating] = useState(false);

  // 自動刷新數據
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setIsUpdating(true);
      // 模擬數據更新
      setTimeout(() => {
        setDisplayData((prev) => ({
          ...prev,
          gasPrice: prev.gasPrice * (0.95 + Math.random() * 0.1),
          deploymentProgress: Math.min(100, prev.deploymentProgress + Math.random() * 10),
          confirmations: Math.min(3, prev.confirmations + (Math.random() > 0.7 ? 1 : 0)),
        }));
        setIsUpdating(false);
      }, 500);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // 更新顯示數據
  useEffect(() => {
    setDisplayData(data);
  }, [data]);

  const gasPriceGwei = displayData.gasPrice / 1e9;
  const transactionStatusConfig = {
    pending: { color: 'text-yellow-600', label: t('deployment.pending') || 'Pending' },
    confirmed: { color: 'text-green-600', label: t('deployment.confirmed') || 'Confirmed' },
    failed: { color: 'text-red-600', label: t('deployment.failed') || 'Failed' },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Gas 信息卡 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4" />
            {t('deployment.gasInformation') || 'Gas Information'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">
                {t('deployment.gasPrice') || 'Gas Price'}
              </div>
              <div className="text-lg font-semibold">{gasPriceGwei.toFixed(2)} Gwei</div>
              <div className="text-xs text-gray-500 mt-1">
                {displayData.gasPrice.toFixed(0)} Wei
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">
                {t('deployment.gasLimit') || 'Gas Limit'}
              </div>
              <div className="text-lg font-semibold">{displayData.gasLimit.toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">
                {t('deployment.units') || 'units'}
              </div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs text-gray-600 mb-1">
              {t('deployment.estimatedCost') || 'Estimated Cost'}
            </div>
            <div className="text-2xl font-bold text-blue-600">
              ${displayData.estimatedCost.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              ≈ {(displayData.estimatedCost / displayData.ethPrice).toFixed(4)} ETH
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 交易狀態卡 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            {t('deployment.transactionStatus') || 'Transaction Status'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-xs text-gray-600 mb-2">
              {t('deployment.status') || 'Status'}
            </div>
            <Badge
              variant={
                displayData.transactionStatus === 'confirmed'
                  ? 'default'
                  : displayData.transactionStatus === 'failed'
                    ? 'destructive'
                    : 'secondary'
              }
              className="text-sm"
            >
              {transactionStatusConfig[displayData.transactionStatus].label}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">
                {t('deployment.blockNumber') || 'Block Number'}
              </div>
              <div className="text-lg font-semibold">{displayData.blockNumber.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">
                {t('deployment.confirmations') || 'Confirmations'}
              </div>
              <div className="text-lg font-semibold">{displayData.confirmations}/3</div>
            </div>
          </div>

          <div className="pt-2 border-t">
            <div className="text-xs text-gray-600 mb-1">
              {t('deployment.estimatedTime') || 'Estimated Time'}
            </div>
            <div className="text-lg font-semibold text-green-600">
              {displayData.estimatedTime}s
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 部署進度卡 */}
      <Card className="md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('deployment.deploymentProgress') || 'Deployment Progress'}
          </CardTitle>
          <CardDescription>
            {t('deployment.progressDesc') || 'Real-time deployment status'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 進度條 */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-600">{t('deployment.progress') || 'Progress'}</span>
              <span className="font-semibold">{Math.round(displayData.deploymentProgress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-3 rounded-full transition-all duration-500 ${
                  displayData.deploymentProgress < 50
                    ? 'bg-yellow-500'
                    : displayData.deploymentProgress < 100
                      ? 'bg-blue-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${displayData.deploymentProgress}%` }}
              />
            </div>
          </div>

          {/* 進度階段 */}
          <div className="grid grid-cols-4 gap-2 text-xs">
            <DeploymentStage
              label={t('deployment.validation') || 'Validation'}
              completed={displayData.deploymentProgress >= 25}
            />
            <DeploymentStage
              label={t('deployment.signing') || 'Signing'}
              completed={displayData.deploymentProgress >= 50}
            />
            <DeploymentStage
              label={t('deployment.submission') || 'Submission'}
              completed={displayData.deploymentProgress >= 75}
            />
            <DeploymentStage
              label={t('deployment.confirmation') || 'Confirmation'}
              completed={displayData.deploymentProgress >= 100}
            />
          </div>

          {/* 實時更新指示 */}
          {isUpdating && (
            <div className="flex items-center gap-2 text-xs text-blue-600 pt-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
              {t('deployment.updating') || 'Updating...'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 警告信息 */}
      {displayData.estimatedCost > 100 && (
        <Card className="md:col-span-2 border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-yellow-900">
                {t('deployment.highGasCost') || 'High Gas Cost'}
              </div>
              <div className="text-sm text-yellow-800 mt-1">
                {t('deployment.highGasCostDesc') || 'The estimated gas cost is higher than usual. Please review before confirming.'}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * 部署階段組件
 */
function DeploymentStage({ label, completed }: { label: string; completed: boolean }) {
  return (
    <div className="text-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${
          completed ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
        }`}
      >
        {completed ? '✓' : '○'}
      </div>
      <div className="text-xs text-gray-600 line-clamp-2">{label}</div>
    </div>
  );
}

export default DeploymentMonitor;
