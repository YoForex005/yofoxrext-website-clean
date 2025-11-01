import { storage } from '../storage/index.js';
import { emailQueueService, EmailPriority } from '../services/emailQueue.js';
import { db } from '../db.js';
import { userWallet, redemptionOrders, coinExpirations, users, bots } from '../../shared/schema.js';
import { eq, sql, and, gte } from 'drizzle-orm';

/**
 * Treasury Snapshot Automation
 * Runs daily at 6 AM to capture coin economy metrics
 */

const ANOMALY_THRESHOLD = 0.10; // Alert if 10% or more discrepancy

export async function runTreasurySnapshot(): Promise<{
  totalUserBalance: number;
  botTreasuryBalance: number;
  pendingRedemptions: number;
  anomalyDetected: boolean;
}> {
  const startTime = Date.now();
  console.log('[TREASURY SNAPSHOT] Starting treasury snapshot job...');

  try {
    const now = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // 1. Calculate total user balances
    const totalUserBalanceResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${userWallet.balance}), 0)`.as('total')
      })
      .from(userWallet);

    const totalUserBalance = totalUserBalanceResult[0]?.total || 0;

    // 2. Calculate bot treasury balance (sum of all bot wallet balances)
    const botBalancesResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${userWallet.balance}), 0)`.as('total')
      })
      .from(userWallet)
      .innerJoin(users, eq(userWallet.userId, users.id))
      .where(eq(users.isBot, true));

    const botTreasuryBalance = botBalancesResult[0]?.total || 0;

    // 3. Calculate pending redemptions
    const pendingRedemptionsResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${redemptionOrders.coinAmount}), 0)`.as('total')
      })
      .from(redemptionOrders)
      .where(eq(redemptionOrders.status, 'pending'));

    const pendingRedemptions = pendingRedemptionsResult[0]?.total || 0;

    // 4. Calculate expired coins in last 24 hours
    const expiredCoinsResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${coinExpirations.expiredAmount}), 0)`.as('total')
      })
      .from(coinExpirations)
      .where(
        and(
          eq(coinExpirations.status, 'processed'),
          gte(coinExpirations.actualExpiredAt, yesterday)
        )
      );

    const expiredCoinsLast24h = expiredCoinsResult[0]?.total || 0;

    // 5. Calculate total coins issued (for reference)
    const totalCoinsInCirculation = totalUserBalance + pendingRedemptions;

    // 6. Create treasury snapshot
    const snapshot = await storage.createTreasurySnapshot({
      snapshotDate: now,
      userBalancesTotal: totalUserBalance,
      botTreasuryBalance,
      totalBalance: totalCoinsInCirculation,
      pendingRedemptions,
      expiredCoinsTotal: expiredCoinsLast24h,
      metadata: {
        userWalletCount: await db.select({ count: sql<number>`COUNT(*)` }).from(userWallet).then(r => r[0]?.count || 0),
        botCount: await db.select({ count: sql<number>`COUNT(*)` }).from(users).where(eq(users.isBot, true)).then(r => r[0]?.count || 0),
        snapshot_timestamp: now.toISOString()
      }
    });

    console.log(`[TREASURY SNAPSHOT] Created snapshot: ${totalCoinsInCirculation} coins in circulation`);

    // 7. Compare with previous day for anomaly detection
    const previousSnapshot = await storage.getLatestTreasurySnapshot();
    let anomalyDetected = false;

    if (previousSnapshot && previousSnapshot.id !== snapshot.id) {
      const prevTotal = previousSnapshot.totalBalance;
      const currentTotal = snapshot.totalBalance;
      const percentageChange = Math.abs((currentTotal - prevTotal) / prevTotal);

      if (percentageChange > ANOMALY_THRESHOLD) {
        anomalyDetected = true;
        const change = ((currentTotal - prevTotal) / prevTotal * 100).toFixed(2);
        
        console.warn(`[TREASURY SNAPSHOT] 🚨 ANOMALY DETECTED: ${change}% change in total coins (${prevTotal} -> ${currentTotal})`);

        // Alert admin
        await alertAdminOfAnomaly({
          previousTotal: prevTotal,
          currentTotal,
          percentageChange: change,
          previousDate: new Date(previousSnapshot.snapshotDate),
          currentDate: new Date(snapshot.snapshotDate)
        });
      } else {
        console.log(`[TREASURY SNAPSHOT] ✓ Treasury healthy: ${(percentageChange * 100).toFixed(2)}% change (within threshold)`);
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[TREASURY SNAPSHOT] Job completed in ${duration}ms`);

    return {
      totalUserBalance,
      botTreasuryBalance,
      pendingRedemptions,
      anomalyDetected
    };
  } catch (error) {
    console.error('[TREASURY SNAPSHOT] Fatal error in treasury snapshot job:', error);
    throw error;
  }
}

/**
 * Alert admin about treasury anomalies
 */
async function alertAdminOfAnomaly(anomaly: {
  previousTotal: number;
  currentTotal: number;
  percentageChange: string;
  previousDate: Date;
  currentDate: Date;
}): Promise<void> {
  try {
    const adminUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'))
      .limit(5);

    for (const admin of adminUsers) {
      if (admin.email) {
        await emailQueueService.queueEmail({
          userId: admin.id,
          templateKey: 'treasury_anomaly',
          recipientEmail: admin.email,
          subject: `🚨 Treasury Anomaly Alert: ${anomaly.percentageChange}% Change Detected`,
          payload: {
            adminUsername: admin.username,
            previousTotal: anomaly.previousTotal,
            currentTotal: anomaly.currentTotal,
            percentageChange: anomaly.percentageChange,
            previousDate: anomaly.previousDate.toISOString(),
            currentDate: anomaly.currentDate.toISOString(),
            dashboardUrl: '/admin/economy'
          },
          priority: EmailPriority.HIGH
        });
      }
    }

    console.log(`[TREASURY SNAPSHOT] Admin anomaly alert sent`);
  } catch (error) {
    console.error('[TREASURY SNAPSHOT] Failed to send admin alert:', error);
  }
}
