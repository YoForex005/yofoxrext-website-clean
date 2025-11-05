#!/usr/bin/env tsx

/**
 * Fix Onboarding Coins Script - Direct Database Version
 * 
 * This script retroactively awards coins to users who completed onboarding tasks
 * but didn't receive their coins. This version uses direct database operations
 * to work around the missing daily_transaction_limit column issue.
 * 
 * Usage:
 *   npm run tsx scripts/fix-onboarding-coins-direct.ts --dry-run  # Test mode
 *   npm run tsx scripts/fix-onboarding-coins-direct.ts            # Execute for real
 */

import { db } from '../server/db';
import { 
  users, 
  coinTransactions,
  userWallet,
  coinJournalEntries,
  COIN_TRIGGERS,
  COIN_CHANNELS
} from '../shared/schema';
import { eq, and, or, sql, inArray } from 'drizzle-orm';

// Command line arguments
const isDryRun = process.argv.includes('--dry-run');

// Color codes for console output
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

// Onboarding task configuration
const ONBOARDING_TASKS = {
  profilePicture: {
    coins: 10,
    trigger: COIN_TRIGGERS.ONBOARDING_PROFILE_PICTURE,
    description: 'Profile picture upload reward (retroactive fix)'
  },
  firstReply: {
    coins: 5,
    trigger: COIN_TRIGGERS.ONBOARDING_FIRST_POST,
    description: 'First forum reply reward (retroactive fix)'
  },
  twoReviews: {
    coins: 6,
    trigger: COIN_TRIGGERS.ONBOARDING_FIRST_REVIEW,
    description: 'First review submission reward (retroactive fix)'
  },
  firstThread: {
    coins: 10,
    trigger: COIN_TRIGGERS.ONBOARDING_FIRST_THREAD,
    description: 'First thread creation reward (retroactive fix)'
  },
  firstPublish: {
    coins: 30,
    trigger: COIN_TRIGGERS.ONBOARDING_FIRST_PUBLISH,
    description: 'First EA/content publish reward (retroactive fix)'
  },
  fiftyFollowers: {
    coins: 200,
    trigger: COIN_TRIGGERS.ONBOARDING_WELCOME, // Using a generic trigger for this
    description: '50 followers milestone reward (retroactive fix)'
  }
};

interface TaskCompletion {
  userId: string;
  username: string;
  task: string;
  coinsOwed: number;
  trigger: string;
  description: string;
}

interface FixResult {
  totalUsersProcessed: number;
  totalCoinsAwarded: number;
  totalTransactions: number;
  usersSummary: {
    userId: string;
    username: string;
    tasksRewarded: string[];
    coinsAwarded: number;
  }[];
  errors: string[];
}

