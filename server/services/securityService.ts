import type { IStorage } from '../storage';
import type { SecurityEvent, IpBan } from '@shared/schema';

/**
 * Security Service Interface
 */
export interface ISecurityService {
  /**
   * Log security event with auto-blocking on high severity
   */
  logSecurityEvent(data: {
    type: 'login_failed' | 'api_rate_limit' | 'suspicious_ip' | 'login_bruteforce' | 'api_abuse';
    severity: 'low' | 'medium' | 'high';
    description?: string;
    ip?: string;
    userId?: string;
  }): Promise<void>;

  /**
   * Check if an IP is currently banned
   */
  checkIpBanned(ipAddress: string): Promise<boolean>;

  /**
   * Manually ban an IP address
   */
  banIp(ipAddress: string, reason: string, bannedBy?: string, hours?: number): Promise<void>;

  /**
   * Remove an IP ban
   */
  unbanIp(ipAddress: string, unbannedBy?: string): Promise<void>;

  /**
   * Get security dashboard metrics
   */
  getSecurityMetrics(): Promise<{
    totalEvents: number;
    eventsToday: number;
    blockedIps: number;
    uptime: string;
  }>;
}

/**
 * Singleton instance
 */
let instance: ISecurityService | null = null;

/**
 * Security Service Factory
 */
export function getSecurityService(storage: IStorage): ISecurityService {
  if (instance) {
    return instance;
  }

  instance = {
    /**
     * Log security event with auto-blocking on high severity
     */
    async logSecurityEvent(data: {
      type: 'login_failed' | 'api_rate_limit' | 'suspicious_ip' | 'login_bruteforce' | 'api_abuse';
      severity: 'low' | 'medium' | 'high';
      description?: string;
      ip?: string;
      userId?: string;
    }): Promise<void> {
      try {
        console.log(`[SECURITY] Logging security event: ${data.type} (${data.severity})`);

        await storage.createSecurityEvent({
          type: data.type,
          severity: data.severity,
          status: 'open',
          description: data.description,
          ipAddress: data.ip,
          userId: data.userId,
        });

        if (data.severity === 'high' && data.ip) {
          console.log(`[SECURITY] High severity event detected. Auto-blocking IP: ${data.ip}`);
          
          const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
          
          await storage.createIpBan({
            ipAddress: data.ip,
            reason: `Auto-block: ${data.type}`,
            bannedBy: undefined,
            expiresAt,
          });

          console.log(`[SECURITY] IP ${data.ip} auto-blocked for 1 hour until ${expiresAt.toISOString()}`);
        }
      } catch (error) {
        console.error('[SECURITY] Error logging security event:', error);
        throw error;
      }
    },

    /**
     * Check if an IP is currently banned
     */
    async checkIpBanned(ipAddress: string): Promise<boolean> {
      try {
        const isBanned = await storage.checkIpBanned(ipAddress);
        console.log(`[SECURITY] IP ban check for ${ipAddress}: ${isBanned ? 'BANNED' : 'NOT BANNED'}`);
        return isBanned;
      } catch (error) {
        console.error('[SECURITY] Error checking IP ban:', error);
        throw error;
      }
    },

    /**
     * Manually ban an IP address
     */
    async banIp(ipAddress: string, reason: string, bannedBy?: string, hours?: number): Promise<void> {
      try {
        console.log(`[SECURITY] Banning IP: ${ipAddress} by ${bannedBy || 'system'}`);

        let expiresAt: Date | undefined = undefined;
        if (hours !== undefined && hours > 0) {
          expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);
          console.log(`[SECURITY] IP ban will expire at: ${expiresAt.toISOString()}`);
        } else {
          console.log('[SECURITY] Permanent IP ban (no expiration)');
        }

        await storage.createIpBan({
          ipAddress,
          reason,
          bannedBy: bannedBy,
          expiresAt,
        });

        if (bannedBy) {
          await storage.createAdminAction({
            adminId: bannedBy,
            actionType: 'ban_ip',
            targetType: 'ip_address',
            targetId: ipAddress,
            details: { ipAddress, reason, hours, expiresAt },
          });
          console.log(`[SECURITY] Admin action logged for IP ban by ${bannedBy}`);
        }

        console.log(`[SECURITY] IP ${ipAddress} successfully banned`);
      } catch (error) {
        console.error('[SECURITY] Error banning IP:', error);
        throw error;
      }
    },

    /**
     * Remove an IP ban
     */
    async unbanIp(ipAddress: string, unbannedBy?: string): Promise<void> {
      try {
        console.log(`[SECURITY] Unbanning IP: ${ipAddress} by ${unbannedBy || 'system'}`);

        await storage.deleteIpBan(ipAddress);

        if (unbannedBy) {
          await storage.createAdminAction({
            adminId: unbannedBy,
            actionType: 'unban_ip',
            targetType: 'ip_address',
            targetId: ipAddress,
            details: { ipAddress },
          });
          console.log(`[SECURITY] Admin action logged for IP unban by ${unbannedBy}`);
        }

        console.log(`[SECURITY] IP ${ipAddress} successfully unbanned`);
      } catch (error) {
        console.error('[SECURITY] Error unbanning IP:', error);
        throw error;
      }
    },

    /**
     * Get security dashboard metrics
     */
    async getSecurityMetrics(): Promise<{
      totalEvents: number;
      eventsToday: number;
      blockedIps: number;
      uptime: string;
    }> {
      try {
        console.log('[SECURITY] Fetching security metrics');

        const eventMetrics = await storage.getSecurityMetrics();
        const activeIpBans = await storage.getActiveIpBans();

        const metrics = {
          totalEvents: eventMetrics.totalEvents,
          eventsToday: eventMetrics.eventsToday,
          blockedIps: activeIpBans.length,
          uptime: '99.9%',
        };

        console.log('[SECURITY] Metrics fetched:', metrics);
        return metrics;
      } catch (error) {
        console.error('[SECURITY] Error fetching security metrics:', error);
        throw error;
      }
    },
  };

  return instance;
}
