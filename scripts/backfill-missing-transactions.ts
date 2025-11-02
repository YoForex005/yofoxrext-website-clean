/**
 * Backfill Missing Coin Transaction Records
 * 
 * This script identifies and backfills missing coin transaction records
 * by calculating the gap between users.totalCoins and SUM(coin_transactions.amount).
 * 
 * Usage: tsx scripts/backfill-missing-transactions.ts [--dry-run] [--limit=N]
 * 
 * Options:
 *   --dry-run    Run without making changes (default: false)
 *   --limit=N    Limit backfill to N users (default: all users)
 *   --user-id=ID Backfill specific user only
 */

import { db } from '../server/db.js';
import { users, coinTransactions } from '../shared/schema.js';
import { eq, sql } from 'drizzle-orm';

interface BackfillResult {
  userId: string;
  username: string;
  totalCoins: number;
  transactionSum: number;
  gap: number;
  backfilled: boolean;
  transactionId?: string;
  error?: string;
}

interface BackfillSummary {
  totalUsers: number;
  usersWithGaps: number;
  usersBackfilled: number;
  totalGapAmount: number;
  totalBackfilledAmount: number;
  errors: number;
  results: BackfillResult[];
}

async function calculateUserGap(userId: string): Promise<{ totalCoins: number; transactionSum: number; gap: number }> {
  // Get user's current total coins
  const [user] = await db
    .select({ totalCoins: users.totalCoins })
    .from(users)
    .where(eq(users.id, userId));
  
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  
  // Calculate sum of all coin transactions
  const [txSum] = await db
    .select({ sum: sql<number>`COALESCE(SUM(${coinTransactions.amount}), 0)` })
    .from(coinTransactions)
    .where(eq(coinTransactions.userId, userId));
  
  const totalCoins = user.totalCoins || 0;
  const transactionSum = Number(txSum?.sum || 0);
  const gap = totalCoins - transactionSum;
  
  return { totalCoins, transactionSum, gap };
}

async function backfillUserGap(
  userId: string,
  username: string,
  gap: number,
  dryRun: boolean
): Promise<BackfillResult> {
  const { totalCoins, transactionSum } = await calculateUserGap(userId);
  
  const result: BackfillResult = {
    userId,
    username,
    totalCoins,
    transactionSum,
    gap,
    backfilled: false,
  };
  
  // Only backfill if gap exists
  if (gap === 0) {
    return result;
  }
  
  if (dryRun) {
    console.log(`[DRY RUN] Would backfill ${gap} coins for user ${username} (${userId})`);
    return result;
  }
  
  try {
    // Create backfill transaction
    const [transaction] = await db
      .insert(coinTransactions)
      .values({
        userId,
        type: gap > 0 ? 'earn' : 'spend',
        amount: gap,
        description: `Historical balance migration backfill (system reconciliation)`,
        status: 'completed',
        channel: 'system',
        trigger: 'system.migration.backfill',
        metadata: {
          backfillDate: new Date().toISOString(),
          previousBalance: transactionSum,
          currentBalance: totalCoins,
          gap,
          reason: 'Missing transaction records from pre-accounting system',
        },
        reconciledAt: new Date(),
        createdAt: new Date(),
      })
      .returning();
    
    result.backfilled = true;
    result.transactionId = transaction.id;
    
    console.log(`✓ Backfilled ${gap} coins for user ${username} (${userId}) - Transaction ID: ${transaction.id}`);
  } catch (error: any) {
    result.error = error.message;
    console.error(`✗ Failed to backfill user ${username} (${userId}):`, error.message);
  }
  
  return result;
}

