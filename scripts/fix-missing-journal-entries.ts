import { db } from "../server/db";
import { users, userWallet, coinJournalEntries, coinLedgerTransactions } from "../shared/schema";
import { eq, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

async function main() {
  console.log("🔍 Finding users with coins but no journal entries...\n");

  try {
    // Find users with total_coins > 0 but no journal entries
    const usersWithCoinsButNoJournal = await db
      .select({
        userId: users.id,
        username: users.username,
        totalCoins: users.totalCoins,
        walletId: userWallet.walletId,
      })
      .from(users)
      .innerJoin(userWallet, eq(users.id, userWallet.userId))
      .where(
        and(
          sql`${users.totalCoins} > 0`,
          sql`NOT EXISTS (
            SELECT 1 FROM ${coinJournalEntries}
            WHERE ${coinJournalEntries.walletId} = ${userWallet.walletId}
          )`
        )
      );

    console.log(`Found ${usersWithCoinsButNoJournal.length} users with missing journal entries\n`);

    if (usersWithCoinsButNoJournal.length === 0) {
      console.log("✅ No missing journal entries to fix!");
      process.exit(0);
    }

    let fixed = 0;
    let errors = 0;

    for (const user of usersWithCoinsButNoJournal) {
      try {
        console.log(`Fixing ${user.username} (${user.totalCoins} coins)...`);

        await db.transaction(async (tx) => {
          // Create ledger transaction
          const ledgerTxId = randomUUID();
          await tx.insert(coinLedgerTransactions).values({
            id: ledgerTxId,
            type: 'opening_balance',
            initiatorUserId: user.userId,
            context: { migratedFrom: 'users.totalCoins', fixedMissingJournal: true },
            status: 'pending',
          });

          // Get system wallet
          let systemWallet = await tx
            .select()
            .from(userWallet)
            .where(eq(userWallet.userId, 'system'))
            .for('update');

          if (systemWallet.length === 0) {
            console.error('  ❌ System wallet not found!');
            throw new Error('System wallet not found');
          }

          // Credit user
          await tx.insert(coinJournalEntries).values({
            id: randomUUID(),
            ledgerTransactionId: ledgerTxId,
            walletId: user.walletId,
            direction: 'credit',
            amount: user.totalCoins,
            balanceBefore: 0,
            balanceAfter: user.totalCoins,
            memo: 'Opening balance migration from legacy coin system (fixed missing)',
          });

          // Debit system
          const systemBalanceBefore = systemWallet[0].balance;
          await tx.insert(coinJournalEntries).values({
            id: randomUUID(),
            ledgerTransactionId: ledgerTxId,
            walletId: systemWallet[0].walletId,
            direction: 'debit',
            amount: user.totalCoins,
            balanceBefore: systemBalanceBefore,
            balanceAfter: systemBalanceBefore - user.totalCoins,
            memo: 'Opening balance migration offset (fixed missing)',
          });

          // Update wallet balances
          await tx
            .update(userWallet)
            .set({ 
              balance: user.totalCoins,
              availableBalance: user.totalCoins,
              updatedAt: new Date()
            })
            .where(eq(userWallet.walletId, user.walletId));

          await tx
            .update(userWallet)
            .set({ 
              balance: systemBalanceBefore - user.totalCoins,
              availableBalance: systemBalanceBefore - user.totalCoins,
              updatedAt: new Date()
            })
            .where(eq(userWallet.walletId, systemWallet[0].walletId));

          // Close ledger transaction
          await tx
            .update(coinLedgerTransactions)
            .set({ status: 'closed', closedAt: new Date() })
            .where(eq(coinLedgerTransactions.id, ledgerTxId));
        });

        console.log(`  ✅ Fixed`);
        fixed++;
      } catch (error: any) {
        console.error(`  ❌ Error: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   Fixed: ${fixed} users`);
    console.log(`   Errors: ${errors} users`);

    if (errors === 0) {
      console.log("\n✅ All missing journal entries have been fixed!");
      process.exit(0);
    } else {
      console.log("\n⚠️  Some users could not be fixed. Please investigate.");
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n❌ Script failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
