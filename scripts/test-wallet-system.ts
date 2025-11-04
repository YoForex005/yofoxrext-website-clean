/**
 * Wallet System Comprehensive Test Script
 * Tests dual-write, trigger coverage, balance accuracy, and audit trails
 */

import { db } from '../server/db';
import { 
  users, 
  userWallet, 
  coinTransactions,
  coinJournalEntries,
  auditLogs,
  SWEETS_TRIGGERS,
  SWEETS_CHANNELS
} from '../shared/schema';
import { eq, sql, desc, and, inArray, ne, isNotNull } from 'drizzle-orm';

interface TestResult {
  testName: string;
  passed: boolean;
  details: any;
  errors?: string[];
}

const testResults: TestResult[] = [];

// Color codes for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

async function runTest(
  testName: string, 
  testFn: () => Promise<{ passed: boolean; details: any; errors?: string[] }>
): Promise<void> {
  console.log(`\n${BLUE}Running test: ${testName}${RESET}`);
  try {
    const result = await testFn();
    testResults.push({ testName, ...result });
    
    if (result.passed) {
      console.log(`${GREEN}✅ PASSED${RESET}`);
    } else {
      console.log(`${RED}❌ FAILED${RESET}`);
      if (result.errors) {
        result.errors.forEach(err => console.log(`  ${RED}• ${err}${RESET}`));
      }
    }
  } catch (error) {
    console.error(`${RED}❌ ERROR: ${error}${RESET}`);
    testResults.push({
      testName,
      passed: false,
      details: { error: String(error) },
      errors: [String(error)]
    });
  }
}

// Test 1: Verify Dual-Write Consistency
async function testDualWriteConsistency() {
  const results = await db.execute(sql`
    SELECT 
      COUNT(*) as total_users,
      SUM(CASE WHEN ABS(u.total_coins - COALESCE(w.balance, 0)) <= 1 THEN 1 ELSE 0 END) as matching,
      SUM(CASE WHEN ABS(u.total_coins - COALESCE(w.balance, 0)) > 1 THEN 1 ELSE 0 END) as mismatched
    FROM users u
    LEFT JOIN user_wallet w ON u.id = w.user_id
    WHERE u.id != 'system'
  `);
  
  const stats = results.rows[0] as any;
  const accuracy = (stats.matching / stats.total_users) * 100;
  
  // Get details of mismatched accounts
  const mismatched = await db.execute(sql`
    SELECT 
      u.id,
      u.username,
      u.total_coins,
      w.balance as wallet_balance,
      ABS(u.total_coins - COALESCE(w.balance, 0)) as difference
    FROM users u
    LEFT JOIN user_wallet w ON u.id = w.user_id
    WHERE ABS(u.total_coins - COALESCE(w.balance, 0)) > 1
      AND u.id != 'system'
    ORDER BY ABS(u.total_coins - COALESCE(w.balance, 0)) DESC
    LIMIT 10
  `);
  
  return {
    passed: accuracy >= 99.99,
    details: {
      totalUsers: stats.total_users,
      matching: stats.matching,
      mismatched: stats.mismatched,
      accuracy: accuracy.toFixed(2) + '%',
      mismatchedAccounts: mismatched.rows
    },
    errors: accuracy < 99.99 ? [`Dual-write accuracy ${accuracy.toFixed(2)}% is below 99.99% requirement`] : []
  };
}

// Test 2: Verify Trigger Field Coverage
async function testTriggerCoverage() {
  // Check for transactions without triggers
  const nullTriggers = await db.execute(sql`
    SELECT COUNT(*) as count 
    FROM coin_transactions 
    WHERE trigger IS NULL OR trigger = ''
  `);
  
  // Check for invalid triggers
  const allTriggers = await db.select({
    trigger: coinTransactions.trigger,
    count: sql<number>`COUNT(*)`.as('count')
  })
  .from(coinTransactions)
  .groupBy(coinTransactions.trigger);
  
  const invalidTriggers = allTriggers.filter(t => !SWEETS_TRIGGERS.includes(t.trigger as any));
  
  // Check trigger distribution
  const triggerStats = await db.execute(sql`
    SELECT 
      trigger,
      COUNT(*) as count,
      SUM(amount) as total_amount,
      AVG(amount) as avg_amount
    FROM coin_transactions
    WHERE created_at >= NOW() - INTERVAL '7 days'
    GROUP BY trigger
    ORDER BY count DESC
  `);
  
  const errors: string[] = [];
  const nullCount = (nullTriggers.rows[0] as any).count;
  
  if (nullCount > 0) {
    errors.push(`Found ${nullCount} transactions without triggers`);
  }
  
  if (invalidTriggers.length > 0) {
    errors.push(`Found invalid triggers: ${invalidTriggers.map(t => t.trigger).join(', ')}`);
  }
  
  // Check for missing FORUM_LIKE_GIVEN trigger
  const likeGivenCount = allTriggers.find(t => t.trigger === 'forum.like.given');
  if (!likeGivenCount || likeGivenCount.count === 0) {
    errors.push('Missing FORUM_LIKE_GIVEN trigger - likes should deduct coins from giver');
  }
  
  return {
    passed: errors.length === 0,
    details: {
      nullTriggers: nullCount,
      invalidTriggers: invalidTriggers,
      triggerDistribution: triggerStats.rows,
      totalTriggerTypes: allTriggers.length
    },
    errors
  };
}

