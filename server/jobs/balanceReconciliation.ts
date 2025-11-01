import { storage } from '../storage/index.js';
import { emailQueueService, EmailPriority } from '../services/emailQueue.js';
import { db } from '../db.js';
import { userWallet, coinJournalEntries, users } from '../../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

/**
 * Balance Reconciliation Automation
 * Runs weekly (Sunday 3 AM) to verify wallet balances match journal entries
 */

export async function runBalanceReconciliation(): Promise<{
  usersChecked: number;
  discrepanciesFound: number;
  totalDrift: number;
}> {
  const startTime = Date.now();
  console.log('[BALANCE RECONCILIATION] Starting weekly balance reconciliation job...');

  let usersChecked = 0;
  let discrepanciesFound = 0;
  let totalDrift = 0;
  const discrepancies: Array<{
    userId: string;
    username: string;
    walletBalance: number;
    journalBalance: number;
    drift: number;
  }> = [];

  try {
    // Get all users with wallets
    const allWallets = await db.select().from(userWallet);

    console.log(`[BALANCE RECONCILIATION] Checking ${allWallets.length} user wallets...`);

    for (const wallet of allWallets) {
      try {
        usersChecked++;

        // Calculate expected balance from journal entries
        const journalSum = await db
          .select({
            total: sql<number>`COALESCE(SUM(
              CASE 
                WHEN ${coinJournalEntries.direction} = 'debit' THEN -${coinJournalEntries.amount}
                WHEN ${coinJournalEntries.direction} = 'credit' THEN ${coinJournalEntries.amount}
                ELSE 0
              END
            ), 0)`.as('total')
          })
          .from(coinJournalEntries)
          .where(eq(coinJournalEntries.walletId, wallet.walletId));

        const expectedBalance = journalSum[0]?.total || 0;
        const actualBalance = wallet.balance;
        const drift = Math.abs(actualBalance - expectedBalance);

        // Check for discrepancy (allow 1 coin tolerance for rounding)
        if (drift > 1) {
          discrepanciesFound++;
          totalDrift += drift;

          // Get user details
          const user = await storage.getUser(wallet.userId);
          const username = user?.username || 'Unknown';

          discrepancies.push({
            userId: wallet.userId,
            username,
            walletBalance: actualBalance,
            journalBalance: expectedBalance,
            drift
          });

          console.warn(`[BALANCE RECONCILIATION] ⚠️  Discrepancy found for user ${username}: Wallet=${actualBalance}, Journal=${expectedBalance}, Drift=${drift}`);

          // Create fraud signal for investigation
          await storage.createFraudSignal(
            wallet.userId,
            'suspicious_pattern',
            drift > 100 ? 'high' : 'medium',
            {
              type: 'balance_mismatch',
              walletBalance: actualBalance,
              journalBalance: expectedBalance,
              drift,
              detectedAt: new Date().toISOString(),
              requiresInvestigation: true
            }
          );
        }
      } catch (error) {
        console.error(`[BALANCE RECONCILIATION] Error checking wallet ${wallet.userId}:`, error);
      }

      // Progress update every 100 users
      if (usersChecked % 100 === 0) {
        console.log(`[BALANCE RECONCILIATION] Progress: ${usersChecked}/${allWallets.length} users checked`);
      }
    }

    // Generate reconciliation report
    const report = {
      timestamp: new Date().toISOString(),
      usersChecked,
      discrepanciesFound,
      totalDrift,
      discrepancies: discrepancies.slice(0, 20), // Top 20 discrepancies
      status: discrepanciesFound === 0 ? 'CLEAN' : discrepanciesFound < 10 ? 'ACCEPTABLE' : 'REQUIRES_ATTENTION'
    };

    console.log(`[BALANCE RECONCILIATION] Report: ${JSON.stringify(report, null, 2)}`);

    // Alert admin if significant discrepancies found
    if (discrepanciesFound > 0) {
      await alertAdminOfDiscrepancies(report);
    }

    const duration = Date.now() - startTime;
    console.log(`[BALANCE RECONCILIATION] Job completed in ${duration}ms: ${usersChecked} users checked, ${discrepanciesFound} discrepancies found`);

    return {
      usersChecked,
      discrepanciesFound,
      totalDrift
    };
  } catch (error) {
    console.error('[BALANCE RECONCILIATION] Fatal error in balance reconciliation job:', error);
    throw error;
  }
}

/**
 * Alert admin about balance discrepancies
 */
async function alertAdminOfDiscrepancies(report: any): Promise<void> {
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
          templateKey: 'balance_reconciliation_report',
          recipientEmail: admin.email,
          subject: `📊 Weekly Balance Reconciliation Report: ${report.discrepanciesFound} Discrepancies Found`,
          payload: {
            adminUsername: admin.username,
            usersChecked: report.usersChecked,
            discrepanciesFound: report.discrepanciesFound,
            totalDrift: report.totalDrift,
            status: report.status,
            topDiscrepancies: report.discrepancies,
            reportDate: report.timestamp,
            dashboardUrl: '/admin/economy'
          },
          priority: report.status === 'REQUIRES_ATTENTION' ? EmailPriority.HIGH : EmailPriority.MEDIUM
        });
      }
    }

    console.log(`[BALANCE RECONCILIATION] Admin report sent to ${adminUsers.length} admins`);
  } catch (error) {
    console.error('[BALANCE RECONCILIATION] Failed to send admin report:', error);
  }
}