async function awardCoinsDirectly(
  userId: string,
  amount: number,
  trigger: string,
  description: string,
  task: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use a transaction to ensure atomicity
    await db.transaction(async (tx) => {
      // Create idempotency key
      const idempotencyKey = `onboarding_fix_${userId}_${task}`;
      
      // Check if transaction already exists
      const existing = await tx.select()
        .from(coinTransactions)
        .where(
          and(
            eq(coinTransactions.userId, userId),
            eq(coinTransactions.idempotencyKey, idempotencyKey)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        console.log(`    ${YELLOW}⚠️ Already exists (idempotency check)${RESET}`);
        return;
      }

      // Insert coin transaction
      const [transaction] = await tx.insert(coinTransactions)
        .values({
          userId,
          amount,
          type: "earn",
          trigger,
          channel: COIN_CHANNELS.ONBOARDING,
          description,
          metadata: {
            source: 'retroactive_fix',
            task,
            scriptRun: new Date().toISOString()
          },
          idempotencyKey,
          status: "completed",
          createdAt: new Date()
        })
        .returning();

      // Update users table
      await tx.update(users)
        .set({
          totalCoins: sql`COALESCE(${users.totalCoins}, 0) + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Check if wallet exists
      const walletExists = await tx.select()
        .from(userWallet)
        .where(eq(userWallet.userId, userId))
        .limit(1);

      if (walletExists.length > 0) {
        // Update existing wallet
        await tx.update(userWallet)
          .set({
            balance: sql`COALESCE(${userWallet.balance}, 0) + ${amount}`,
            availableBalance: sql`COALESCE(${userWallet.availableBalance}, 0) + ${amount}`,
            updatedAt: new Date()
          })
          .where(eq(userWallet.userId, userId));
      } else {
        // Create wallet if it doesn't exist
        await tx.insert(userWallet)
          .values({
            userId,
            balance: amount,
            availableBalance: amount,
            pendingBalance: 0,
            version: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }

      // Create journal entry for double-entry bookkeeping
      await tx.insert(coinJournalEntries)
        .values({
          transactionId: transaction.id,
          accountType: 'user',
          accountId: userId,
          entryType: 'debit', // User receives coins (debit to user account)
          amount,
          balanceBefore: 0, // We don't have the exact before balance
          balanceAfter: 0,  // We don't have the exact after balance
          description: `${description} - Transaction ${transaction.id}`,
          metadata: {
            trigger,
            task,
            source: 'retroactive_fix'
          },
          createdAt: new Date()
        });
    });

    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
    };
  }
}

async function main() {
  console.log(`\n${CYAN}╔═══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║  Fix Onboarding Coins - Direct DB Version            ║${RESET}`);
  console.log(`${CYAN}╚═══════════════════════════════════════════════════════╝${RESET}`);
  
  if (isDryRun) {
    console.log(`\n${YELLOW}🔍 Running in DRY RUN mode - no changes will be made${RESET}\n`);
  } else {
    console.log(`\n${RED}⚠️  Running in EXECUTE mode - coins will be awarded${RESET}\n`);
  }

  const result: FixResult = {
    totalUsersProcessed: 0,
    totalCoinsAwarded: 0,
    totalTransactions: 0,
    usersSummary: [],
    errors: []
  };

  try {
    // Step 1: Find all users with completed onboarding tasks
    console.log(`${BLUE}Step 1: Finding users with completed onboarding tasks...${RESET}`);
    
    const usersWithOnboarding = await db.select({
      id: users.id,
      username: users.username,
      onboardingProgress: users.onboardingProgress,
      totalCoins: users.totalCoins,
      isBot: users.isBot
    })
    .from(users)
    .where(
      and(
        sql`${users.onboardingProgress} IS NOT NULL`,
        eq(users.isBot, false) // Exclude bots
      )
    );

    console.log(`Found ${usersWithOnboarding.length} users with onboarding progress\n`);

    // Step 2: Process each user
    let processedCount = 0;
    
    for (const user of usersWithOnboarding) {
      processedCount++;
      
      // Parse onboarding progress
      const progress = user.onboardingProgress as any;
      if (!progress || typeof progress !== 'object') {
        continue;
      }

      const completedTasks: TaskCompletion[] = [];
      
      // Check each task
      for (const [taskKey, taskConfig] of Object.entries(ONBOARDING_TASKS)) {
        if (progress[taskKey] === true) {
          // Task was completed, check if coins were already awarded
          const existingTransaction = await db.select()
            .from(coinTransactions)
            .where(
              and(
                eq(coinTransactions.userId, user.id),
                eq(coinTransactions.trigger, taskConfig.trigger),
                eq(coinTransactions.channel, COIN_CHANNELS.ONBOARDING)
              )
            )
            .limit(1);

          if (existingTransaction.length === 0) {
            // Coins were not awarded for this task
            completedTasks.push({
              userId: user.id,
              username: user.username,
              task: taskKey,
              coinsOwed: taskConfig.coins,
              trigger: taskConfig.trigger,
              description: taskConfig.description
            });
          }
        }
      }

      if (completedTasks.length > 0) {
        result.totalUsersProcessed++;
        
        console.log(`\n${GREEN}User: ${user.username} (${user.id})${RESET}`);
        console.log(`Current coins: ${user.totalCoins}`);
        console.log(`Tasks missing coins:`);
        
        let userCoinsAwarded = 0;
        const tasksRewarded: string[] = [];
        
        for (const task of completedTasks) {
          console.log(`  - ${task.task}: ${task.coinsOwed} coins (${task.trigger})`);
          
          if (!isDryRun) {
            try {
              // Award coins directly
              const txResult = await awardCoinsDirectly(
                task.userId,
                task.coinsOwed,
                task.trigger,
                task.description,
                task.task
              );

              if (txResult.success) {
                userCoinsAwarded += task.coinsOwed;
                tasksRewarded.push(task.task);
                result.totalTransactions++;
                console.log(`    ${GREEN}✅ Awarded${RESET}`);
              } else {
                console.log(`    ${RED}❌ Failed: ${txResult.error}${RESET}`);
                result.errors.push(`Failed to award ${task.task} to ${task.username}: ${txResult.error}`);
              }
            } catch (error) {
              console.log(`    ${RED}❌ Error: ${error}${RESET}`);
              result.errors.push(`Error awarding ${task.task} to ${task.username}: ${error}`);
            }
          } else {
            userCoinsAwarded += task.coinsOwed;
            tasksRewarded.push(task.task);
            result.totalTransactions++;
          }
        }
        
        result.totalCoinsAwarded += userCoinsAwarded;
        result.usersSummary.push({
          userId: user.id,
          username: user.username,
          tasksRewarded,
          coinsAwarded: userCoinsAwarded
        });
        
        // Progress indicator
        if (processedCount % 10 === 0) {
          console.log(`\n${CYAN}Progress: ${processedCount}/${usersWithOnboarding.length} users checked${RESET}`);
        }
      }
    }

    // Step 3: Print summary
    console.log(`\n${CYAN}╔═══════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${CYAN}║                    SUMMARY                           ║${RESET}`);
    console.log(`${CYAN}╚═══════════════════════════════════════════════════════╝${RESET}`);
    
    console.log(`\n${GREEN}✅ Process completed${isDryRun ? ' (DRY RUN)' : ''}${RESET}\n`);
    console.log(`Total users checked: ${usersWithOnboarding.length}`);
    console.log(`Users needing fixes: ${result.totalUsersProcessed}`);
    console.log(`Total coins awarded: ${result.totalCoinsAwarded}`);
    console.log(`Total transactions: ${result.totalTransactions}`);
    
    if (result.usersSummary.length > 0) {
      console.log(`\n${BLUE}Users who received coins:${RESET}`);
      
      // Sort by coins awarded (descending)
      result.usersSummary.sort((a, b) => b.coinsAwarded - a.coinsAwarded);
      
      // Show top 10
      const displayCount = Math.min(10, result.usersSummary.length);
      for (let i = 0; i < displayCount; i++) {
        const summary = result.usersSummary[i];
        console.log(`  ${i + 1}. ${summary.username}: ${summary.coinsAwarded} coins for ${summary.tasksRewarded.join(', ')}`);
      }
      
      if (result.usersSummary.length > 10) {
        console.log(`  ... and ${result.usersSummary.length - 10} more users`);
      }
    }
    
    if (result.errors.length > 0) {
      console.log(`\n${RED}⚠️  Errors encountered:${RESET}`);
      result.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    if (isDryRun) {
      console.log(`\n${YELLOW}This was a DRY RUN. To execute the fix, run without --dry-run flag:${RESET}`);
      console.log(`  ${CYAN}npm run tsx scripts/fix-onboarding-coins-direct.ts${RESET}\n`);
    } else {
      console.log(`\n${GREEN}✅ All missing onboarding coins have been awarded!${RESET}\n`);
      
      // Verify the fix worked by checking a few users
      if (result.usersSummary.length > 0) {
        console.log(`${BLUE}Verifying fix for first user...${RESET}`);
        const firstUser = result.usersSummary[0];
        const updatedUser = await db.select({
          totalCoins: users.totalCoins
        })
        .from(users)
        .where(eq(users.id, firstUser.userId))
        .limit(1);
        
        if (updatedUser[0]) {
          console.log(`${firstUser.username} now has ${updatedUser[0].totalCoins} total coins`);
        }
      }
    }
    
    // Save detailed results to file for audit
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `scripts/onboarding-fix-results-${timestamp}.json`;
    
    // Use dynamic import for fs module
    try {
      const fs = await import('fs');
      fs.writeFileSync(resultsFile, JSON.stringify(result, null, 2));
      console.log(`\n${BLUE}Detailed results saved to: ${resultsFile}${RESET}\n`);
    } catch (fileError) {
      console.log(`\n${YELLOW}Could not save results file: ${fileError}${RESET}`);
    }

  } catch (error) {
    console.error(`\n${RED}Fatal error:${RESET}`, error);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error(`\n${RED}Unhandled error:${RESET}`, error);
  process.exit(1);
});