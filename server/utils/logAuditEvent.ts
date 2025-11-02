import { storage } from '../storage/index.js';
import { actionCategoryMap } from './auditActions.js';

export async function logAuditEvent({
  adminId,
  action,
  targetType,
  targetId,
  metadata = {},
  ipAddress = null,
  userAgent = null,
}: {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const category = actionCategoryMap[action] || 'SYSTEM';
  
  await storage.createAuditLog({
    adminId,
    action,
    actionCategory: category,
    targetType: targetType || null,
    targetId: targetId?.toString() || null,
    ipAddress,
    userAgent,
    requestMethod: null,
    requestPath: null,
    statusCode: null,
    durationMs: null,
    metadata,
  });
}
