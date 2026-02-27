/**
 * Phase D - Creator Service
 * 負責創作者管理、直播、短視頻、事件記錄
 */

import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import {
  creators,
  liveStreams,
  shorts,
  creatorEvents,
  users,
} from '@/drizzle/schema';
import { logAudit } from './auditLogger';

export interface CreatorProfile {
  userId: bigint;
  displayName: string;
  avatar?: string;
  bio?: string;
  socialLinks?: Record<string, string>;
}

export interface LiveStreamConfig {
  creatorId: bigint;
  title: string;
  description?: string;
  playbackUrl: string;
  chatEnabled: boolean;
  marketId?: bigint;
}

export interface ShortVideoConfig {
  creatorId: bigint;
  title: string;
  description?: string;
  videoUrl: string;
  coverUrl?: string;
  duration: number;
  marketId?: bigint;
  ctaType?: 'COPY_BET' | 'OPEN_MARKET' | 'FOLLOW_TRADER';
}

export class CreatorService {
  /**
   * 創建創作者檔案
   */
  async createCreator(profile: CreatorProfile): Promise<bigint> {
    // 檢查是否已存在
    const existing = await db
      .select()
      .from(creators)
      .where(eq(creators.userId, profile.userId))
      .limit(1);

    if (existing.length > 0) {
      throw new Error(`Creator profile already exists for user ${profile.userId}`);
    }

    // 創建檔案
    const [creator] = await db
      .insert(creators)
      .values({
        userId: profile.userId,
        displayName: profile.displayName,
        avatar: profile.avatar,
        bio: profile.bio,
        socialLinks: profile.socialLinks ? JSON.stringify(profile.socialLinks) : null,
        isActive: true,
        followerCount: 0,
        createdAt: new Date(),
      })
      .returning({ id: creators.id });

    // 審計日誌
    await logAudit('CREATOR_CREATED', 'creator', creator.id, profile.userId, {
      displayName: profile.displayName,
    });

    console.log(`[Creator Service] Creator ${creator.id} created for user ${profile.userId}`);
    return creator.id;
  }

  /**
   * 開始直播
   */
  async startLiveStream(config: LiveStreamConfig): Promise<bigint> {
    // 檢查創作者是否存在
    const creator = await db
      .select()
      .from(creators)
      .where(eq(creators.id, config.creatorId))
      .limit(1);

    if (!creator.length) {
      throw new Error(`Creator ${config.creatorId} not found`);
    }

    // 檢查是否已有活動直播
    const activeLive = await db
      .select()
      .from(liveStreams)
      .where(
        and(
          eq(liveStreams.creatorId, config.creatorId),
          eq(liveStreams.status, 'LIVE')
        )
      )
      .limit(1);

    if (activeLive.length > 0) {
      throw new Error(`Creator ${config.creatorId} already has an active stream`);
    }

    // 創建直播
    const [stream] = await db
      .insert(liveStreams)
      .values({
        creatorId: config.creatorId,
        title: config.title,
        description: config.description,
        playbackUrl: config.playbackUrl,
        chatEnabled: config.chatEnabled,
        marketId: config.marketId,
        status: 'LIVE',
        viewerCount: 0,
        startedAt: new Date(),
      })
      .returning({ id: liveStreams.id });

    // 記錄事件
    await this.logCreatorEvent(config.creatorId, 'STREAM_STARTED', {
      streamId: stream.id,
      title: config.title,
    });

    // 審計日誌
    await logAudit('STREAM_STARTED', 'stream', stream.id, creator[0].userId, {
      title: config.title,
      playbackUrl: config.playbackUrl,
    });

    console.log(`[Creator Service] Live stream ${stream.id} started by creator ${config.creatorId}`);
    return stream.id;
  }

