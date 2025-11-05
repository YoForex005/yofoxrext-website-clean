#!/usr/bin/env tsx

/**
 * Fix Onboarding Coins Script - Minimal Version
 * 
 * This script retroactively awards coins to users who completed onboarding tasks.
 * It uses minimal database operations, focusing only on users and coin_transactions tables.
 * 
 * Usage:
 *   npm run tsx scripts/fix-onboarding-coins-minimal.ts --dry-run  # Test mode
 *   npm run tsx scripts/fix-onboarding-coins-minimal.ts            # Execute for real
 */

import { db } from '../server/db';
import { COIN_TRIGGERS, COIN_CHANNELS } from '../shared/schema';
import { sql } from 'drizzle-orm';

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
    trigger: COIN_TRIGGERS.ONBOARDING_WELCOME,
    description: '50 followers milestone reward (retroactive fix)'
  }
};

async function main() {
  console.log(`\n${CYAN}╔═══════════════════════════════════════════════════════╗${RESET}`);
  console.log(`${CYAN}║      Fix Onboarding Coins - Minimal Version          ║${RESET}`);
  console.log(`${CYAN}╚═══════════════════════════════════════════════════════╝${RESET}`);
  
  if (isDryRun) {
    console.log(`\n${YELLOW}🔍 Running in DRY RUN mode - no changes will be made${RESET}\n`);
  } else {
    console.log(`\n${RED}⚠️  Running in EXECUTE mode - coins will be awarded${RESET}\n`);
  }

  let totalUsersProcessed = 0;
  let totalCoinsAwarded = 0;
  let totalTransactions = 0;
  const usersSummary: any[] = [];
  const errors: string[] = [];
  const successfulAwards: any[] = [];

  try {
    // Step 1: Find all users with completed onboarding tasks
    console.log(`${BLUE}Step 1: Finding users with completed onboarding tasks...${RESET}`);
    
    // Get users with onboarding progress
    const usersResult = await db.execute(sql`
      SELECT id, username, onboarding_progress, total_coins
      FROM users
      WHERE onboarding_progress IS NOT NULL
        AND is_bot = false
    `);

    const usersWithOnboarding = usersResult.rows;
    console.log(`Found ${usersWithOnboarding.length} users with onboarding progress\n`);

    // Step 2: Process each user
    for (const user of usersWithOnboarding) {
      const progress = user.onboarding_progress as any;
      if (!progress || typeof progress !== 'object') {
        continue;
      }

      const tasksToAward: any[] = [];

      // Check each task
      for (const [taskKey, taskConfig] of Object.entries(ONBOARDING_TASKS)) {
        if (progress[taskKey] === true) {
          // Check if coins were already awarded for this specific task/trigger combination
          const existingResult = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM coin_transactions
            WHERE user_id = ${user.id}
              AND trigger = ${taskConfig.trigger}
              AND channel = ${COIN_CHANNELS.ONBOARDING}
            LIMIT 1
          `);

          const hasExisting = (existingResult.rows[0] as any).count > 0;

          if (!hasExisting) {
            tasksToAward.push({
              task: taskKey,
              coins: taskConfig.coins,
              trigger: taskConfig.trigger,
              description: taskConfig.description
            });
          }
        }
      }

      if (tasksToAward.length > 0) {
        totalUsersProcessed++;
        
        console.log(`\n${GREEN}User: ${user.username} (${user.id})${RESET}`);
        console.log(`Current coins: ${user.total_coins}`);
        console.log(`Tasks missing coins:`);
        
        let userCoinsAwarded = 0;
        const tasksRewarded: string[] = [];
        
        for (const task of tasksToAward) {
          console.log(`  - ${task.task}: ${task.coins} coins (${task.trigger})`);
          
          if (!isDryRun) {
            try {
              // Double-check to avoid race conditions
              const doubleCheck = await db.execute(sql`
                SELECT COUNT(*) as count
                FROM coin_transactions
                WHERE user_id = ${user.id}
                  AND trigger = ${task.trigger}
                  AND channel = ${COIN_CHANNELS.ONBOARDING}
              `);
              
              if ((doubleCheck.rows[0] as any).count > 0) {
                console.log(`    ${YELLOW}⚠️ Already exists (skipped)${RESET}`);
                continue;
              }
              
              const transactionId = crypto.randomUUID();
              const metadata = {
                source: 'retroactive_fix',
                task: task.task,
                scriptRun: new Date().toISOString()
              };
              
              // Insert coin transaction
              await db.execute(sql`
                INSERT INTO coin_transactions (
                  id, 
                  user_id, 
                  amount, 
                  type, 
                  trigger, 
                  channel,
                  description, 
                  metadata, 
                  status, 
                  created_at
                )
                VALUES (
                  ${transactionId},
                  ${user.id},
                  ${task.coins},
                  'earn',
                  ${task.trigger},
                  ${COIN_CHANNELS.ONBOARDING},
                  ${task.description},
                  ${JSON.stringify(metadata)}::jsonb,
                  'completed',
                  NOW()
                )
              `);

              // Update user's total coins
              await db.execute(sql`
                UPDATE users
                SET total_coins = COALESCE(total_coins, 0) + ${task.coins},
                    updated_at = NOW()
                WHERE id = ${user.id}
              `);

              userCoinsAwarded += task.coins;
              tasksRewarded.push(task.task);
              totalTransactions++;
              
              successfulAwards.push({
                userId: user.id,
                username: user.username,
                task: task.task,
                coins: task.coins,
                trigger: task.trigger,
                transactionId
              });
              
              console.log(`    ${GREEN}✅ Awarded successfully${RESET}`);
              
            } catch (error: any) {
              console.log(`    ${RED}❌ Error: ${error.message}${RESET}`);
              errors.push(`Failed to award ${task.task} to ${user.username}: ${error.message}`);
            }
          } else {
            // Dry run - just count what would be awarded
            userCoinsAwarded += task.coins;
            tasksRewarded.push(task.task);
            totalTransactions++;
          }
        }
        
        totalCoinsAwarded += userCoinsAwarded;
        if (userCoinsAwarded > 0) {
          usersSummary.push({
            userId: user.id,
            username: user.username,
            tasksRewarded,
            coinsAwarded: userCoinsAwarded
          });
        }
      }
    }

    // Step 3: Print summary
    console.log(`\n${CYAN}╔═══════════════════════════════════════════════════════╗${RESET}`);
    console.log(`${CYAN}║                    SUMMARY                           ║${RESET}`);
    console.log(`${CYAN}╚═══════════════════════════════════════════════════════╝${RESET}`);
    
    console.log(`\n${GREEN}✅ Process completed${isDryRun ? ' (DRY RUN)' : ''}${RESET}\n`);
    console.log(`Total users checked: ${usersWithOnboarding.length}`);
    console.log(`Users needing fixes: ${totalUsersProcessed}`);
    console.log(`Total coins awarded: ${totalCoinsAwarded}`);
    console.log(`Total transactions: ${totalTransactions}`);
    
    if (usersSummary.length > 0) {
      console.log(`\n${BLUE}Users who received coins:${RESET}`);
      
      // Sort by coins awarded (descending)
      usersSummary.sort((a, b) => b.coinsAwarded - a.coinsAwarded);
      
      // Show all users who received coins
      for (let i = 0; i < usersSummary.length; i++) {
        const summary = usersSummary[i];
        console.log(`  ${i + 1}. ${summary.username}: ${summary.coinsAwarded} coins for ${summary.tasksRewarded.join(', ')}`);
      }
    }
    
    if (errors.length > 0) {
      console.log(`\n${RED}⚠️  Errors encountered:${RESET}`);
      errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    if (!isDryRun && successfulAwards.length > 0) {
      console.log(`\n${GREEN}✅ Successfully awarded coins:${RESET}`);
      for (const award of successfulAwards) {
        console.log(`  - ${award.username}: ${award.coins} coins for ${award.task} (TX: ${award.transactionId.substring(0, 8)}...)`);
      }
    }
    
    if (isDryRun) {
      console.log(`\n${YELLOW}This was a DRY RUN. To execute the fix, run without --dry-run flag:${RESET}`);
      console.log(`  ${CYAN}npm run tsx scripts/fix-onboarding-coins-minimal.ts${RESET}\n`);
    } else if (successfulAwards.length > 0) {
      console.log(`\n${GREEN}✅ All missing onboarding coins have been awarded!${RESET}\n`);
      
      // Verify the fix worked
      console.log(`${BLUE}Verifying fix...${RESET}`);
      for (const summary of usersSummary.slice(0, 3)) {
        const verifyResult = await db.execute(sql`
          SELECT total_coins FROM users WHERE id = ${summary.userId}
        `);
        
        if (verifyResult.rows[0]) {
          const newCoins = (verifyResult.rows[0] as any).total_coins;
          console.log(`  ${summary.username} now has ${newCoins} total coins (awarded ${summary.coinsAwarded})`);
        }
      }
      
      // Show transaction count verification
      console.log(`\n${BLUE}Transaction verification:${RESET}`);
      const txCount = await db.execute(sql`
        SELECT COUNT(*) as count
        FROM coin_transactions
        WHERE channel = ${COIN_CHANNELS.ONBOARDING}
          AND metadata->>'source' = 'retroactive_fix'
      `);
      console.log(`  Total retroactive fix transactions in database: ${(txCount.rows[0] as any).count}`);
    } else {
      console.log(`\n${YELLOW}No coins were awarded - all users already have their coins or an error occurred.${RESET}\n`);
    }
    
    // Save results summary
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = `scripts/onboarding-fix-results-${timestamp}.json`;
    
    const resultData = {
      timestamp: new Date().toISOString(),
      dryRun: isDryRun,
      totalUsersChecked: usersWithOnboarding.length,
      totalUsersProcessed,
      totalCoinsAwarded,
      totalTransactions,
      usersSummary,
      successfulAwards: !isDryRun ? successfulAwards : [],
      errors
    };
    
    try {
      const fs = await import('fs');
      fs.writeFileSync(resultsFile, JSON.stringify(resultData, null, 2));
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