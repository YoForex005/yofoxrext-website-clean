import { db } from '../db';
import { users, coinTransactions, userWallet, coinLedgerTransactions, auditLogs, SWEETS_TRIGGERS, SWEETS_CHANNELS } from '@shared/schema';
import { eq, sql, and } from 'drizzle-orm';
import { emitAdminSweetsTransaction, emitSweetsBalanceUpdated } from './dashboardWebSocket';

interface CoinTransactionRequest {
  userId: string;
  amount: number; // Positive for earning, negative for spending
  trigger: typeof SWEETS_TRIGGERS[number]; // Must be from defined taxonomy
  channel: typeof SWEETS_CHANNELS[number]; // Must be from defined taxonomy
  description: string;
  metadata?: any; // JSON payload: {contentId, actorId, context}
  idempotencyKey?: string; // For duplicate prevention
  type?: "earn" | "spend" | "recharge"; // Transaction type (optional, will be inferred from amount)
}

interface CoinTransactionResult {
  success: boolean;
  transactionId?: string;
  newBalance?: number;
  error?: string;
  duplicate?: boolean; // True if idempotency key matched existing transaction
}

/**
 * CoinTransactionService - Atomic transaction service for Sweets Economy
 * 
 * This service ensures all coin transactions are:
 * - Atomic (dual-write to user_wallet + users.total_coins)
 * - Consistent (optimistic concurrency control via version field)
 * - Idempotent (duplicate prevention via idempotency keys)
 * - Safe (fraud detection: rate limits, duplicate detection)
 * - Auditable (comprehensive logging)
 * 
 * Phase 2 of Sweets Economy implementation.
 */