  /**
   * 結束直播
   */
  async endLiveStream(streamId: bigint, creatorId: bigint): Promise<void> {
    // 獲取直播信息
    const stream = await db
      .select()
      .from(liveStreams)
      .where(
        and(
          eq(liveStreams.id, streamId),
          eq(liveStreams.creatorId, creatorId)
        )
      )
      .limit(1);

    if (!stream.length) {
      throw new Error(`Stream ${streamId} not found`);
    }

    const streamData = stream[0];

    // 計算直播時長
    const duration = streamData.startedAt
      ? new Date().getTime() - streamData.startedAt.getTime()
      : 0;

    // 更新直播狀態
    await db
      .update(liveStreams)
      .set({
        status: 'ENDED',
        endedAt: new Date(),
        duration: Math.floor(duration / 1000), // 轉換為秒
      })
      .where(eq(liveStreams.id, streamId));

    // 記錄事件
    await this.logCreatorEvent(creatorId, 'STREAM_ENDED', {
      streamId: streamId,
      duration: Math.floor(duration / 1000),
      viewerCount: streamData.viewerCount,
    });

    // 審計日誌
    await logAudit('STREAM_ENDED', 'stream', streamId, null, {
      duration: Math.floor(duration / 1000),
      viewerCount: streamData.viewerCount,
    });

    console.log(`[Creator Service] Live stream ${streamId} ended`);
  }

  /**
   * 上傳短視頻
   */
  async uploadShort(config: ShortVideoConfig): Promise<bigint> {
    // 檢查創作者是否存在
    const creator = await db
      .select()
      .from(creators)
      .where(eq(creators.id, config.creatorId))
      .limit(1);

    if (!creator.length) {
      throw new Error(`Creator ${config.creatorId} not found`);
    }

    // 創建短視頻
    const [short] = await db
      .insert(shorts)
      .values({
        creatorId: config.creatorId,
        title: config.title,
        description: config.description,
        videoUrl: config.videoUrl,
        coverUrl: config.coverUrl,
        duration: config.duration,
        marketId: config.marketId,
        ctaType: config.ctaType,
        viewCount: 0,
        likeCount: 0,
        shareCount: 0,
        createdAt: new Date(),
      })
      .returning({ id: shorts.id });

    // 記錄事件
    await this.logCreatorEvent(config.creatorId, 'SHORT_CREATED', {
      shortId: short.id,
      title: config.title,
      duration: config.duration,
    });

    // 審計日誌
    await logAudit('SHORT_CREATED', 'short', short.id, creator[0].userId, {
      title: config.title,
      videoUrl: config.videoUrl,
      duration: config.duration,
    });

    console.log(`[Creator Service] Short ${short.id} created by creator ${config.creatorId}`);
    return short.id;
  }

  /**
   * 記錄創作者事件
   */
  async logCreatorEvent(
    creatorId: bigint,
    eventType: string,
    eventData: Record<string, any>
  ): Promise<void> {
    await db.insert(creatorEvents).values({
      creatorId,
      eventType,
      eventData: JSON.stringify(eventData),
      createdAt: new Date(),
    });

    console.log(`[Creator Service] Event ${eventType} logged for creator ${creatorId}`);
  }

