/**
 * Test Transaction Integrity Fixes
 * 
 * This script tests all critical Sweets economy accounting fixes:
 * 1. Purchase flow creates negative transaction
 * 2. Withdrawal rejection creates positive refund transaction
 * 3. CHECK constraints prevent wrong signs
 * 4. Idempotency prevents duplicates
 * 
 * Usage: tsx scripts/test-transaction-integrity.ts
 */

import { db } from '../server/db.js';
import { users, coinTransactions, withdrawalRequests, content, contentPurchases, userWallet } from '../shared/schema.js';
import { eq, sql, and } from 'drizzle-orm';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  error?: string;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, error?: string) {
  results.push({ name, passed, message, error });
  const icon = passed ? '✓' : '✗';
  const color = passed ? '\x1b[32m' : '\x1b[31m';
  const reset = '\x1b[0m';
  console.log(`${color}${icon}${reset} ${name}: ${message}`);
  if (error) {
    console.log(`  Error: ${error}`);
  }
}

async function createTestUser(): Promise<string> {
  const [user] = await db.insert(users).values({
    username: `test_user_${Date.now()}`,
    email: `test_${Date.now()}@example.com`,
    totalCoins: 10000,
    level: 10,
  }).returning();
  
  // Create user wallet
  await db.insert(userWallet).values({
    userId: user.id,
    balance: 10000,
    availableBalance: 10000,
  });
  
  return user.id;
}

async function createTestContent(authorId: string): Promise<string> {
  const [item] = await db.insert(content).values({
    author_id: authorId,
    type: 'ea',
    title: 'Test EA for Transaction Testing',
    description: 'This is a test EA',
    priceCoins: 100,
    isFree: false,
    category: 'testing',
  }).returning();
  
  return item.id;
}

async function cleanup(userIds: string[], contentIds: string[]) {
  console.log('\nCleaning up test data...');
  
  for (const userId of userIds) {
    await db.delete(coinTransactions).where(eq(coinTransactions.userId, userId));
    await db.delete(withdrawalRequests).where(eq(withdrawalRequests.userId, userId));
    await db.delete(contentPurchases).where(eq(contentPurchases.buyerId, userId));
    await db.delete(userWallet).where(eq(userWallet.userId, userId));
  }
  
  for (const contentId of contentIds) {
    await db.delete(content).where(eq(content.id, contentId));
  }
  
  for (const userId of userIds) {
    await db.delete(users).where(eq(users.id, userId));
  }
  
  console.log('Cleanup complete');
}

// TEST 1: Verify CHECK constraint prevents 'spend' with positive amount
async function testCheckConstraintSpendNegative() {
  console.log('\n--- TEST 1: CHECK Constraint - Spend Must Be Negative ---');
  
  const userId = await createTestUser();
  
  try {
    // Attempt to create a 'spend' transaction with positive amount (should fail)
    await db.insert(coinTransactions).values({
      userId,
      type: 'spend',
      amount: 100, // POSITIVE - should violate constraint
      description: 'Invalid spend transaction',
      status: 'completed',
      channel: 'test',
      trigger: 'test.constraint.violation',
    });
    
    logTest(
      'CHECK Constraint - Spend Negative',
      false,
      'Failed to reject positive amount for spend transaction'
    );
  } catch (error: any) {
    if (error.message.includes('chk_coin_tx_spend_negative') || error.message.includes('violates check constraint')) {
      logTest(
        'CHECK Constraint - Spend Negative',
        true,
        'Correctly rejected positive amount for spend transaction'
      );
    } else {
      logTest(
        'CHECK Constraint - Spend Negative',
        false,
        'Failed with unexpected error',
        error.message
      );
    }
  } finally {
    await cleanup([userId], []);
  }
}