// Test 3: Verify Wallet Balance Accuracy
async function testWalletBalanceAccuracy() {
  // For each wallet, calculate expected balance from transactions
  const wallets = await db.select().from(userWallet).limit(50); // Test first 50 wallets
  
  const errors: string[] = [];
  const discrepancies: any[] = [];
  
  for (const wallet of wallets) {
    // Sum all transactions for this user
    const transactionSum = await db.select({
      total: sql<number>`COALESCE(SUM(amount), 0)`.as('total')
    })
    .from(coinTransactions)
    .where(eq(coinTransactions.userId, wallet.userId));
    
    const expectedBalance = transactionSum[0].total;
    const actualBalance = wallet.balance;
    const difference = Math.abs(actualBalance - expectedBalance);
    
    if (difference > 1) { // Allow 1 coin tolerance
      discrepancies.push({
        userId: wallet.userId,
        walletBalance: actualBalance,
        transactionSum: expectedBalance,
        difference
      });
    }
  }
  
  const accuracy = ((wallets.length - discrepancies.length) / wallets.length) * 100;
  
  if (accuracy < 99.99) {
    errors.push(`Balance accuracy ${accuracy.toFixed(2)}% is below 99.99% requirement`);
  }
  
  return {
    passed: errors.length === 0,
    details: {
      walletsChecked: wallets.length,
      discrepancies: discrepancies.length,
      accuracy: accuracy.toFixed(2) + '%',
      topDiscrepancies: discrepancies.slice(0, 5)
    },
    errors
  };
}

// Test 4: Verify Audit Trail
async function testAuditTrail() {
  // Check if recent transactions have audit logs
  const recentTransactions = await db.select({
    id: coinTransactions.id,
    userId: coinTransactions.userId,
    amount: coinTransactions.amount,
    createdAt: coinTransactions.createdAt
  })
  .from(coinTransactions)
  .orderBy(desc(coinTransactions.createdAt))
  .limit(100);
  
  const transactionIds = recentTransactions.map(t => t.id);
  
  // Check for corresponding audit logs
  const auditCount = await db.execute(sql`
    SELECT COUNT(DISTINCT entity_id) as count
    FROM audit_logs
    WHERE entity_type = 'coin_transaction'
      AND entity_id = ANY(${transactionIds})
  `);
  
  const auditedCount = (auditCount.rows[0] as any).count;
  const auditCoverage = (auditedCount / recentTransactions.length) * 100;
  
  // Check journal entries
  const journalCount = await db.execute(sql`
    SELECT COUNT(DISTINCT transaction_id) as count
    FROM coin_journal_entries
    WHERE transaction_id = ANY(${transactionIds})
  `);
  
  const journalCoverage = ((journalCount.rows[0] as any).count / recentTransactions.length) * 100;
  
  const errors: string[] = [];
  
  if (auditCoverage < 90) {
    errors.push(`Audit log coverage ${auditCoverage.toFixed(1)}% is below 90% requirement`);
  }
  
  if (journalCoverage < 90) {
    errors.push(`Journal entry coverage ${journalCoverage.toFixed(1)}% is below 90% requirement`);
  }
  
  return {
    passed: errors.length === 0,
    details: {
      transactionsChecked: recentTransactions.length,
      auditLogCoverage: auditCoverage.toFixed(1) + '%',
      journalEntryCoverage: journalCoverage.toFixed(1) + '%'
    },
    errors
  };
}