  /**
   * 記錄 CTA 點擊
   */
  async logCTAClick(
    creatorId: bigint,
    ctaType: string,
    targetId: bigint
  ): Promise<void> {
    await this.logCreatorEvent(creatorId, 'CTA_CLICKED', {
      ctaType,
      targetId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * 獲取創作者詳情
   */
  async getCreatorProfile(creatorId: bigint): Promise<any> {
    const creator = await db
      .select()
      .from(creators)
      .where(eq(creators.id, creatorId))
      .limit(1);

    if (!creator.length) {
      throw new Error(`Creator ${creatorId} not found`);
    }

    const creatorData = creator[0];

    // 獲取用戶信息
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, creatorData.userId))
      .limit(1);

    // 獲取活動直播
    const activeLive = await db
      .select()
      .from(liveStreams)
      .where(
        and(
          eq(liveStreams.creatorId, creatorId),
          eq(liveStreams.status, 'LIVE')
        )
      )
      .limit(1);

    // 獲取最近的短視頻
    const recentShorts = await db
      .select()
      .from(shorts)
      .where(eq(shorts.creatorId, creatorId))
      .orderBy(shorts.createdAt)
      .limit(10);

    // 獲取事件統計
    const events = await db
      .select()
      .from(creatorEvents)
      .where(eq(creatorEvents.creatorId, creatorId));

    return {
      id: creatorData.id,
      user: user.length ? user[0] : null,
      displayName: creatorData.displayName,
      avatar: creatorData.avatar,
      bio: creatorData.bio,
      socialLinks: creatorData.socialLinks ? JSON.parse(creatorData.socialLinks) : null,
      followerCount: creatorData.followerCount,
      isActive: creatorData.isActive,
      activeLive: activeLive.length > 0 ? activeLive[0] : null,
      recentShorts: recentShorts,
      eventCount: events.length,
      createdAt: creatorData.createdAt,
    };
  }

  /**
   * 獲取活動直播列表
   */
  async getActiveLiveStreams(limit: number = 20): Promise<any[]> {
    const streams = await db
      .select()
      .from(liveStreams)
      .where(eq(liveStreams.status, 'LIVE'))
      .orderBy(liveStreams.startedAt)
      .limit(limit);

    // 獲取創作者信息
    const result = await Promise.all(
      streams.map(async (stream) => {
        const creator = await db
          .select()
          .from(creators)
          .where(eq(creators.id, stream.creatorId))
          .limit(1);

        return {
          ...stream,
          creator: creator.length ? creator[0] : null,
        };
      })
    );

    return result;
  }

  /**
   * 獲取短視頻 Feed
   */
  async getShortsFeed(limit: number = 20, offset: number = 0): Promise<any[]> {
    const shorts_list = await db
      .select()
      .from(shorts)
      .orderBy(shorts.createdAt)
      .limit(limit)
      .offset(offset);

    // 獲取創作者信息
    const result = await Promise.all(
      shorts_list.map(async (short) => {
        const creator = await db
          .select()
          .from(creators)
          .where(eq(creators.id, short.creatorId))
          .limit(1);

        return {
          ...short,
          creator: creator.length ? creator[0] : null,
        };
      })
    );

    return result;
  }

  /**
   * 增加短視頻觀看次數
   */
  async incrementShortView(shortId: bigint): Promise<void> {
    const short = await db
      .select()
      .from(shorts)
      .where(eq(shorts.id, shortId))
      .limit(1);

    if (!short.length) {
      throw new Error(`Short ${shortId} not found`);
    }

    await db
      .update(shorts)
      .set({
        viewCount: (short[0].viewCount || 0) + 1,
      })
      .where(eq(shorts.id, shortId));
  }

  /**
   * 增加短視頻點讚次數
   */
  async incrementShortLike(shortId: bigint): Promise<void> {
    const short = await db
      .select()
      .from(shorts)
      .where(eq(shorts.id, shortId))
      .limit(1);

    if (!short.length) {
      throw new Error(`Short ${shortId} not found`);
    }

    await db
      .update(shorts)
      .set({
        likeCount: (short[0].likeCount || 0) + 1,
      })
      .where(eq(shorts.id, shortId));
  }

  /**
   * 禁用創作者
   */
  async disableCreator(creatorId: bigint): Promise<void> {
    await db
      .update(creators)
      .set({ isActive: false })
      .where(eq(creators.id, creatorId));

    await logAudit('CREATOR_DISABLED', 'creator', creatorId, null, {});

    console.log(`[Creator Service] Creator ${creatorId} disabled`);
  }

  /**
   * 清理已結束的直播 (Cron 任務)
   */
  async cleanupEndedStreams(): Promise<number> {
    // 獲取 24 小時前結束的直播
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 24);

    const endedStreams = await db
      .select()
      .from(liveStreams)
      .where(
        and(
          eq(liveStreams.status, 'ENDED'),
          // 簡化版，實際應使用 lt(liveStreams.endedAt, cutoffTime)
        )
      );

    // 刪除或歸檔
    // TODO: 實現歸檔邏輯

    console.log(`[Creator Service] Cleaned up ${endedStreams.length} ended streams`);
    return endedStreams.length;
  }
}

export const creatorService = new CreatorService();
