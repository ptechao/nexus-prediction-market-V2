/**
 * 部署市場表單組件
 * 
 * 用於創建和部署新的市場。
 * 包括參數輸入、驗證和確認。
 */

import { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, CheckCircle } from 'lucide-react';

/**
 * 表單數據類型
 */
interface FormData {
  title: string;
  description: string;
  endTime: string;
  oracleAddress: string;
  initialLiquidity: string;
}

/**
 * 驗證錯誤類型
 */
interface ValidationErrors {
  [key: string]: string;
}

/**
 * 部署表單組件屬性
 */
interface DeployMarketFormProps {
  onSuccess?: (deploymentId: string) => void;
  onError?: (error: string) => void;
}

/**
 * 部署表單組件
 */
export function DeployMarketForm({ onSuccess, onError }: DeployMarketFormProps) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    endTime: '',
    oracleAddress: '',
    initialLiquidity: '1',
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 部署市場 Mutation
  const deployMarketMutation = trpc.phaseADeployment?.deployMarket?.useMutation?.();

  /**
   * 驗證表單
   */
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // 驗證標題
    if (!formData.title.trim()) {
      newErrors.title = t('validation.titleRequired') || 'Title is required';
    } else if (formData.title.length > 256) {
      newErrors.title = t('validation.titleTooLong') || 'Title is too long';
    }

    // 驗證描述
    if (!formData.description.trim()) {
      newErrors.description = t('validation.descriptionRequired') || 'Description is required';
    } else if (formData.description.length > 1024) {
      newErrors.description = t('validation.descriptionTooLong') || 'Description is too long';
    }

    // 驗證結束時間
    if (!formData.endTime) {
      newErrors.endTime = t('validation.endTimeRequired') || 'End time is required';
    } else {
      const endTimeMs = new Date(formData.endTime).getTime();
      const now = Date.now();
      if (endTimeMs <= now) {
        newErrors.endTime = t('validation.endTimeMustBeFuture') || 'End time must be in the future';
      } else if (endTimeMs - now < 3600000) {
        newErrors.endTime = t('validation.endTimeMinimum') || 'End time must be at least 1 hour away';
      }
    }

    // 驗證 Oracle 地址
    if (!formData.oracleAddress.trim()) {
      newErrors.oracleAddress = t('validation.oracleAddressRequired') || 'Oracle address is required';
    } else if (!/^0x[a-fA-F0-9]{40}$/.test(formData.oracleAddress)) {
      newErrors.oracleAddress = t('validation.oracleAddressInvalid') || 'Invalid Ethereum address';
    }

    // 驗證初始流動性
    if (!formData.initialLiquidity) {
      newErrors.initialLiquidity = t('validation.initialLiquidityRequired') || 'Initial liquidity is required';
    } else if (isNaN(Number(formData.initialLiquidity)) || Number(formData.initialLiquidity) <= 0) {
      newErrors.initialLiquidity = t('validation.initialLiquidityMustBePositive') || 'Initial liquidity must be positive';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * 處理表單提交
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setShowConfirm(true);
  };

  /**
   * 確認部署
   */
  const handleConfirmDeploy = async () => {
    setIsSubmitting(true);
    try {
      const endTimeSeconds = Math.floor(new Date(formData.endTime).getTime() / 1000);
      const result = await deployMarketMutation?.mutateAsync?.({
        title: formData.title,
        description: formData.description,
        endTime: endTimeSeconds,
        oracleAddress: formData.oracleAddress,
        initialLiquidity: formData.initialLiquidity,
      });

      if (result?.deploymentId) {
        setShowConfirm(false);
        setFormData({
          title: '',
          description: '',
          endTime: '',
          oracleAddress: '',
          initialLiquidity: '1',
        });
        setErrors({});
        onSuccess?.(result.deploymentId);
      }
    } catch (error) {
      const errorMessage = (error as Error).message || t('errors.deploymentFailed') || 'Deployment failed';
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * 計算最小結束時間
   */
  const getMinDateTime = (): string => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  if (showConfirm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('deployment.confirmDeployment') || 'Confirm Deployment'}</CardTitle>
          <CardDescription>
            {t('deployment.confirmDeploymentDesc') || 'Please review the deployment parameters'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 部署摘要 */}
          <div className="space-y-3 bg-gray-50 p-4 rounded">
            <div>
              <div className="text-sm text-gray-600">{t('deployment.title') || 'Title'}</div>
              <div className="font-semibold mt-1">{formData.title}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('deployment.description') || 'Description'}</div>
              <div className="text-sm mt-1 line-clamp-3">{formData.description}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">{t('deployment.endTime') || 'End Time'}</div>
                <div className="font-semibold mt-1">
                  {new Date(formData.endTime).toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">{t('deployment.initialLiquidity') || 'Initial Liquidity'}</div>
                <div className="font-semibold mt-1">{formData.initialLiquidity} ETH</div>
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">{t('deployment.oracleAddress') || 'Oracle Address'}</div>
              <code className="block mt-1 p-2 bg-white rounded text-xs break-all">
                {formData.oracleAddress}
              </code>
            </div>
          </div>

          {/* 警告 */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              {t('deployment.deploymentWarning') || 'This action will deploy a new market contract to the blockchain. This cannot be undone.'}
            </div>
          </div>

          {/* 操作按鈕 */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isSubmitting}
              className="flex-1"
            >
              {t('common.cancel') || 'Cancel'}
            </Button>
            <Button
              onClick={handleConfirmDeploy}
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting
                ? t('deployment.deploying') || 'Deploying...'
                : t('deployment.confirmAndDeploy') || 'Confirm & Deploy'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('deployment.deployNewMarket') || 'Deploy New Market'}</CardTitle>
        <CardDescription>
          {t('deployment.deployNewMarketDesc') || 'Create and deploy a new prediction market'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 標題 */}
          <div>
            <Label htmlFor="title">{t('deployment.title') || 'Title'}</Label>
            <Input
              id="title"
              placeholder={t('deployment.titlePlaceholder') || 'e.g., BTC Price > $50,000 on 2026-04-01'}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* 描述 */}
          <div>
            <Label htmlFor="description">{t('deployment.description') || 'Description'}</Label>
            <Textarea
              id="description"
              placeholder={t('deployment.descriptionPlaceholder') || 'Detailed description of the market...'}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* 結束時間 */}
          <div>
            <Label htmlFor="endTime">{t('deployment.endTime') || 'End Time'}</Label>
            <Input
              id="endTime"
              type="datetime-local"
              min={getMinDateTime()}
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className={errors.endTime ? 'border-red-500' : ''}
            />
            {errors.endTime && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.endTime}
              </p>
            )}
          </div>

          {/* Oracle 地址 */}
          <div>
            <Label htmlFor="oracleAddress">{t('deployment.oracleAddress') || 'Oracle Address'}</Label>
            <Input
              id="oracleAddress"
              placeholder="0x..."
              value={formData.oracleAddress}
              onChange={(e) => setFormData({ ...formData, oracleAddress: e.target.value })}
              className={errors.oracleAddress ? 'border-red-500' : ''}
            />
            {errors.oracleAddress && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.oracleAddress}
              </p>
            )}
          </div>

          {/* 初始流動性 */}
          <div>
            <Label htmlFor="initialLiquidity">{t('deployment.initialLiquidity') || 'Initial Liquidity (ETH)'}</Label>
            <Input
              id="initialLiquidity"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.initialLiquidity}
              onChange={(e) => setFormData({ ...formData, initialLiquidity: e.target.value })}
              className={errors.initialLiquidity ? 'border-red-500' : ''}
            />
            {errors.initialLiquidity && (
              <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.initialLiquidity}
              </p>
            )}
          </div>

          {/* 提交按鈕 */}
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? t('common.loading') || 'Loading...' : t('deployment.next') || 'Next'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default DeployMarketForm;
