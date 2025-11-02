import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage/index.js';
import { actionCategoryMap } from '../utils/auditActions.js';

// Sensitive fields to redact from logs
const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'apiKey'];

function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = { ...obj };
  for (const key of SENSITIVE_FIELDS) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }
  return sanitized;
}

export const auditLogger = async (req: Request, res: Response, next: NextFunction) => {
  // Only log admin routes
  if (!req.path.startsWith('/api/admin')) {
    return next();
  }
  
  // Skip if not admin
  if (!(req as any).user?.role || (req as any).user.role !== 'admin') {
    return next();
  }
  
  // Skip high-volume read endpoints
  const skipPaths = ['/api/admin/audit-logs']; // Don't log the audit log viewing itself
  if (skipPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  const startTime = Date.now();
  
  // Capture original res.json to intercept response
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    const durationMs = Date.now() - startTime;
    
    // Log the audit event asynchronously (don't block response)
    setImmediate(async () => {
      try {
        // Determine action from path
        const pathParts = req.path.split('/').filter(Boolean);
        const action = `${req.method}_${pathParts.slice(2).join('_')}`.toUpperCase();
        const category = actionCategoryMap[action] || 'SYSTEM';
        
        await storage.createAuditLog({
          adminId: (req as any).user!.id,
          action,
          actionCategory: category,
          targetType: req.body?.targetType || null,
          targetId: req.body?.targetId?.toString() || null,
          ipAddress: req.ip || (req as any).connection.remoteAddress || null,
          userAgent: req.headers['user-agent'] || null,
          requestMethod: req.method,
          requestPath: req.path,
          statusCode: res.statusCode,
          durationMs,
          metadata: {
            body: sanitizeObject(req.body),
            query: req.query,
            params: req.params,
          },
        });
      } catch (error) {
        console.error('[Audit Logger] Failed to log event:', error);
      }
    });
    
    return originalJson(body);
  };
  
  next();
};
