import { storage } from '../storage/index.js';
import { emailQueueService, EmailPriority } from '../services/emailQueue.js';
import { db } from '../db.js';
import { coinExpirations, users } from '../../shared/schema.js';
import { eq, and, lte, sql } from 'drizzle-orm';

/**
 * Coin Expiration Automation
 * Runs daily at 4 AM to process pending coin expirations
 */

export async function runCoinExpiration(): Promise<{
  usersAffected: number;
  coinsExpired: number;
  errors: number;
}> {
  const startTime = Date.now();
  console.log('[COIN EXPIRATION] Starting coin expiration job...');

  let usersAffected = 0;
  let coinsExpired = 0;
  let errors = 0;
  const now = new Date();

  try {
    // Find all pending expirations that are due
    const pendingExpirations = await db
      .select()
      .from(coinExpirations)
      .where(
        and(
          eq(coinExpirations.status, 'pending'),
          lte(coinExpirations.scheduledExpiryDate, now)
        )
      )
      .orderBy(coinExpirations.scheduledExpiryDate);

    console.log(`[COIN EXPIRATION] Found ${pendingExpirations.length} pending expirations to process`);

    for (const expiration of pendingExpirations) {
      try {
        // Get user wallet
        const wallet = await storage.getUserWallet(expiration.userId);
        if (!wallet) {
          console.warn(`[COIN EXPIRATION] User ${expiration.userId} has no wallet, skipping`);
          errors++;
          continue;
        }

        // Check if user has enough balance
        if (wallet.balance < expiration.expiredAmount) {
          console.warn(`[COIN EXPIRATION] User ${expiration.userId} insufficient balance (${wallet.balance} < ${expiration.expiredAmount}), marking as processed anyway`);
        }

        // Create negative ledger transaction to debit user wallet
        const actualAmount = Math.min(wallet.balance, expiration.expiredAmount);
        
        await storage.beginLedgerTransaction(
          'coin_expiration',
          expiration.userId,
          [
            {
              userId: expiration.userId,
              direction: 'debit',
              amount: actualAmount,
              memo: 'Coin expiration: Coins expired after 12 months of inactivity'
            }
          ],
          {
            expirationId: expiration.id,
            originalAmount: expiration.originalAmount,
            actualAmount
          },
          `expiration-${expiration.id}`
        );

        // Update expiration status
        await db
          .update(coinExpirations)
          .set({
            status: 'processed',
            actualExpiredAt: now
          })
          .where(eq(coinExpirations.id, expiration.id));

        // Send notification email if not already sent
        if (!expiration.notificationSent) {
          try {
            const user = await storage.getUser(expiration.userId);
            if (user && user.email) {
              await emailQueueService.queueEmail({
                userId: expiration.userId,
                templateKey: 'coin_expiration',
                recipientEmail: user.email,
                subject: `${actualAmount} Coins Expired from Your Account`,
                payload: {
                  username: user.username,
                  coinsExpired: actualAmount,
                  reason: 'Coins expired after 12 months of inactivity',
                  expiryDate: expiration.scheduledExpiryDate.toISOString(),
                  currentBalance: wallet.balance - actualAmount
                },
                priority: EmailPriority.MEDIUM
              });

              // Mark notification as sent
              await db
                .update(coinExpirations)
                .set({ notificationSent: true })
                .where(eq(coinExpirations.id, expiration.id));
            }
          } catch (emailError) {
            console.error(`[COIN EXPIRATION] Failed to send email for user ${expiration.userId}:`, emailError);
            // Don't count this as a critical error, continue processing
          }
        }

        usersAffected++;
        coinsExpired += actualAmount;

        console.log(`[COIN EXPIRATION] Processed expiration for user ${expiration.userId}: ${actualAmount} coins`);
      } catch (error) {
        console.error(`[COIN EXPIRATION] Error processing expiration ${expiration.id}:`, error);
        errors++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[COIN EXPIRATION] Job completed in ${duration}ms: ${usersAffected} users, ${coinsExpired} coins expired, ${errors} errors`);

    return {
      usersAffected,
      coinsExpired,
      errors
    };
  } catch (error) {
    console.error('[COIN EXPIRATION] Fatal error in coin expiration job:', error);
    throw error;
  }
}
