import { db } from '../db.js';
import { botTreasury as adminTreasury, botSettings as botEconomySettings, botAuditLog, users, coinTransactions } from '../../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

/**
 * Treasury Service - Manages the admin treasury and bot economy
 * All bot spending draws from this central treasury
 */

/**
 * Get current treasury balance and settings
 */
export async function getBalance() {
  let treasury = await db.select().from(adminTreasury).limit(1);
  
  if (treasury.length === 0) {
    const result = await db.insert(adminTreasury).values({
      balance: 100000,
      dailySpendLimit: 500,
      todaySpent: 0,
      totalSpent: 0,
      totalRefunded: 0
    }).returning();
    treasury = result;
  }
  
  return treasury[0];
}

/**
 * Spend coins from treasury
 * @param amount - Amount to spend (positive number)
 * @param reason - Reason for spending
 * @param metadata - Additional metadata (botId, targetId, etc.)
 * @returns Success boolean and new balance
 */
export async function spend(amount: number, reason: string, metadata?: Record<string, any>) {
  if (amount <= 0) {
    throw new Error('Spend amount must be positive');
  }
  
  const treasury = await getBalance();
  
  if (treasury.balance < amount) {
    console.warn(`[TREASURY] Insufficient balance: ${treasury.balance} < ${amount}`);
    return { success: false, balance: treasury.balance, message: 'Insufficient treasury balance' };
  }
  
  const newBalance = treasury.balance - amount;
  
  await db.update(adminTreasury)
    .set({
      balance: newBalance,
      todaySpent: treasury.todaySpent + amount,
      totalSpent: treasury.totalSpent + amount,
      updatedAt: new Date()
    })
    .where(eq(adminTreasury.id, treasury.id));
  
  console.log(`[TREASURY] Spent ${amount} coins: ${reason}. New balance: ${newBalance}`);
  
  return { success: true, balance: newBalance };
}

/**
 * Refill treasury with coins
 * @param amount - Amount to add
 * @param adminId - Admin performing the refill
 * @returns New balance
 */
export async function refill(amount: number, adminId?: string) {
  if (amount <= 0) {
    throw new Error('Refill amount must be positive');
  }
  
  const treasury = await getBalance();
  const newBalance = treasury.balance + amount;
  
  await db.update(adminTreasury)
    .set({
      balance: newBalance,
      updatedAt: new Date()
    })
    .where(eq(adminTreasury.id, treasury.id));
  
  if (adminId) {
    await db.insert(botAuditLog).values({
      adminId,
      actionType: 'adjust_spend_limit',
      targetType: 'treasury',
      targetId: treasury.id.toString(),
      previousValue: { balance: treasury.balance },
      newValue: { balance: newBalance },
      reason: 'Manual treasury refill'
    });
  }
  
  console.log(`[TREASURY] Refilled ${amount} coins by admin ${adminId}. New balance: ${newBalance}`);
  
  return { success: true, balance: newBalance };
}

/**
 * Drain a percentage of coins from a user's wallet
 * @param userId - User to drain from
 * @param percentage - Percentage to drain (0-100)
 * @param adminId - Admin performing the drain
 * @returns Amount drained
 */
export async function drainUserWallet(userId: string, percentage: number, adminId?: string) {
  if (percentage < 0 || percentage > 100) {
    throw new Error('Percentage must be between 0 and 100');
  }
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user.length) {
    throw new Error('User not found');
  }
  
  const currentBalance = user[0].totalCoins;
  const drainAmount = Math.floor(currentBalance * (percentage / 100));
  
  if (drainAmount <= 0) {
    return { success: true, amount: 0, message: 'No coins to drain' };
  }
  
  await db.update(users)
    .set({
      totalCoins: currentBalance - drainAmount
    })
    .where(eq(users.id, userId));
  
  await db.insert(coinTransactions).values({
    userId,
    type: 'spend',
    amount: -drainAmount,
    description: `Platform fee (${percentage}%)`,
    status: 'completed'
  });
  
  if (adminId) {
    await db.insert(botAuditLog).values({
      adminId,
      actionType: 'drain_wallet',
      targetType: 'user',
      targetId: userId,
      previousValue: { totalCoins: currentBalance },
      newValue: { totalCoins: currentBalance - drainAmount },
      reason: `Drained ${percentage}% of wallet`
    });
  }
  
  console.log(`[TREASURY] Drained ${drainAmount} coins (${percentage}%) from user ${userId}`);
  
  return { success: true, amount: drainAmount };
}

