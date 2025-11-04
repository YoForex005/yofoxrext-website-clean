/**
 * Wallet Balance Reconciliation Script
 * Fixes wallet balance discrepancies and ensures 99.99% accuracy
 */

import { db } from '../server/db';
import { 
  users, 
  userWallet, 
  coinTransactions,
  auditLogs,
  SWEETS_TRIGGERS,
  SWEETS_CHANNELS
} from '../shared/schema';
import { eq, sql, and } from 'drizzle-orm';

const BLUE = '\x1b[34m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const RESET = '\x1b[0m';

interface ReconciliationResult {
  userId: string;
  username: string;
  oldWalletBalance: number;
  oldTotalCoins: number;
  expectedBalance: number;
  newBalance: number;
  adjustment: number;
}

async function reconcileWalletBalances() {
  console.log(`${BLUE}Starting Wallet Balance Reconciliation${RESET}`);
  console.log(`${BLUE}${'='.repeat(60)}${RESET}`);
  
  const startTime = Date.now();
  const results: ReconciliationResult[] = [];
  let fixedCount = 0;
  let totalAdjustment = 0;
  
  try {
    // 1. Get all users with their wallet and transaction data
    console.log(`\n${YELLOW}Step 1: Fetching user and wallet data...${RESET}`);
    
    const userData = await db.execute(sql`
      SELECT 
        u.id,
        u.username,
        u.total_coins,
        w.wallet_id,
        w.balance as wallet_balance,
        w.version as wallet_version,
        COALESCE((
          SELECT SUM(amount)
          FROM coin_transactions ct
          WHERE ct.user_id = u.id
            AND ct.status = 'completed'
        ), 0) as transaction_sum
      FROM users u
      LEFT JOIN user_wallet w ON u.id = w.user_id
      WHERE u.id != 'system'
      ORDER BY u.created_at DESC
    `);
    
    console.log(`Found ${userData.rows.length} users to check`);
    
    // 2. Process each user
    console.log(`\n${YELLOW}Step 2: Reconciling balances...${RESET}`);
    
    for (const user of userData.rows as any[]) {
      const expectedBalance = Number(user.transaction_sum);
      const currentWalletBalance = Number(user.wallet_balance || 0);
      const currentTotalCoins = Number(user.total_coins || 0);
      
      // Check if reconciliation is needed
      const walletDiff = Math.abs(currentWalletBalance - expectedBalance);
      const totalCoinsDiff = Math.abs(currentTotalCoins - expectedBalance);
      
      if (walletDiff > 1 || totalCoinsDiff > 1) {
        console.log(`\n${YELLOW}Fixing user ${user.username}:${RESET}`);
        console.log(`  Current wallet balance: ${currentWalletBalance}`);
        console.log(`  Current total_coins: ${currentTotalCoins}`);
        console.log(`  Expected balance: ${expectedBalance}`);
        console.log(`  Wallet adjustment needed: ${expectedBalance - currentWalletBalance}`);
        console.log(`  Total coins adjustment needed: ${expectedBalance - currentTotalCoins}`);
        
        // Fix the discrepancy
        await db.transaction(async (tx) => {
          // Update user_wallet balance
          if (user.wallet_id) {
            await tx.update(userWallet)
              .set({
                balance: expectedBalance,
                availableBalance: expectedBalance,
                updatedAt: new Date(),
                version: user.wallet_version + 1
              })
              .where(eq(userWallet.userId, user.id));
          } else {
            // Create wallet if missing
            await tx.insert(userWallet)
              .values({
                userId: user.id,
                balance: expectedBalance,
                availableBalance: expectedBalance,
                status: 'active',
                version: 1,
                multiplier: 1,
                updatedAt: new Date()
              });
          }
          
          // Update users.total_coins
          await tx.update(users)
            .set({
              totalCoins: expectedBalance,
              updatedAt: new Date()
            })
            .where(eq(users.id, user.id));
          
          // Create audit log
          await tx.insert(auditLogs)
            .values({
              userId: 'system',
              action: 'wallet_reconciliation',
              entityType: 'user_wallet',
              entityId: user.id,
              metadata: {
                oldWalletBalance: currentWalletBalance,
                oldTotalCoins: currentTotalCoins,
                newBalance: expectedBalance,
                walletAdjustment: expectedBalance - currentWalletBalance,
                totalCoinsAdjustment: expectedBalance - currentTotalCoins,
                reason: 'Automated wallet reconciliation to fix balance discrepancy'
              },
              ipAddress: '127.0.0.1',
              userAgent: 'reconciliation-script',
              createdAt: new Date()
            });
        });
        
        results.push({
          userId: user.id,
          username: user.username,
          oldWalletBalance: currentWalletBalance,
          oldTotalCoins: currentTotalCoins,
          expectedBalance,
          newBalance: expectedBalance,
          adjustment: expectedBalance - currentWalletBalance
        });
        
        fixedCount++;
        totalAdjustment += (expectedBalance - currentWalletBalance);
        
        console.log(`  ${GREEN}✅ Fixed successfully${RESET}`);
      }
    }
    
    // 3. Fix system account (special case)
    console.log(`\n${YELLOW}Step 3: Fixing system account...${RESET}`);
    
    const systemData = await db.execute(sql`
      SELECT 
        u.id,
        u.total_coins,
        w.balance as wallet_balance,
        w.version as wallet_version
      FROM users u
      LEFT JOIN user_wallet w ON u.id = w.user_id
      WHERE u.id = 'system'
    `);
    
    if (systemData.rows.length > 0) {
      const systemUser = systemData.rows[0] as any;
      
      // System account should have 0 balance
      if (systemUser.wallet_balance !== 0 || systemUser.total_coins !== 0) {
        console.log(`Fixing system account balance: ${systemUser.wallet_balance} -> 0`);
        
        await db.transaction(async (tx) => {
          if (systemUser.wallet_balance !== null) {
            await tx.update(userWallet)
              .set({
                balance: 0,
                availableBalance: 0,
                updatedAt: new Date(),
                version: (systemUser.wallet_version || 0) + 1
              })
              .where(eq(userWallet.userId, 'system'));
          }
          
          await tx.update(users)
            .set({
              totalCoins: 0,
              updatedAt: new Date()
            })
            .where(eq(users.id, 'system'));
        });
        
        console.log(`  ${GREEN}✅ System account fixed${RESET}`);
      }
    }
    
    // 4. Verify reconciliation success
    console.log(`\n${YELLOW}Step 4: Verifying reconciliation...${RESET}`);
    
    const verificationResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE 
          WHEN ABS(u.total_coins - COALESCE(w.balance, 0)) <= 1 
          THEN 1 ELSE 0 
        END) as matching,
        SUM(CASE 
          WHEN ABS(u.total_coins - COALESCE(w.balance, 0)) > 1 
          THEN 1 ELSE 0 
        END) as mismatched
      FROM users u
      LEFT JOIN user_wallet w ON u.id = w.user_id
      WHERE u.id != 'system'
    `);
    
    const stats = verificationResult.rows[0] as any;
    const accuracy = (stats.matching / stats.total_users) * 100;
    
    // 5. Print summary
    const duration = Date.now() - startTime;
    
    console.log(`\n${BLUE}${'='.repeat(60)}${RESET}`);
    console.log(`${BLUE}RECONCILIATION COMPLETE${RESET}`);
    console.log(`${BLUE}${'='.repeat(60)}${RESET}`);
    
    console.log(`\n${GREEN}Summary:${RESET}`);
    console.log(`  Total users checked: ${userData.rows.length}`);
    console.log(`  Wallets fixed: ${fixedCount}`);
    console.log(`  Total adjustment: ${totalAdjustment} coins`);
    console.log(`  Final accuracy: ${accuracy.toFixed(2)}%`);
    console.log(`  Duration: ${duration}ms`);
    
    if (accuracy >= 99.99) {
      console.log(`\n${GREEN}✅ SUCCESS: Achieved 99.99% wallet accuracy!${RESET}`);
    } else if (accuracy >= 99) {
      console.log(`\n${YELLOW}⚠️  WARNING: Accuracy is ${accuracy.toFixed(2)}%, below 99.99% target${RESET}`);
    } else {
      console.log(`\n${RED}❌ ERROR: Accuracy is only ${accuracy.toFixed(2)}%${RESET}`);
    }
    
    // Print detailed results
    if (results.length > 0) {
      console.log(`\n${YELLOW}Fixed Users Details:${RESET}`);
      console.table(results.slice(0, 10)); // Show first 10
      
      if (results.length > 10) {
        console.log(`... and ${results.length - 10} more`);
      }
    }
    
    // Save full report to JSON
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        usersChecked: userData.rows.length,
        walletsFixed: fixedCount,
        totalAdjustment,
        finalAccuracy: accuracy.toFixed(2) + '%',
        durationMs: duration
      },
      reconciliations: results
    };
    
    console.log('\n\nFull Report (JSON):');
    console.log(JSON.stringify(report, null, 2));
    
    return report;
    
  } catch (error) {
    console.error(`${RED}Fatal error during reconciliation:${RESET}`, error);
    throw error;
  }
}

// Run the reconciliation
reconcileWalletBalances()
  .then(() => {
    console.log(`\n${GREEN}Reconciliation script completed successfully${RESET}`);
    process.exit(0);
  })
  .catch((error) => {
    console.error(`\n${RED}Reconciliation script failed:${RESET}`, error);
    process.exit(1);
  });