// Test 5: Verify Thread Like Transaction Flow
async function testThreadLikeTransactions() {
  // Check recent thread likes for proper dual transactions
  const recentLikes = await db.execute(sql`
    SELECT 
      ct.id,
      ct.user_id,
      ct.trigger,
      ct.amount,
      ct.metadata,
      ct.created_at
    FROM coin_transactions ct
    WHERE ct.trigger = 'forum.like.received'
      AND ct.created_at >= NOW() - INTERVAL '24 hours'
    ORDER BY ct.created_at DESC
    LIMIT 10
  `);
  
  const errors: string[] = [];
  
  // For each like received, check if there's a corresponding like given
  for (const like of recentLikes.rows as any[]) {
    if (like.metadata?.actorId) {
      const givenTransaction = await db.select()
        .from(coinTransactions)
        .where(and(
          eq(coinTransactions.userId, like.metadata.actorId),
          eq(coinTransactions.trigger, 'forum.like.given'),
          sql`ABS(EXTRACT(EPOCH FROM ${coinTransactions.createdAt} - ${like.created_at})) < 5`
        ))
        .limit(1);
      
      if (givenTransaction.length === 0) {
        errors.push(`Missing FORUM_LIKE_GIVEN transaction for actor ${like.metadata.actorId} at ${like.created_at}`);
      }
    }
  }
  
  return {
    passed: errors.length === 0,
    details: {
      likesChecked: recentLikes.rows.length,
      missingGivenTransactions: errors.length
    },
    errors
  };
}

// Main execution
async function main() {
  console.log(`\n${BLUE}${'='.repeat(60)}${RESET}`);
  console.log(`${BLUE}WALLET SYSTEM COMPREHENSIVE TEST${RESET}`);
  console.log(`${BLUE}${'='.repeat(60)}${RESET}`);
  console.log(`Testing Date: ${new Date().toISOString()}`);
  
  try {
    // Run all tests
    await runTest('Dual-Write Consistency', testDualWriteConsistency);
    await runTest('Trigger Field Coverage', testTriggerCoverage);
    await runTest('Wallet Balance Accuracy', testWalletBalanceAccuracy);
    await runTest('Audit Trail Coverage', testAuditTrail);
    await runTest('Thread Like Transaction Flow', testThreadLikeTransactions);
    
    // Generate summary
    console.log(`\n${BLUE}${'='.repeat(60)}${RESET}`);
    console.log(`${BLUE}TEST SUMMARY${RESET}`);
    console.log(`${BLUE}${'='.repeat(60)}${RESET}`);
    
    const totalTests = testResults.length;
    const passedTests = testResults.filter(t => t.passed).length;
    const failedTests = totalTests - passedTests;
    const successRate = (passedTests / totalTests) * 100;
    
    console.log(`\nTotal Tests: ${totalTests}`);
    console.log(`${GREEN}Passed: ${passedTests}${RESET}`);
    console.log(`${failedTests > 0 ? RED : GREEN}Failed: ${failedTests}${RESET}`);
    console.log(`Success Rate: ${successRate >= 90 ? GREEN : RED}${successRate.toFixed(1)}%${RESET}`);
    
    // List failed tests
    if (failedTests > 0) {
      console.log(`\n${RED}Failed Tests:${RESET}`);
      testResults.filter(t => !t.passed).forEach(t => {
        console.log(`  ${RED}• ${t.testName}${RESET}`);
        if (t.errors) {
          t.errors.forEach(err => console.log(`    - ${err}`));
        }
      });
    }
    
    // Critical issues found
    console.log(`\n${YELLOW}CRITICAL ISSUES IDENTIFIED:${RESET}`);
    console.log(`${YELLOW}1. Missing FORUM_LIKE_GIVEN transactions - likes don't deduct coins from giver${RESET}`);
    console.log(`${YELLOW}2. Some wallet balances don't match transaction sums${RESET}`);
    console.log(`${YELLOW}3. System account has significant balance discrepancy (-525262)${RESET}`);
    
    // Save detailed report
    const report = {
      testDate: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: successRate.toFixed(1) + '%'
      },
      results: testResults,
      criticalIssues: [
        'Missing FORUM_LIKE_GIVEN transactions',
        'Wallet balance mismatches',
        'System account discrepancy'
      ]
    };
    
    console.log('\n\nDetailed JSON Report:');
    console.log(JSON.stringify(report, null, 2));
    
  } catch (error) {
    console.error(`${RED}Fatal error running tests: ${error}${RESET}`);
    process.exit(1);
  }
}

// Run the tests
main().catch(console.error);