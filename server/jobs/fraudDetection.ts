import { storage } from '../storage/index.js';
import { emailQueueService, EmailPriority } from '../services/emailQueue.js';
import { db } from '../db.js';
import { coinTransactions, users, fraudSignals } from '../../shared/schema.js';
import { eq, gte, sql, desc, and } from 'drizzle-orm';

/**
 * Fraud Detection Automation
 * Runs hourly to scan for suspicious coin transaction patterns
 */

const FRAUD_THRESHOLDS = {
  HOURLY_EARN_LIMIT: 500, // Max coins a user can earn in 1 hour
  VELOCITY_MULTIPLIER: 5, // Suspicious if activity spikes 5x above average
  MIN_TRANSACTIONS_FOR_ANALYSIS: 5 // Minimum transactions to analyze patterns
};

export async function runFraudDetection(): Promise<{
  signalsCreated: number;
  highSeverityAlerts: number;
  usersPaused: number;
}> {
  const startTime = Date.now();
  console.log('[FRAUD DETECTION] Starting fraud detection job...');

  let signalsCreated = 0;
  let highSeverityAlerts = 0;
  let usersPaused = 0;

  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get all active users
    const activeUsers = await db
      .select({ userId: coinTransactions.userId })
      .from(coinTransactions)
      .where(gte(coinTransactions.createdAt, oneHourAgo))
      .groupBy(coinTransactions.userId);

    console.log(`[FRAUD DETECTION] Analyzing ${activeUsers.length} active users in last hour`);

    for (const { userId } of activeUsers) {
      try {
        // Check 1: Rate limit breach - user earning >500 coins in 1 hour
        const hourlyEarnings = await db
          .select({ 
            total: sql<number>`SUM(${coinTransactions.amount})`.as('total')
          })
          .from(coinTransactions)
          .where(
            and(
              eq(coinTransactions.userId, userId),
              eq(coinTransactions.type, 'earn'),
              gte(coinTransactions.createdAt, oneHourAgo)
            )
          );

        const totalEarned = hourlyEarnings[0]?.total || 0;
        
        if (totalEarned > FRAUD_THRESHOLDS.HOURLY_EARN_LIMIT) {
          const signal = await storage.createFraudSignal(
            userId,
            'rate_limit_breach',
            totalEarned > FRAUD_THRESHOLDS.HOURLY_EARN_LIMIT * 2 ? 'critical' : 'high',
            {
              coinsEarned: totalEarned,
              threshold: FRAUD_THRESHOLDS.HOURLY_EARN_LIMIT,
              timeWindow: '1 hour',
              detectedAt: new Date().toISOString()
            }
          );

          signalsCreated++;
          highSeverityAlerts++;

          console.log(`[FRAUD DETECTION] Rate limit breach detected for user ${userId}: ${totalEarned} coins in 1 hour`);

          // Alert admin for critical cases
          if (signal.severity === 'critical') {
            await alertAdmin('rate_limit_breach', userId, totalEarned);
          }
        }

        // Check 2: Velocity anomaly - sudden spike in activity
        const recentTransactions = await db
          .select()
          .from(coinTransactions)
          .where(
            and(
              eq(coinTransactions.userId, userId),
              gte(coinTransactions.createdAt, oneHourAgo)
            )
          );

        const historicalTransactions = await db
          .select()
          .from(coinTransactions)
          .where(
            and(
              eq(coinTransactions.userId, userId),
              gte(coinTransactions.createdAt, oneDayAgo)
            )
          );

        if (historicalTransactions.length >= FRAUD_THRESHOLDS.MIN_TRANSACTIONS_FOR_ANALYSIS) {
          const avgHourlyTxCount = historicalTransactions.length / 24;
          const currentHourlyTxCount = recentTransactions.length;

          if (currentHourlyTxCount > avgHourlyTxCount * FRAUD_THRESHOLDS.VELOCITY_MULTIPLIER) {
            await storage.createFraudSignal(
              userId,
              'velocity_anomaly',
              'medium',
              {
                currentTransactions: currentHourlyTxCount,
                averageTransactions: avgHourlyTxCount,
                multiplier: currentHourlyTxCount / avgHourlyTxCount,
                detectedAt: new Date().toISOString()
              }
            );

            signalsCreated++;

            console.log(`[FRAUD DETECTION] Velocity anomaly detected for user ${userId}: ${currentHourlyTxCount} txns (avg: ${avgHourlyTxCount})`);
          }
        }

        // Check 3: Suspicious pattern - multiple earn transactions with same amount
        const suspiciousPatterns = await db
          .select({
            amount: coinTransactions.amount,
            count: sql<number>`COUNT(*)`.as('count')
          })
          .from(coinTransactions)
          .where(
            and(
              eq(coinTransactions.userId, userId),
              eq(coinTransactions.type, 'earn'),
              gte(coinTransactions.createdAt, oneHourAgo)
            )
          )
          .groupBy(coinTransactions.amount)
          .having(sql`COUNT(*) >= 10`); // 10 identical transactions in 1 hour

        if (suspiciousPatterns.length > 0) {
          await storage.createFraudSignal(
            userId,
            'suspicious_pattern',
            'medium',
            {
              patterns: suspiciousPatterns,
              description: 'Multiple identical earn transactions detected',
              detectedAt: new Date().toISOString()
            }
          );

          signalsCreated++;

          console.log(`[FRAUD DETECTION] Suspicious pattern detected for user ${userId}: ${suspiciousPatterns.length} repeated patterns`);
        }
      } catch (error) {
        console.error(`[FRAUD DETECTION] Error analyzing user ${userId}:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[FRAUD DETECTION] Job completed in ${duration}ms: ${signalsCreated} signals created, ${highSeverityAlerts} high severity alerts`);

    return {
      signalsCreated,
      highSeverityAlerts,
      usersPaused
    };
  } catch (error) {
    console.error('[FRAUD DETECTION] Fatal error in fraud detection job:', error);
    throw error;
  }
}

/**
 * Alert admin about high-severity fraud signals
 */
async function alertAdmin(type: string, userId: string, amount: number): Promise<void> {
  try {
    // Get admin users
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(5);

    for (const admin of adminUsers) {
      if (admin.email) {
        await emailQueueService.queueEmail({
          userId: admin.id,
          templateKey: 'fraud_alert',
          recipientEmail: admin.email,
          subject: `🚨 CRITICAL: Fraud Alert - User ${userId}`,
          payload: {
            adminUsername: admin.username,
            fraudType: type,
            userId,
            amount,
            timestamp: new Date().toISOString(),
            dashboardUrl: '/admin/moderation'
          },
          priority: EmailPriority.HIGH
        });
      }
    }

    console.log(`[FRAUD DETECTION] Admin alert sent for ${type} - user ${userId}`);
  } catch (error) {
    console.error('[FRAUD DETECTION] Failed to send admin alert:', error);
  }
}