async function generateReport(summary: BackfillSummary, dryRun: boolean): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log('BACKFILL SUMMARY REPORT');
  console.log('='.repeat(80));
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes made)' : 'LIVE BACKFILL'}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('');
  
  console.log('STATISTICS:');
  console.log(`  Total users scanned: ${summary.totalUsers}`);
  console.log(`  Users with gaps: ${summary.usersWithGaps}`);
  console.log(`  Users backfilled: ${summary.usersBackfilled}`);
  console.log(`  Total gap amount: ${summary.totalGapAmount.toLocaleString()} coins`);
  console.log(`  Total backfilled: ${summary.totalBackfilledAmount.toLocaleString()} coins`);
  console.log(`  Errors: ${summary.errors}`);
  console.log('');
  
  if (summary.usersWithGaps > 0) {
    console.log('TOP 10 LARGEST GAPS:');
    const sortedByGap = [...summary.results]
      .filter(r => r.gap !== 0)
      .sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))
      .slice(0, 10);
    
    sortedByGap.forEach((result, index) => {
      const status = result.backfilled ? '✓' : (result.error ? '✗' : '-');
      console.log(`  ${index + 1}. ${status} ${result.username} (${result.userId})`);
      console.log(`     Total: ${result.totalCoins} | TX Sum: ${result.transactionSum} | Gap: ${result.gap}`);
      if (result.transactionId) {
        console.log(`     Transaction ID: ${result.transactionId}`);
      }
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
  }
  
  console.log('\n' + '='.repeat(80));
  
  // Verification
  if (!dryRun && summary.usersBackfilled > 0) {
    console.log('\nVERIFICATION (Post-Backfill):');
    let verifiedCount = 0;
    let verificationFailed = 0;
    
    for (const result of summary.results.filter(r => r.backfilled)) {
      const { totalCoins, transactionSum, gap } = await calculateUserGap(result.userId);
      
      if (gap === 0) {
        verifiedCount++;
      } else {
        verificationFailed++;
        console.log(`  ✗ Verification failed for ${result.username}: gap still ${gap}`);
      }
    }
    
    console.log(`  ✓ ${verifiedCount} users verified (gap = 0)`);
    if (verificationFailed > 0) {
      console.log(`  ✗ ${verificationFailed} users failed verification`);
    }
    console.log('='.repeat(80));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : undefined;
  const userIdArg = args.find(arg => arg.startsWith('--user-id='));
  const specificUserId = userIdArg ? userIdArg.split('=')[1] : undefined;
  
  console.log('Starting Coin Transaction Backfill Script');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'LIVE BACKFILL'}`);
  if (limit) console.log(`Limit: ${limit} users`);
  if (specificUserId) console.log(`Target User: ${specificUserId}`);
  console.log('');
  
  const summary: BackfillSummary = {
    totalUsers: 0,
    usersWithGaps: 0,
    usersBackfilled: 0,
    totalGapAmount: 0,
    totalBackfilledAmount: 0,
    errors: 0,
    results: [],
  };
  
  try {
    // Fetch users to process
    let usersQuery = db
      .select({
        id: users.id,
        username: users.username,
        totalCoins: users.totalCoins,
      })
      .from(users);
    
    if (specificUserId) {
      usersQuery = usersQuery.where(eq(users.id, specificUserId)) as any;
    }
    
    if (limit && !specificUserId) {
      usersQuery = usersQuery.limit(limit) as any;
    }
    
    const allUsers = await usersQuery;
    summary.totalUsers = allUsers.length;
    
    console.log(`Processing ${summary.totalUsers} users...`);
    console.log('');
    
    // Process each user
    for (let i = 0; i < allUsers.length; i++) {
      const user = allUsers[i];
      
      if (i > 0 && i % 100 === 0) {
        console.log(`Progress: ${i}/${summary.totalUsers} users processed`);
      }
      
      try {
        const { totalCoins, transactionSum, gap } = await calculateUserGap(user.id);
        
        if (gap !== 0) {
          summary.usersWithGaps++;
          summary.totalGapAmount += gap;
          
          const result = await backfillUserGap(user.id, user.username, gap, dryRun);
          summary.results.push(result);
          
          if (result.backfilled) {
            summary.usersBackfilled++;
            summary.totalBackfilledAmount += gap;
          }
          
          if (result.error) {
            summary.errors++;
          }
        }
      } catch (error: any) {
        console.error(`Error processing user ${user.username}:`, error.message);
        summary.errors++;
        summary.results.push({
          userId: user.id,
          username: user.username,
          totalCoins: user.totalCoins || 0,
          transactionSum: 0,
          gap: 0,
          backfilled: false,
          error: error.message,
        });
      }
    }
    
    // Generate final report
    await generateReport(summary, dryRun);
    
    if (dryRun) {
      console.log('\n*** DRY RUN COMPLETE - No changes were made ***');
      console.log('Run without --dry-run to apply changes');
    } else {
      console.log('\n*** BACKFILL COMPLETE ***');
    }
    
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
main();