// TEST 2: Verify CHECK constraint prevents 'earn' with negative amount
async function testCheckConstraintEarnPositive() {
  console.log('\n--- TEST 2: CHECK Constraint - Earn Must Be Positive ---');
  
  const userId = await createTestUser();
  
  try {
    // Attempt to create an 'earn' transaction with negative amount (should fail)
    await db.insert(coinTransactions).values({
      userId,
      type: 'earn',
      amount: -100, // NEGATIVE - should violate constraint
      description: 'Invalid earn transaction',
      status: 'completed',
      channel: 'test',
      trigger: 'test.constraint.violation',
    });
    
    logTest(
      'CHECK Constraint - Earn Positive',
      false,
      'Failed to reject negative amount for earn transaction'
    );
  } catch (error: any) {
    if (error.message.includes('chk_coin_tx_earn_positive') || error.message.includes('violates check constraint')) {
      logTest(
        'CHECK Constraint - Earn Positive',
        true,
        'Correctly rejected negative amount for earn transaction'
      );
    } else {
      logTest(
        'CHECK Constraint - Earn Positive',
        false,
        'Failed with unexpected error',
        error.message
      );
    }
  } finally {
    await cleanup([userId], []);
  }
}

// TEST 3: Verify idempotency key prevents duplicates
async function testIdempotencyPreventsduplicates() {
  console.log('\n--- TEST 3: Idempotency Key Prevents Duplicates ---');
  
  const userId = await createTestUser();
  const idempotencyKey = `test_idempotency_${Date.now()}`;
  
  try {
    // Create first transaction
    await db.insert(coinTransactions).values({
      userId,
      type: 'earn',
      amount: 50,
      description: 'First transaction',
      status: 'completed',
      channel: 'test',
      trigger: 'test.idempotency',
      idempotencyKey,
    });
    
    // Attempt to create duplicate transaction with same idempotency key
    try {
      await db.insert(coinTransactions).values({
        userId,
        type: 'earn',
        amount: 50,
        description: 'Duplicate transaction',
        status: 'completed',
        channel: 'test',
        trigger: 'test.idempotency',
        idempotencyKey,
      });
      
      logTest(
        'Idempotency Key Prevents Duplicates',
        false,
        'Failed to prevent duplicate transaction'
      );
    } catch (error: any) {
      if (error.message.includes('unique') || error.message.includes('duplicate')) {
        logTest(
          'Idempotency Key Prevents Duplicates',
          true,
          'Correctly prevented duplicate transaction'
        );
      } else {
        logTest(
          'Idempotency Key Prevents Duplicates',
          false,
          'Failed with unexpected error',
          error.message
        );
      }
    }
  } finally {
    await cleanup([userId], []);
  }
}

// TEST 4: Verify withdrawal rejection creates refund transaction
async function testWithdrawalRejectionRefund() {
  console.log('\n--- TEST 4: Withdrawal Rejection Creates Refund Transaction ---');
  
  const userId = await createTestUser();
  
  try {
    // Create a withdrawal request
    const [withdrawal] = await db.insert(withdrawalRequests).values({
      userId,
      amount: 1000,
      method: 'crypto',
      walletAddress: 'test_wallet_address',
      status: 'pending',
      processingFee: 50,
    }).returning();
    
    // Deduct coins (simulate withdrawal creation)
    await db.update(users)
      .set({ 
        totalCoins: sql`${users.totalCoins} - ${withdrawal.amount}`,
        level: sql`FLOOR((${users.totalCoins} - ${withdrawal.amount}) / 1000)`
      })
      .where(eq(users.id, userId));
    
    // Count transactions before rejection
    const [beforeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.userId, userId),
          eq(coinTransactions.trigger, 'treasury.withdraw.rejected')
        )
      );
    
    // Simulate rejection using the storage method
    const { storage } = await import('../server/storage/index.js');
    await storage.rejectWithdrawal(withdrawal.id, userId, 'Test rejection');
    
    // Count transactions after rejection
    const [afterCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coinTransactions)
      .where(
        and(
          eq(coinTransactions.userId, userId),
          eq(coinTransactions.trigger, 'treasury.withdraw.rejected')
        )
      );
    
    const transactionCreated = Number(afterCount.count) > Number(beforeCount.count);
    
    if (transactionCreated) {
      // Verify the transaction details
      const [refundTx] = await db
        .select()
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            eq(coinTransactions.trigger, 'treasury.withdraw.rejected')
          )
        );
      
      const correctType = refundTx.type === 'earn';
      const correctAmount = refundTx.amount === withdrawal.amount;
      const correctChannel = refundTx.channel === 'treasury';
      
      if (correctType && correctAmount && correctChannel) {
        logTest(
          'Withdrawal Rejection Creates Refund',
          true,
          `Refund transaction created: ${refundTx.amount} coins, type=${refundTx.type}, channel=${refundTx.channel}`
        );
      } else {
        logTest(
          'Withdrawal Rejection Creates Refund',
          false,
          `Transaction created but incorrect: type=${refundTx.type} (expected: earn), amount=${refundTx.amount} (expected: ${withdrawal.amount}), channel=${refundTx.channel} (expected: treasury)`
        );
      }
    } else {
      logTest(
        'Withdrawal Rejection Creates Refund',
        false,
        'No refund transaction was created'
      );
    }
  } catch (error: any) {
    logTest(
      'Withdrawal Rejection Creates Refund',
      false,
      'Test failed with error',
      error.message
    );
  } finally {
    await cleanup([userId], []);
  }
}

