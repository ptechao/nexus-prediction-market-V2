/**
 * Phase A-D tRPC Routers
 * 集成所有 Phase 的 API 路由
 */

import { router, protectedProcedure, publicProcedure } from '../_core/trpc';
import { z } from 'zod';
import Decimal from 'decimal.js';
import { marketResolutionService } from '../services/marketResolution';
import { copyTradingService } from '../services/copyTradingService';
import { analyticsService } from '../services/analyticsService';
import { creatorService } from '../services/creatorService';
import { logAudit } from '../services/auditLogger';

// ============ Phase A - Market Resolution ============

const phaseARouter = router({
  // 創建市場
  createMarket: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        sourceId: z.string(),
        sourceType: z.enum(['api-football', 'polymarket', 'custom']),
        fixtureStatus: z.string(),
        endDate: z.date(),
        oracleAddress: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await marketResolutionService.createMarketAndQueue({
        id: BigInt(0),
        title: input.title,
        description: input.description,
        sourceId: input.sourceId,
        sourceType: input.sourceType,
        fixtureStatus: input.fixtureStatus,
        endDate: input.endDate,
        oracleAddress: input.oracleAddress,
      });

      return {
        marketId: result.marketId.toString(),
        queueId: result.queueId.toString(),
      };
    }),

  // 獲取部署隊列狀態
  getDeploymentQueueStatus: publicProcedure.query(async () => {
    const status = await marketResolutionService.getDeploymentQueueStatus();
    return status;
  }),

  // 添加 Oracle 到白名單
  addOracleToWhitelist: protectedProcedure
    .input(
      z.object({
        oracleAddress: z.string(),
        oracleName: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await marketResolutionService.addOracleToWhitelist(
        input.oracleAddress,
        input.oracleName
      );
      return { success: true };
    }),
});

// ============ Phase B - Copy Trading ============

const phaseBRouter = router({
  // 創建 Vault
  createVault: protectedProcedure
    .input(
      z.object({
        vaultName: z.string(),
        initialCapital: z.string(),
        performanceFeeBps: z.number(),
        managementFeeBps: z.number(),
        minFollowerAmount: z.string(),
        maxFollowers: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const vaultId = await copyTradingService.createVault({
        leaderId: ctx.user.id,
        vaultName: input.vaultName,
        initialCapital: new Decimal(input.initialCapital),
        performanceFeeBps: input.performanceFeeBps,
        managementFeeBps: input.managementFeeBps,
        minFollowerAmount: new Decimal(input.minFollowerAmount),
        maxFollowers: input.maxFollowers,
      });

      return { vaultId: vaultId.toString() };
    }),

  // Follower 訂閱 Vault
  subscribeVault: protectedProcedure
    .input(
      z.object({
        vaultId: z.string(),
        depositAmount: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await copyTradingService.subscribeFollower({
        followerId: ctx.user.id,
        vaultId: BigInt(input.vaultId),
        depositAmount: new Decimal(input.depositAmount),
      });

      return {
        vaultId: result.vaultId.toString(),
        followerShares: result.followerShares.toString(),
        totalShares: result.totalShares.toString(),
      };
    }),

  // 獲取 Vault 詳情
  getVaultDetails: publicProcedure
    .input(z.object({ vaultId: z.string() }))
    .query(async ({ input }) => {
      const details = await copyTradingService.getVaultDetails(BigInt(input.vaultId));
      return {
        ...details,
        totalCapital: details.totalCapital.toString(),
        totalShares: details.totalShares.toString(),
        totalProfit: details.totalProfit.toString(),
      };
    }),

  // 獲取 Follower 的 Vault 列表
  getFollowerVaults: protectedProcedure.query(async ({ ctx }) => {
    const vaults = await copyTradingService.getFollowerVaults(ctx.user.id);
    return vaults.map(v => ({
      ...v,
      totalCapital: v.totalCapital.toString(),
      totalShares: v.totalShares.toString(),
      totalProfit: v.totalProfit.toString(),
    }));
  }),
});

// ============ Phase C - Analytics ============

const phaseCRouter = router({
  // 獲取交易者統計
  getTraderStats: publicProcedure
    .input(z.object({ traderId: z.string() }))
    .query(async ({ input }) => {
      const stats = await analyticsService.getTraderStats(BigInt(input.traderId));
      return {
        ...stats,
        totalProfit: stats.totalProfit.toString(),
        totalLoss: stats.totalLoss.toString(),
        roi: stats.roi.toString(),
        winRate: stats.winRate.toString(),
        riskScore: stats.riskScore.toString(),
        sharpRatio: stats.sharpRatio.toString(),
        maxDrawdown: stats.maxDrawdown.toString(),
        averageWin: stats.averageWin.toString(),
        averageLoss: stats.averageLoss.toString(),
        profitFactor: stats.profitFactor.toString(),
      };
    }),

  // 保存交易者分析
  saveTraderAnalytics: protectedProcedure
    .input(z.object({ traderId: z.string() }))
    .mutation(async ({ input }) => {
      await analyticsService.saveTraderAnalytics(BigInt(input.traderId));
      return { success: true };
    }),

  // 獲取交易者排名
  getTraderRanking: publicProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ input }) => {
      const ranking = await analyticsService.getTraderRanking(input.limit);
      return ranking.map(r => ({
        ...r,
        stats: {
          ...r.stats,
          totalProfit: r.stats.totalProfit.toString(),
          totalLoss: r.stats.totalLoss.toString(),
          roi: r.stats.roi.toString(),
          winRate: r.stats.winRate.toString(),
          riskScore: r.stats.riskScore.toString(),
          sharpRatio: r.stats.sharpRatio.toString(),
          maxDrawdown: r.stats.maxDrawdown.toString(),
          averageWin: r.stats.averageWin.toString(),
          averageLoss: r.stats.averageLoss.toString(),
          profitFactor: r.stats.profitFactor.toString(),
        },
      }));
    }),

  // 獲取每日績效
  getDailyPerformance: publicProcedure
    .input(z.object({ traderId: z.string(), days: z.number().default(30) }))
    .query(async ({ input }) => {
      return await analyticsService.getDailyPerformance(
        BigInt(input.traderId),
        input.days
      );
    }),
});

