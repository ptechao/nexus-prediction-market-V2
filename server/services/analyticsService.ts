/**
 * Phase C - Analytics Service
 * 負責交易者分析、ROI、勝率、風險評分、夏普比率計算
 */

import { eq, desc } from 'drizzle-orm';
import Decimal from 'decimal.js';
import { db } from '../db';
import {
  traderAnalytics,
  dailyPerformance,
  vaultPositions,
  followerTrades,
  users,
} from '@/drizzle/schema';
import { logAudit } from './auditLogger';

export interface TraderStats {
  traderId: bigint;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: Decimal;
  totalLoss: Decimal;
  roi: Decimal;
  winRate: Decimal;
  riskScore: Decimal;
  sharpRatio: Decimal;
  maxDrawdown: Decimal;
  averageWin: Decimal;
  averageLoss: Decimal;
  profitFactor: Decimal;
}

export class AnalyticsService {
  /**
   * 計算 ROI (Return on Investment)
   */
  calculateROI(profit: Decimal, investment: Decimal): Decimal {
    if (investment.eq(0)) return new Decimal(0);
    return profit.div(investment).mul(100);
  }

  /**
   * 計算勝率
   */
  calculateWinRate(winningTrades: number, totalTrades: number): Decimal {
    if (totalTrades === 0) return new Decimal(0);
    return new Decimal(winningTrades)
      .div(totalTrades)
      .mul(100);
  }

  /**
   * 計算風險評分 (0-100)
   * 基於: 勝率、最大回撤、波動率
   */
  calculateRiskScore(
    winRate: Decimal,
    maxDrawdown: Decimal,
    volatility: Decimal
  ): Decimal {
    // 風險評分 = (勝率 * 0.4) - (最大回撤 * 0.3) - (波動率 * 0.3)
    const winRateScore = winRate.mul(0.4);
    const drawdownPenalty = maxDrawdown.mul(0.3);
    const volatilityPenalty = volatility.mul(0.3);

    const riskScore = winRateScore
      .sub(drawdownPenalty)
      .sub(volatilityPenalty);

    // 限制在 0-100 之間
    if (riskScore.lt(0)) return new Decimal(0);
    if (riskScore.gt(100)) return new Decimal(100);
    return riskScore;
  }

  /**
   * 計算夏普比率
   * Sharpe Ratio = (平均收益 - 無風險利率) / 標準差
   */
  calculateSharpRatio(
    returns: Decimal[],
    riskFreeRate: Decimal = new Decimal(0.02)
  ): Decimal {
    if (returns.length === 0) return new Decimal(0);

    // 計算平均收益
    const avgReturn = returns.reduce((sum, r) => sum.add(r), new Decimal(0))
      .div(returns.length);

    // 計算標準差
    const variance = returns
      .reduce((sum, r) => {
        const diff = r.sub(avgReturn);
        return sum.add(diff.mul(diff));
      }, new Decimal(0))
      .div(returns.length);

    const stdDev = variance.sqrt();

    // 計算夏普比率
    if (stdDev.eq(0)) return new Decimal(0);
    return avgReturn
      .sub(riskFreeRate)
      .div(stdDev);
  }