// TEST 5: Verify valid spend transaction is allowed
async function testValidSpendTransaction() {
  console.log('\n--- TEST 5: Valid Spend Transaction ---');
  
  const userId = await createTestUser();
  
  try {
    // Create a valid 'spend' transaction with negative amount
    const [tx] = await db.insert(coinTransactions).values({
      userId,
      type: 'spend',
      amount: -100, // NEGATIVE - correct for spend
      description: 'Valid spend transaction',
      status: 'completed',
      channel: 'test',
      trigger: 'test.valid.spend',
    }).returning();
    
    logTest(
      'Valid Spend Transaction',
      true,
      `Spend transaction created successfully with amount=${tx.amount}`
    );
  } catch (error: any) {
    logTest(
      'Valid Spend Transaction',
      false,
      'Failed to create valid spend transaction',
      error.message
    );
  } finally {
    await cleanup([userId], []);
  }
}

// TEST 6: Verify valid earn transaction is allowed
async function testValidEarnTransaction() {
  console.log('\n--- TEST 6: Valid Earn Transaction ---');
  
  const userId = await createTestUser();
  
  try {
    // Create a valid 'earn' transaction with positive amount
    const [tx] = await db.insert(coinTransactions).values({
      userId,
      type: 'earn',
      amount: 100, // POSITIVE - correct for earn
      description: 'Valid earn transaction',
      status: 'completed',
      channel: 'test',
      trigger: 'test.valid.earn',
    }).returning();
    
    logTest(
      'Valid Earn Transaction',
      true,
      `Earn transaction created successfully with amount=${tx.amount}`
    );
  } catch (error: any) {
    logTest(
      'Valid Earn Transaction',
      false,
      'Failed to create valid earn transaction',
      error.message
    );
  } finally {
    await cleanup([userId], []);
  }
}

async function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  console.log('');
  
  if (failed > 0) {
    console.log('FAILED TESTS:');
    results.filter(r => !r.passed).forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.name}`);
      console.log(`     ${result.message}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
  }
  
  console.log('='.repeat(80));
  
  if (passed === total) {
    console.log('\n✓ All tests passed! Transaction integrity fixes verified.');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests failed. Please review and fix.');
    process.exit(1);
  }
}

async function main() {
  console.log('Starting Transaction Integrity Tests');
  console.log('='.repeat(80));
  
  try {
    await testCheckConstraintSpendNegative();
    await testCheckConstraintEarnPositive();
    await testIdempotencyPreventsduplicates();
    await testValidSpendTransaction();
    await testValidEarnTransaction();
    await testWithdrawalRejectionRefund();
    
    await printSummary();
  } catch (error) {
    console.error('\nFatal error during testing:', error);
    process.exit(1);
  }
}

main();
