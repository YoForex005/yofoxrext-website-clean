import { db } from "../server/db";
import { users, userWallet, coinJournalEntries } from "../shared/schema";
import { eq, sql, count } from "drizzle-orm";

interface DriftReport {
  userId: string;
  username: string;
  totalCoins: number;
  walletBalance: number | null;
  journalBalance: number;
  drift: number;
}

async function main() {
  console.log("🔍 Starting wallet integrity verification...\n");

  try {
    // 1. Count users and wallets
    const [userCount] = await db.select({ count: count() }).from(users);
    const [walletCount] = await db.select({ count: count() }).from(userWallet);
    
    console.log("📊 Basic Counts:");
    console.log(`   Total users: ${userCount.count}`);
    console.log(`   Total wallets: ${walletCount.count}`);
    console.log(`   Missing wallets: ${userCount.count - walletCount.count}`);
    console.log("");

    // 2. Find users without wallets
    const usersWithoutWallets = await db
      .select({
        id: users.id,
        username: users.username,
        totalCoins: users.totalCoins,
      })
      .from(users)
      .leftJoin(userWallet, eq(users.id, userWallet.userId))
      .where(sql`${userWallet.walletId} IS NULL`);

    if (usersWithoutWallets.length > 0) {
      console.log("❌ CRITICAL: Users without wallet records:");
      usersWithoutWallets.slice(0, 10).forEach((user) => {
        console.log(`   - ${user.username} (${user.id}): ${user.totalCoins} coins`);
      });
      if (usersWithoutWallets.length > 10) {
        console.log(`   ... and ${usersWithoutWallets.length - 10} more`);
      }
      console.log("");
    } else {
      console.log("✅ All users have wallet records\n");
    }

    // 3. Check balance consistency: users.total_coins vs user_wallet.balance
    const balanceDriftData = await db
      .select({
        userId: users.id,
        username: users.username,
        totalCoins: users.totalCoins,
        walletBalance: userWallet.balance,
      })
      .from(users)
      .leftJoin(userWallet, eq(users.id, userWallet.userId));

    const balanceDrift: DriftReport[] = [];
    let totalUserCoins = 0;
    let totalWalletCoins = 0;

    for (const record of balanceDriftData) {
      totalUserCoins += record.totalCoins || 0;
      totalWalletCoins += record.walletBalance || 0;

      const drift = Math.abs((record.totalCoins || 0) - (record.walletBalance || 0));
      
      if (drift > 0 || record.walletBalance === null) {
        // Calculate journal balance
        let journalBalance = 0;
        if (record.walletBalance !== null) {
          const wallet = await db
            .select()
            .from(userWallet)
            .where(eq(userWallet.userId, record.userId))
            .limit(1);

          if (wallet.length > 0) {
            const entries = await db
              .select()
              .from(coinJournalEntries)
              .where(eq(coinJournalEntries.walletId, wallet[0].walletId));

            journalBalance = entries.reduce((sum, entry) => {
              return sum + (entry.direction === 'credit' ? entry.amount : -entry.amount);
            }, 0);
          }
        }

        balanceDrift.push({
          userId: record.userId,
          username: record.username,
          totalCoins: record.totalCoins || 0,
          walletBalance: record.walletBalance,
          journalBalance,
          drift,
        });
      }
    }

    console.log("💰 Treasury Summary:");
    console.log(`   Total coins (users.total_coins): ${totalUserCoins}`);
    console.log(`   Total coins (user_wallet.balance): ${totalWalletCoins}`);
    console.log(`   Treasury drift: ${Math.abs(totalUserCoins - totalWalletCoins)}`);
    console.log("");

    if (balanceDrift.length > 0) {
      console.log(`⚠️  Balance Drift Detected (${balanceDrift.length} users):`);
      
      // Sort by drift amount (highest first)
      balanceDrift.sort((a, b) => b.drift - a.drift);
      
      // Show top 10 drift cases
      balanceDrift.slice(0, 10).forEach((user) => {
        console.log(`   - ${user.username}:`);
        console.log(`     users.total_coins: ${user.totalCoins}`);
        console.log(`     user_wallet.balance: ${user.walletBalance ?? 'NULL'}`);
        console.log(`     journal calculated: ${user.journalBalance}`);
        console.log(`     drift: ${user.drift}`);
      });

      if (balanceDrift.length > 10) {
        console.log(`   ... and ${balanceDrift.length - 10} more with drift`);
      }
      console.log("");

      // Calculate statistics
      const maxDrift = Math.max(...balanceDrift.map((u) => u.drift));
      const avgDrift = balanceDrift.reduce((sum, u) => sum + u.drift, 0) / balanceDrift.length;
      
      console.log("📈 Drift Statistics:");
      console.log(`   Users with drift: ${balanceDrift.length}`);
      console.log(`   Max drift: ${maxDrift} coins`);
      console.log(`   Avg drift: ${avgDrift.toFixed(2)} coins`);
      console.log("");
    } else {
      console.log("✅ All wallet balances match users.total_coins\n");
    }

    // 4. Summary and recommendations
    console.log("📋 Summary:");
    const criticalIssues = usersWithoutWallets.length;
    const warningIssues = balanceDrift.length;

    if (criticalIssues === 0 && warningIssues === 0) {
      console.log("✅ PASS: Wallet system is healthy!");
      console.log("   - All users have wallet records");
      console.log("   - All balances are synchronized");
      process.exit(0);
    } else {
      console.log("❌ FAIL: Wallet system has issues:");
      if (criticalIssues > 0) {
        console.log(`   - ${criticalIssues} users missing wallet records (RUN BACKFILL)`);
      }
      if (warningIssues > 0) {
        console.log(`   - ${warningIssues} users have balance drift (NEEDS RECONCILIATION)`);
      }
      console.log("\n💡 Recommended actions:");
      if (criticalIssues > 0) {
        console.log("   1. Run: tsx scripts/backfill-wallets.ts");
      }
      if (warningIssues > 0) {
        console.log("   2. Investigate balance drift causes");
        console.log("   3. Consider running reconciliation job");
      }
      process.exit(1);
    }
  } catch (error: any) {
    console.error(`\n❌ Verification failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