  /**
   * 計算最大回撤
   */
  calculateMaxDrawdown(equity: Decimal[]): Decimal {
    if (equity.length === 0) return new Decimal(0);

    let maxEquity = equity[0];
    let maxDrawdown = new Decimal(0);

    for (const currentEquity of equity) {
      if (currentEquity.gt(maxEquity)) {
        maxEquity = currentEquity;
      }

      const drawdown = maxEquity
        .sub(currentEquity)
        .div(maxEquity)
        .mul(100);

      if (drawdown.gt(maxDrawdown)) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * 計算利潤因子 (Profit Factor)
   * = 總利潤 / 總損失
   */
  calculateProfitFactor(totalProfit: Decimal, totalLoss: Decimal): Decimal {
    if (totalLoss.eq(0)) {
      return totalProfit.gt(0) ? new Decimal(999) : new Decimal(0);
    }
    return totalProfit.div(totalLoss.abs());
  }

  /**
   * 獲取交易者統計
   */
  async getTraderStats(traderId: bigint): Promise<TraderStats> {
    // 獲取所有 Positions
    const positions = await db
      .select()
      .from(vaultPositions)
      .where(eq(vaultPositions.leaderId, traderId));

    // 計算統計
    const totalTrades = positions.length;
    const winningTrades = positions.filter(p => {
      const profit = new Decimal(p.profit?.toString() || '0');
      return profit.gt(0);
    }).length;
    const losingTrades = totalTrades - winningTrades;

    const totalProfit = positions.reduce((sum, p) => {
      const profit = new Decimal(p.profit?.toString() || '0');
      return profit.gt(0) ? sum.add(profit) : sum;
    }, new Decimal(0));

    const totalLoss = positions.reduce((sum, p) => {
      const profit = new Decimal(p.profit?.toString() || '0');
      return profit.lt(0) ? sum.add(profit.abs()) : sum;
    }, new Decimal(0));

    const totalInvestment = positions.reduce((sum, p) => {
      return sum.add(new Decimal(p.totalValue.toString()));
    }, new Decimal(0));

    // 計算指標
    const roi = this.calculateROI(totalProfit.sub(totalLoss), totalInvestment);
    const winRate = this.calculateWinRate(winningTrades, totalTrades);

    // 計算波動率 (簡化版)
    const returns = positions.map(p => {
      const profit = new Decimal(p.profit?.toString() || '0');
      const value = new Decimal(p.totalValue.toString());
      return profit.div(value).mul(100);
    });

    const volatility = returns.length > 0
      ? returns.reduce((sum, r) => sum.add(r.abs()), new Decimal(0)).div(returns.length)
      : new Decimal(0);

    // 計算最大回撤
    const equity = positions.map((p, i) => {
      return positions
        .slice(0, i + 1)
        .reduce((sum, pos) => {
          const profit = new Decimal(pos.profit?.toString() || '0');
          return sum.add(profit);
        }, totalInvestment);
    });

    const maxDrawdown = this.calculateMaxDrawdown(equity);

    // 計算夏普比率
    const sharpRatio = this.calculateSharpRatio(returns);

    // 計算利潤因子
    const profitFactor = this.calculateProfitFactor(totalProfit, totalLoss);

    const averageWin = winningTrades > 0
      ? totalProfit.div(winningTrades)
      : new Decimal(0);

    const averageLoss = losingTrades > 0
      ? totalLoss.div(losingTrades)
      : new Decimal(0);

    const riskScore = this.calculateRiskScore(winRate, maxDrawdown, volatility);

    return {
      traderId,
      totalTrades,
      winningTrades,
      losingTrades,
      totalProfit,
      totalLoss,
      roi,
      winRate,
      riskScore,
      sharpRatio,
      maxDrawdown,
      averageWin,
      averageLoss,
      profitFactor,
    };
  }

  /**
   * 保存交易者分析數據
   */
  async saveTraderAnalytics(traderId: bigint): Promise<void> {
    const stats = await this.getTraderStats(traderId);

    await db
      .insert(traderAnalytics)
      .values({
        traderId,
        totalTrades: stats.totalTrades,
        winningTrades: stats.winningTrades,
        losingTrades: stats.losingTrades,
        totalProfit: stats.totalProfit,
        totalLoss: stats.totalLoss,
        roi: stats.roi,
        winRate: stats.winRate,
        riskScore: stats.riskScore,
        sharpRatio: stats.sharpRatio,
        maxDrawdown: stats.maxDrawdown,
        averageWin: stats.averageWin,
        averageLoss: stats.averageLoss,
        profitFactor: stats.profitFactor,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: traderAnalytics.traderId,
        set: {
          totalTrades: stats.totalTrades,
          winningTrades: stats.winningTrades,
          losingTrades: stats.losingTrades,
          totalProfit: stats.totalProfit,
          totalLoss: stats.totalLoss,
          roi: stats.roi,
          winRate: stats.winRate,
          riskScore: stats.riskScore,
          sharpRatio: stats.sharpRatio,
          maxDrawdown: stats.maxDrawdown,
          averageWin: stats.averageWin,
          averageLoss: stats.averageLoss,
          profitFactor: stats.profitFactor,
          updatedAt: new Date(),
        },
      });

    await logAudit('ANALYTICS_UPDATED', 'analytics', BigInt(0), traderId, {
      roi: stats.roi.toString(),
      winRate: stats.winRate.toString(),
      riskScore: stats.riskScore.toString(),
    });

    console.log(`[Analytics] Trader ${traderId} analytics updated`);
  }

  /**
   * 獲取每日績效
   */
  async getDailyPerformance(traderId: bigint, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return db
      .select()
      .from(dailyPerformance)
      .where(eq(dailyPerformance.traderId, traderId))
      .orderBy(desc(dailyPerformance.date));
  }

  /**
   * 保存每日績效
   */
  async saveDailyPerformance(
    traderId: bigint,
    date: Date,
    dailyProfit: Decimal,
    dailyReturn: Decimal
  ): Promise<void> {
    await db
      .insert(dailyPerformance)
      .values({
        traderId,
        date,
        dailyProfit,
        dailyReturn,
        createdAt: new Date(),
      });
  }

  /**
   * 獲取交易者排名
   */
  async getTraderRanking(limit: number = 100): Promise<any[]> {
    const analytics = await db
      .select()
      .from(traderAnalytics)
      .orderBy(desc(traderAnalytics.roi))
      .limit(limit);

    // 獲取用戶信息
    const ranking = await Promise.all(
      analytics.map(async (a, index) => {
        const user = await db
          .select()
          .from(users)
          .where(eq(users.id, a.traderId))
          .limit(1);

        return {
          rank: index + 1,
          trader: user.length ? user[0] : null,
          stats: a,
        };
      })
    );

    return ranking;
  }

  /**
   * 計算組合績效
   */
  async calculatePortfolioPerformance(vaultIds: bigint[]): Promise<{
    totalProfit: Decimal;
    totalROI: Decimal;
    averageWinRate: Decimal;
    averageRiskScore: Decimal;
  }> {
    const positions = await db
      .select()
      .from(vaultPositions)
      .where(eq(vaultPositions.vaultId, vaultIds[0])); // 簡化版，實際應支持多個 Vault

    const totalProfit = positions.reduce((sum, p) => {
      return sum.add(new Decimal(p.profit?.toString() || '0'));
    }, new Decimal(0));

    const totalInvestment = positions.reduce((sum, p) => {
      return sum.add(new Decimal(p.totalValue.toString()));
    }, new Decimal(0));

    const totalROI = this.calculateROI(totalProfit, totalInvestment);

    const winningTrades = positions.filter(p => {
      const profit = new Decimal(p.profit?.toString() || '0');
      return profit.gt(0);
    }).length;

    const averageWinRate = this.calculateWinRate(winningTrades, positions.length);

    // 簡化版風險評分
    const averageRiskScore = new Decimal(50);

    return {
      totalProfit,
      totalROI,
      averageWinRate,
      averageRiskScore,
    };
  }
}

export const analyticsService = new AnalyticsService();