// ============ Phase D - Creator & Live ============

const phaseDRouter = router({
  // 創建創作者檔案
  createCreator: protectedProcedure
    .input(
      z.object({
        displayName: z.string(),
        avatar: z.string().optional(),
        bio: z.string().optional(),
        socialLinks: z.record(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const creatorId = await creatorService.createCreator({
        userId: ctx.user.id,
        displayName: input.displayName,
        avatar: input.avatar,
        bio: input.bio,
        socialLinks: input.socialLinks,
      });

      return { creatorId: creatorId.toString() };
    }),

  // 開始直播
  startLiveStream: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        playbackUrl: z.string(),
        chatEnabled: z.boolean().default(true),
        marketId: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const streamId = await creatorService.startLiveStream({
        creatorId: BigInt(input.creatorId),
        title: input.title,
        description: input.description,
        playbackUrl: input.playbackUrl,
        chatEnabled: input.chatEnabled,
        marketId: input.marketId ? BigInt(input.marketId) : undefined,
      });

      return { streamId: streamId.toString() };
    }),

  // 結束直播
  endLiveStream: protectedProcedure
    .input(
      z.object({
        streamId: z.string(),
        creatorId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await creatorService.endLiveStream(
        BigInt(input.streamId),
        BigInt(input.creatorId)
      );
      return { success: true };
    }),

  // 上傳短視頻
  uploadShort: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        title: z.string(),
        description: z.string().optional(),
        videoUrl: z.string(),
        coverUrl: z.string().optional(),
        duration: z.number(),
        marketId: z.string().optional(),
        ctaType: z.enum(['COPY_BET', 'OPEN_MARKET', 'FOLLOW_TRADER']).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const shortId = await creatorService.uploadShort({
        creatorId: BigInt(input.creatorId),
        title: input.title,
        description: input.description,
        videoUrl: input.videoUrl,
        coverUrl: input.coverUrl,
        duration: input.duration,
        marketId: input.marketId ? BigInt(input.marketId) : undefined,
        ctaType: input.ctaType,
      });

      return { shortId: shortId.toString() };
    }),

  // 獲取活動直播列表
  getActiveLiveStreams: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      return await creatorService.getActiveLiveStreams(input.limit);
    }),

  // 獲取短視頻 Feed
  getShortsFeed: publicProcedure
    .input(z.object({ limit: z.number().default(20), offset: z.number().default(0) }))
    .query(async ({ input }) => {
      return await creatorService.getShortsFeed(input.limit, input.offset);
    }),

  // 獲取創作者詳情
  getCreatorProfile: publicProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ input }) => {
      return await creatorService.getCreatorProfile(BigInt(input.creatorId));
    }),

  // 記錄 CTA 點擊
  logCTAClick: protectedProcedure
    .input(
      z.object({
        creatorId: z.string(),
        ctaType: z.string(),
        targetId: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      await creatorService.logCTAClick(
        BigInt(input.creatorId),
        input.ctaType,
        BigInt(input.targetId)
      );
      return { success: true };
    }),
});

// ============ 導出所有路由 ============

export const phaseABCDRouter = router({
  phaseA: phaseARouter,
  phaseB: phaseBRouter,
  phaseC: phaseCRouter,
  phaseD: phaseDRouter,
});

export type PhaseABCDRouter = typeof phaseABCDRouter;
