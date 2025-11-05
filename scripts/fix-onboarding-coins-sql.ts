#!/usr/bin/env tsx

/**
 * Fix Onboarding Coins Script - Raw SQL Version
 * 
 * This script uses raw SQL queries to retroactively award coins to users
 * who completed onboarding tasks but didn't receive their coins.
 * 
 * Usage:
 *   npm run tsx scripts/fix-onboarding-coins-sql.ts --dry-run  # Test mode
 *   npm run tsx scripts/fix-onboarding-coins-sql.ts            # Execute for real
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
  console.log(`${CYAN}║     Fix Onboarding Coins - Raw SQL Version           ║${RESET}`);
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
          // Check if coins were already awarded
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
              const transactionId = crypto.randomUUID();
              const idempotencyKey = `onboarding_fix_${user.id}_${task.task}`;
              const metadata = JSON.stringify({
                source: 'retroactive_fix',
                task: task.task,
                scriptRun: new Date().toISOString()
              });
              
              // Insert coin transaction using raw SQL
              await db.execute(sql`
                INSERT INTO coin_transactions (
                  id, user_id, amount, type, trigger, channel,
                  description, metadata, idempotency_key, status, created_at
                )
                VALUES (
                  ${transactionId},
                  ${user.id},
                  ${task.coins},
                  'earn',
                  ${task.trigger},
                  ${COIN_CHANNELS.ONBOARDING},
                  ${task.description},
                  ${metadata}::jsonb,
                  ${idempotencyKey},
                  'completed',
                  NOW()
                )
                ON CONFLICT (idempotency_key) DO NOTHING
              `);

              // Update user's total coins
              await db.execute(sql`
                UPDATE users
                SET total_coins = COALESCE(total_coins, 0) + ${task.coins},
                    updated_at = NOW()
                WHERE id = ${user.id}
              `);

              // Update or insert into user_wallet
              await db.execute(sql`
                INSERT INTO user_wallet (
                  user_id, balance, available_balance, pending_balance,
                  version, created_at, updated_at
                )
                VALUES (
                  ${user.id},
                  ${task.coins},
                  ${task.coins},
                  0,
                  1,
                  NOW(),
                  NOW()
                )
                ON CONFLICT (user_id) DO UPDATE
                SET balance = user_wallet.balance + ${task.coins},
                    available_balance = user_wallet.available_balance + ${task.coins},
                    updated_at = NOW()
              `);

              userCoinsAwarded += task.coins;
              tasksRewarded.push(task.task);
              totalTransactions++;
              console.log(`    ${GREEN}✅ Awarded${RESET}`);
            } catch (error: any) {
              // Check if it's a duplicate (idempotency key conflict)
              if (error.message?.includes('duplicate')) {
                console.log(`    ${YELLOW}⚠️ Already exists${RESET}`);
              } else {
                console.log(`    ${RED}❌ Error: ${error.message}${RESET}`);
                errors.push(`Failed to award ${task.task} to ${user.username}: ${error.message}`);
              }
            }
          } else {
            userCoinsAwarded += task.coins;
            tasksRewarded.push(task.task);
            totalTransactions++;
          }
        }
        
        totalCoinsAwarded += userCoinsAwarded;
        usersSummary.push({
          userId: user.id,
          username: user.username,
          tasksRewarded,
          coinsAwarded: userCoinsAwarded
        });
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
      
      // Show top 10
      const displayCount = Math.min(10, usersSummary.length);
      for (let i = 0; i < displayCount; i++) {
        const summary = usersSummary[i];
        console.log(`  ${i + 1}. ${summary.username}: ${summary.coinsAwarded} coins for ${summary.tasksRewarded.join(', ')}`);
      }
      
      if (usersSummary.length > 10) {
        console.log(`  ... and ${usersSummary.length - 10} more users`);
      }
    }
    
    if (errors.length > 0) {
      console.log(`\n${RED}⚠️  Errors encountered:${RESET}`);
      errors.forEach(error => {
        console.log(`  - ${error}`);
      });
    }
    
    if (isDryRun) {
      console.log(`\n${YELLOW}This was a DRY RUN. To execute the fix, run without --dry-run flag:${RESET}`);
      console.log(`  ${CYAN}npm run tsx scripts/fix-onboarding-coins-sql.ts${RESET}\n`);
    } else {
      console.log(`\n${GREEN}✅ All missing onboarding coins have been awarded!${RESET}\n`);
      
      // Verify the fix worked
      if (usersSummary.length > 0) {
        console.log(`${BLUE}Verifying fix for first user...${RESET}`);
        const firstUser = usersSummary[0];
        const verifyResult = await db.execute(sql`
          SELECT total_coins FROM users WHERE id = ${firstUser.userId}
        `);
        
        if (verifyResult.rows[0]) {
          console.log(`${firstUser.username} now has ${(verifyResult.rows[0] as any).total_coins} total coins`);
        }
      }
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