/**
 * Get audit log entries
 * @param limit - Number of entries to return
 */
export async function getAuditLog(limit: number = 100) {
  const logs = await db.select()
    .from(botAuditLog)
    .orderBy(sql`${botAuditLog.createdAt} DESC`)
    .limit(limit);
  
  return logs;
}

/**
 * Get economy settings
 */
export async function getEconomySettings() {
  let settings = await db.select().from(botEconomySettings).limit(1);
  
  if (settings.length === 0) {
    const result = await db.insert(botEconomySettings).values({
      globalEnabled: true,
      maxActiveBots: 15,
      scanIntervalMinutes: 10,
      purchaseDelayMinutes: 30,
      likeDelayMinutes: 5,
      walletCapEnabled: true,
      walletCapAmount: 199,
      refundTimeHour: 3,
      enableReferralBots: false,
      maxReferralsPerWeek: 2,
      retentionScoreCapPerWeek: 5
    }).returning();
    settings = result;
  }
  
  return settings[0];
}

/**
 * Update economy settings
 * @param updates - Settings to update
 */
export async function updateEconomySettings(updates: Partial<{
  globalEnabled: boolean;
  maxActiveBots: number;
  scanIntervalMinutes: number;
  purchaseDelayMinutes: number;
  likeDelayMinutes: number;
  walletCapEnabled: boolean;
  walletCapAmount: number;
  refundTimeHour: number;
  enableReferralBots: boolean;
  maxReferralsPerWeek: number;
  retentionScoreCapPerWeek: number;
}>) {
  const settings = await getEconomySettings();
  
  await db.update(botEconomySettings)
    .set({
      ...updates,
      updatedAt: new Date()
    })
    .where(eq(botEconomySettings.id, settings.id));
  
  console.log(`[TREASURY] Updated economy settings:`, updates);
  
  return await getEconomySettings();
}

/**
 * Get wallet cap for a user
 * @param userId - User ID (currently unused, but kept for API compatibility)
 * @returns Wallet cap
 */
export async function getUserWalletCap(userId: string): Promise<number> {
  const settings = await getEconomySettings();
  return settings.walletCapAmount;
}

/**
 * Check if user would exceed wallet cap with additional coins
 * @param userId - User ID
 * @param additionalCoins - Coins to add
 * @returns Whether cap would be exceeded
 */
export async function wouldExceedWalletCap(userId: string, additionalCoins: number): Promise<boolean> {
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user.length) {
    return false;
  }
  
  const currentBalance = user[0].totalCoins;
  const cap = await getUserWalletCap(userId);
  
  return (currentBalance + additionalCoins) > cap;
}

/**
 * Get treasury statistics
 */
export async function getTreasuryStats() {
  const treasury = await getBalance();
  const settings = await getEconomySettings();
  
  return {
    balance: treasury.balance,
    dailySpendLimit: treasury.dailySpendLimit,
    todaySpending: treasury.todaySpent,
    remainingToday: Math.max(0, treasury.dailySpendLimit - treasury.todaySpent),
    totalSpent: treasury.totalSpent,
    totalRefilled: treasury.totalRefunded,
    walletCapAmount: settings.walletCapAmount,
    walletCapEnabled: settings.walletCapEnabled
  };
}

/**
 * Reset daily spending counter (called by scheduled job)
 */
export async function resetDailySpending() {
  const treasury = await getBalance();
  
  await db.update(adminTreasury)
    .set({
      todaySpent: 0,
      lastResetAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(adminTreasury.id, treasury.id));
  
  console.log('[TREASURY] Daily spending counter reset');
}
