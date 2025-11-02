import type { Request, Response, NextFunction } from 'express';
import type { IStorage } from '../storage';

export function ipBanMiddleware(storage: IStorage) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const isBanned = await storage.checkIpBanned(ip as string);
    
    if (isBanned) {
      console.log(`[SECURITY] Blocked banned IP: ${ip}`);
      return res.status(403).json({ error: 'Access forbidden - IP banned' });
    }
    
    next();
  };
}

const failedLogins = new Map<string, { count: number; timestamp: number }>();
const BLOCK_THRESHOLD = 5;
const WINDOW_MS = 15 * 60 * 1000;

export function loginSecurityMiddleware(storage: IStorage, securityService: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.path === '/api/auth/login' && req.method === 'POST') {
      const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      const now = Date.now();
      
      let record = failedLogins.get(ip as string) || { count: 0, timestamp: now };
      
      if (now - record.timestamp > WINDOW_MS) {
        record = { count: 0, timestamp: now };
      }
      
      if (record.count >= BLOCK_THRESHOLD) {
        await securityService.logSecurityEvent({
          type: 'login_bruteforce',
          severity: 'high',
          description: `${record.count} failed login attempts in ${WINDOW_MS / 60000} minutes`,
          ip: ip as string
        });
        return res.status(429).json({ error: 'Too many login attempts. Try again later.' });
      }
      
      const originalSend = res.send;
      res.send = function(data: any) {
        if (res.statusCode === 401) {
          record.count++;
          failedLogins.set(ip as string, record);
          
          securityService.logSecurityEvent({
            type: 'login_failed',
            severity: record.count >= 3 ? 'medium' : 'low',
            description: `Failed login attempt (${record.count}/${BLOCK_THRESHOLD})`,
            ip: ip as string
          }).catch((err: Error) => console.error('[SECURITY] Failed to log event:', err));
        } else if (res.statusCode === 200) {
          failedLogins.delete(ip as string);
        }
        
        return originalSend.call(this, data);
      };
    }
    
    next();
  };
}