export class CoinTransactionService {
  /**
   * Execute a coin transaction with dual ledger writes
   * Updates BOTH user_wallet and users.total_coins atomically
   * 
   * Features:
   * - Drizzle transaction for atomicity
   * - Optimistic concurrency control (wallet version)
   * - Idempotency key deduplication
   * - Fraud detection (rate limits, negative balance check)
   * - Audit logging
   * - Trigger/channel enforcement
   */
  async executeTransaction(request: CoinTransactionRequest): Promise<CoinTransactionResult> {
    try {
      // Step 1: Check idempotency (prevent duplicate transactions)
      if (request.idempotencyKey) {
        const existingTransactionId = await this.checkIdempotency(request.idempotencyKey);
        if (existingTransactionId) {
          console.log(`[CoinTransactionService] Idempotency key already used: ${request.idempotencyKey}`);
          
          // Return existing transaction details
          const existingTransaction = await db.select()
            .from(coinTransactions)
            .where(eq(coinTransactions.id, existingTransactionId))
            .limit(1);
          
          if (existingTransaction[0]) {
            // Get current balance from user_wallet
            const wallet = await db.select()
              .from(userWallet)
              .where(eq(userWallet.userId, request.userId))
              .limit(1);
            
            return {
              success: true,
              transactionId: existingTransactionId,
              newBalance: wallet[0]?.balance || 0,
              duplicate: true,
            };
          }
        }
      }

      // Step 2: Validate trigger and channel
      if (!SWEETS_TRIGGERS.includes(request.trigger as any)) {
        return {
          success: false,
          error: `Invalid trigger: ${request.trigger}. Must be one of: ${SWEETS_TRIGGERS.join(', ')}`,
        };
      }

      if (!SWEETS_CHANNELS.includes(request.channel as any)) {
        return {
          success: false,
          error: `Invalid channel: ${request.channel}. Must be one of: ${SWEETS_CHANNELS.join(', ')}`,
        };
      }

      // Step 3: Perform fraud checks
      const fraudCheck = await this.performFraudChecks(request.userId, request.amount, request.trigger);
      if (!fraudCheck.valid) {
        console.warn(`[CoinTransactionService] Fraud check failed for user ${request.userId}: ${fraudCheck.reason}`);
        return {
          success: false,
          error: fraudCheck.reason || 'Transaction blocked by fraud detection',
        };
      }

      // Step 4: Execute atomic transaction (dual-write with optimistic locking)
      const result = await db.transaction(async (tx) => {
        // Get current wallet with row-level lock
        const walletRows = await tx.select()
          .from(userWallet)
          .where(eq(userWallet.userId, request.userId))
          .for('update');
        
        if (!walletRows || walletRows.length === 0) {
          throw new Error(`User wallet not found for userId: ${request.userId}`);
        }

        const currentWallet = walletRows[0];
        const newBalance = currentWallet.balance + request.amount;

        // Prevent negative balance (unless admin override)
        if (newBalance < 0 && request.channel !== 'admin') {
          throw new Error(`Insufficient balance. Current: ${currentWallet.balance}, Required: ${Math.abs(request.amount)}`);
        }

        // Infer transaction type from amount if not provided
        const transactionType = request.type || (request.amount >= 0 ? "earn" : "spend");

        // Insert into coinTransactions
        const [transaction] = await tx.insert(coinTransactions)
          .values({
            userId: request.userId,
            amount: request.amount,
            type: transactionType,
            trigger: request.trigger,
            channel: request.channel,
            description: request.description,
            metadata: request.metadata || null,
            idempotencyKey: request.idempotencyKey || null,
            status: "completed",
            createdAt: new Date()
          })
          .returning();

        // Update user_wallet with version check (optimistic concurrency)
        const [updatedWallet] = await tx.update(userWallet)
          .set({
            balance: newBalance,
            availableBalance: newBalance, // Update both balance and availableBalance
            updatedAt: new Date(),
            version: currentWallet.version + 1
          })
          .where(
            and(
              eq(userWallet.userId, request.userId),
              eq(userWallet.version, currentWallet.version) // Optimistic lock
            )
          )
          .returning();

        if (!updatedWallet) {
          throw new Error('Wallet version conflict - transaction was modified concurrently. Please retry.');
        }

        // Update users.total_coins (dual-write for backward compatibility)
        await tx.update(users)
          .set({
            totalCoins: sql`${users.totalCoins} + ${request.amount}`,
            updatedAt: new Date()
          })
          .where(eq(users.id, request.userId));

        // Insert into coinLedgerTransactions for additional audit trail
        // Note: This requires creating a ledger transaction header first
        const [ledgerTx] = await tx.insert(coinLedgerTransactions)
          .values({
            type: request.trigger,
            context: {
              channel: request.channel,
              description: request.description,
              metadata: request.metadata,
            },
            externalRef: transaction.id,
            initiatorUserId: request.userId,
            status: "completed",
            closedAt: new Date(),
            createdAt: new Date()
          })
          .returning();

        // Audit logging (only for admin actions or high-value transactions)
        if (request.channel === 'admin' || Math.abs(request.amount) > 500) {
          await this.logAudit(tx, request.userId, 'coin_transaction', {
            transactionId: transaction.id,
            ledgerTransactionId: ledgerTx.id,
            trigger: request.trigger,
            channel: request.channel,
            amount: request.amount,
            balanceBefore: currentWallet.balance,
            balanceAfter: newBalance,
            description: request.description,
            metadata: request.metadata,
            idempotencyKey: request.idempotencyKey,
          });
        }

        return {
          success: true,
          transactionId: transaction.id,
          newBalance: newBalance,
          duplicate: false,
        };
      });

      console.log(`[CoinTransactionService] Transaction completed: ${result.transactionId}, User: ${request.userId}, Amount: ${request.amount}, New Balance: ${result.newBalance}`);
      
      // Emit to CLIENT namespace (user gets notified)
      emitSweetsBalanceUpdated(request.userId, {
        newBalance: result.newBalance!,
        change: request.amount,
      });
      
      // Emit to ADMIN namespace (admins get notified of ALL transactions)
      emitAdminSweetsTransaction({
        userId: request.userId,
        transactionId: result.transactionId!,
        amount: request.amount,
        trigger: request.trigger,
        channel: request.channel,
        newBalance: result.newBalance!,
      });
      
      return result;

    } catch (error) {
      console.error('[CoinTransactionService] Transaction failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  /**
   * Check if idempotency key has been used
   * Returns transaction ID if found, null otherwise
   */
  private async checkIdempotency(key: string): Promise<string | null> {
    try {
      const results = await db.select({
        id: coinTransactions.id
      })
        .from(coinTransactions)
        .where(eq(coinTransactions.idempotencyKey, key))
        .limit(1);

      return results.length > 0 ? results[0].id : null;
    } catch (error) {
      console.error('[CoinTransactionService] Idempotency check failed:', error);
      return null;
    }
  }

  /**
   * Fraud detection checks
   * 
   * Checks:
   * 1. Rate limiting (max 10 transactions per minute)
   * 2. Duplicate detection (same trigger within 5 seconds)
   * 3. Amount limits (max 1000 coins per transaction unless admin)
   */
  private async performFraudChecks(
    userId: string, 
    amount: number, 
    trigger: string
  ): Promise<{valid: boolean, reason?: string}> {
    try {
      // Check 1: Rate limit (max 10 transactions per minute)
      const recentTransactions = await db.select()
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            sql`${coinTransactions.createdAt} > NOW() - INTERVAL '1 minute'`
          )
        );

      if (recentTransactions.length >= 10) {
        return { 
          valid: false, 
          reason: 'Rate limit exceeded (max 10 transactions per minute)' 
        };
      }

      // Check 2: Duplicate detection (same trigger within 5 seconds)
      const duplicates = await db.select()
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            eq(coinTransactions.trigger, trigger),
            sql`${coinTransactions.createdAt} > NOW() - INTERVAL '5 seconds'`
          )
        );

      if (duplicates.length > 0) {
        return { 
          valid: false, 
          reason: 'Duplicate transaction detected (same trigger within 5 seconds)' 
        };
      }

      // Check 3: Spending limit (no single transaction > 1000 coins unless admin)
      if (Math.abs(amount) > 1000 && !trigger.startsWith('admin.')) {
        return { 
          valid: false, 
          reason: 'Transaction amount exceeds maximum (1000 coins)' 
        };
      }

      return { valid: true };
    } catch (error) {
      console.error('[CoinTransactionService] Fraud check error:', error);
      // Fail open - allow transaction if fraud check fails
      return { valid: true };
    }
  }

  /**
   * Log to audit trail
   * Only logs admin actions and high-value transactions
   */
  private async logAudit(
    tx: any,
    userId: string, 
    action: string, 
    details: any
  ): Promise<void> {
    try {
      await tx.insert(auditLogs)
        .values({
          adminId: userId, // User who initiated the transaction
          action: action,
          actionCategory: 'coin_economy',
          targetType: 'coin_transaction',
          targetId: details.transactionId,
          metadata: details,
          createdAt: new Date()
        });
    } catch (error) {
      console.error('[CoinTransactionService] Audit logging failed:', error);
      // Don't throw - audit logging failure shouldn't block transaction
    }
  }
}

// Export singleton instance
export const coinTransactionService = new CoinTransactionService();
