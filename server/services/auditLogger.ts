/**
 * Phase A - Audit Logger Service
 * 負責所有操作的審計日誌記錄
 */

import { db } from '../db';
import { auditLogs } from '@/drizzle/schema';

export type AuditEventType =
  | 'MARKET_CREATED'
  | 'MARKET_UPDATED'
  | 'MARKET_RESOLVED'
  | 'DEPLOYMENT_SUCCESS'
  | 'DEPLOYMENT_FAILED'
  | 'ORACLE_ADDED'
  | 'ORACLE_REMOVED'
  | 'VAULT_CREATED'
  | 'FOLLOWER_SUBSCRIBED'
  | 'POSITION_CLOSED'
  | 'FEE_DISTRIBUTED'
  | 'ANALYTICS_UPDATED'
  | 'CREATOR_CREATED'
  | 'STREAM_STARTED'
  | 'STREAM_ENDED'
  | 'SHORT_CREATED'
  | 'ALERT_TRIGGERED';

export interface AuditLogEntry {
  eventType: AuditEventType;
  entityType: 'market' | 'deployment' | 'oracle' | 'vault' | 'follower' | 'position' | 'analytics' | 'creator' | 'stream' | 'short' | 'alert';
  entityId: bigint;
  userId?: bigint;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export async function logAudit(
  eventType: AuditEventType,
  entityType: AuditLogEntry['entityType'],
  entityId: bigint,
  userId: bigint | null,
  changes: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      eventType,
      entityType,
      entityId,
      userId,
      changes: JSON.stringify(changes),
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[Audit Logger] Error logging audit:', error);
    // 不拋出錯誤，以免影響主業務邏輯
  }
}

export async function getAuditLogs(
  entityType?: string,
  entityId?: bigint,
  limit: number = 100
): Promise<any[]> {
  let query = db.select().from(auditLogs);

  if (entityType) {
    query = query.where(eq(auditLogs.entityType, entityType));
  }

  if (entityId) {
    query = query.where(eq(auditLogs.entityId, entityId));
  }

  return query.orderBy(desc(auditLogs.timestamp)).limit(limit);
}

export async function getAuditLogsByUser(userId: bigint, limit: number = 100): Promise<any[]> {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
}

export async function getAuditLogsByEventType(
  eventType: AuditEventType,
  limit: number = 100
): Promise<any[]> {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.eventType, eventType))
    .orderBy(desc(auditLogs.timestamp))
    .limit(limit);
}

// 導入缺失的函數
import { eq, desc } from 'drizzle-orm';
