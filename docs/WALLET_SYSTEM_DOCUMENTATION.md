# Wallet System & Dual-Write Requirements

## Overview

The YoForex platform uses a **dual-ledger wallet system** to track user coin balances with full audit trail and integrity guarantees.

## System Components

### 1. Legacy Balance Field
- **Location**: `users.total_coins`
- **Purpose**: Historical compatibility, quick reference
- **Status**: ⚠️ DEPRECATED for new features
- **Migration**: Being phased out in favor of wallet system

### 2. Wallet System (PRIMARY)
- **Table**: `user_wallet`
- **Fields**:
  - `wallet_id`: Unique wallet identifier
  - `user_id`: Foreign key to users table
  - `balance`: Current wallet balance (source of truth)
  - `available_balance`: Balance available for withdrawal/spending
  - `status`: Wallet status (active/frozen/closed)
  - `version`: Optimistic concurrency control

### 3. Ledger System
- **Transaction Table**: `coin_ledger_transactions`
  - Groups related journal entries
  - Tracks transaction type, initiator, context
  - Status: pending → closed
  
- **Journal Table**: `coin_journal_entries`
  - Individual debit/credit entries
  - Tracks balance before/after
  - Immutable audit trail
  - Always balanced (total debits = total credits)

## Architecture Diagram

\`\`\`
┌─────────────────┐
│  users table    │
│  total_coins    │  ← DEPRECATED (legacy compatibility)
└─────────────────┘

┌─────────────────┐
│  user_wallet    │
│  balance        │  ← SOURCE OF TRUTH
│  wallet_id      │
└─────────────────┘
        │
        ├── References
        ▼
┌──────────────────────────┐
│ coin_ledger_transactions │  ← Transaction Header
│  - type                  │
│  - initiator_user_id     │
│  - status                │
└──────────────────────────┘
        │
        ├── Contains
        ▼
┌──────────────────────────┐
│ coin_journal_entries     │  ← Audit Trail
│  - wallet_id             │
│  - direction (dr/cr)     │
│  - amount                │
│  - balance_before        │
│  - balance_after         │
│  - memo                  │
└──────────────────────────┘
\`\`\`

## Critical Rules: Dual-Write System

### ⚠️ MANDATORY: Always Update Both Systems

When creating any coin transaction, you **MUST** update:
1. ✅ `user_wallet.balance` via ledger system
2. ✅ `users.total_coins` for backward compatibility

### Transaction Creation Pattern

\`\`\`typescript
// ❌ WRONG - Only updates users.total_coins
await db.update(users)
  .set({ totalCoins: sql\`\${users.totalCoins} + 100\` })
  .where(eq(users.id, userId));

// ✅ CORRECT - Updates both systems
await storage.beginLedgerTransaction(
  'reward',
  userId,
  [{
    userId: userId,
    direction: 'credit',
    amount: 100,
    memo: 'Daily login reward'
  }, {
    userId: 'system',
    direction: 'debit', 
    amount: 100,
    memo: 'Platform reward payout'
  }]
);

// ALSO update users.total_coins for compatibility
await db.update(users)
  .set({ totalCoins: sql\`\${users.totalCoins} + 100\` })
  .where(eq(users.id, userId));
\`\`\`

## Transaction Creation Points (Dual-Write Required)

### 1. Onboarding Rewards
- **File**: `server/storage.ts` → `trackOnboardingProgress()`
- **Action**: Award coins for profile completion, first post, etc.
- **Status**: ✅ Implemented with dual-write

### 2. Forum Activity
- **Files**: 
  - `server/storage.ts` → `createForumThread()`, `createForumReply()`
  - `server/routes.ts` → Thread/reply creation endpoints
- **Actions**: Coins for posting threads, helpful replies, accepted answers
- **Status**: ⚠️ Needs audit - verify dual-write

### 3. Marketplace Purchases
- **File**: `server/storage.ts` → `purchaseContent()`
- **Actions**: 
  - Debit buyer wallet
  - Credit seller wallet (90%)
  - Credit platform wallet (10% commission)
- **Status**: ✅ Uses ledger system

### 4. Withdrawals
- **File**: `server/routes.ts` → `/api/withdrawals`
- **Actions**: Freeze funds, process withdrawal, update balances
- **Status**: ⚠️ Needs verification

### 5. Manual Admin Actions
- **File**: `server/routes.ts` → Admin endpoints
- **Actions**: Grants, deductions, corrections
- **Status**: ⚠️ Needs dual-write implementation

### 6. Referral Rewards
- **Location**: TBD
- **Actions**: Reward referrer when referred user signs up/purchases
- **Status**: ⚠️ Not yet implemented

### 7. Daily Activity Tracking
- **File**: `server/storage.ts` → `recordActivity()`
- **Actions**: Coins for daily active minutes
- **Status**: ⚠️ Needs audit

## Backfill Process (One-Time Migration)

### Initial State (Before Backfill)
- 196 users with `total_coins` balances
- 0 `user_wallet` records
- 97 `coin_transactions` (legacy system)
- **Result**: 100% balance drift

### Backfill Execution

1. **Create System User**
   \`\`\`sql
   INSERT INTO users (id, username, role, is_bot)
   VALUES ('system', 'system', 'admin', true);
   \`\`\`

2. **Run Backfill Script**
   \`\`\`bash
   tsx scripts/backfill-wallets.ts
   \`\`\`
   - Creates wallet for each user
   - Creates opening balance ledger transactions
   - Credits user wallet
   - Debits system account (offset)

3. **Fix Missing Journal Entries**
   \`\`\`bash
   tsx scripts/fix-missing-journal-entries.ts
   \`\`\`
   - Handles users who had wallets but no journal entries
   - Creates proper opening balance transactions

### Final State (After Backfill)
- ✅ 197 users (196 + system)
- ✅ 197 `user_wallet` records (100% coverage)
- ✅ Opening balance ledger transactions for all users
- ✅ Journal entries match wallet balances
- ⚠️ Minor drift: 4 users (21 coins total) due to ongoing dual-write issues

## Verification & Monitoring

### Run Integrity Check
\`\`\`bash
tsx scripts/verify-wallet-integrity.ts
\`\`\`

**Checks**:
- All users have wallet records
- `wallet.balance` == calculated from journal entries
- `wallet.balance` == `users.total_coins` (for compatibility)
- Treasury balance (all user wallets + system account = 0)

### Expected Results
- ✅ 0 users without wallets
- ✅ Minimal drift (<1% of users, <100 coins total)
- ⚠️ System account balance = -(sum of all user balances)

## Admin Dashboard Display

### Current Implementation
- **Location**: `app/admin/finance/page.tsx`
- **Data Source**: `users.total_coins` (legacy)
- **Status**: ⚠️ Needs migration to wallet system

### Recommended Updates

\`\`\`typescript
// OLD: Query users.total_coins
const totalCoins = await db.select({ sum: sql\`SUM(\${users.totalCoins})\` })
  .from(users);

// NEW: Query user_wallet.balance
const totalBalance = await db.select({ 
  sum: sql\`SUM(\${userWallet.balance})\` 
})
.from(userWallet)
.where(ne(userWallet.userId, 'system')); // Exclude system account

// Add drift warning
const driftCount = await db.select({ count: count() })
  .from(users)
  .innerJoin(userWallet, eq(users.id, userWallet.userId))
  .where(ne(users.totalCoins, userWallet.balance));

if (driftCount.count > 0) {
  // Show warning badge
  console.warn(\`\${driftCount.count} users have balance drift\`);
}
\`\`\`

## Future Improvements

### Phase Out users.total_coins
1. ✅ Backfill complete - all users have wallets
2. ⬜ Update all transaction points to use ledger system
3. ⬜ Add scheduled job to detect/fix drift
4. ⬜ Migration window: Run parallel systems for 30 days
5. ⬜ Remove users.total_coins dependency completely

### Automated Reconciliation
\`\`\`typescript
// Daily cron job
async function reconcileDrift() {
  const driftedUsers = await findDriftedUsers();
  
  for (const user of driftedUsers) {
    const walletBalance = calculateFromJournal(user.walletId);
    const userBalance = user.totalCoins;
    
    if (walletBalance !== userBalance) {
      // Log to audit
      // Create correction transaction
      // Alert admins
    }
  }
}
\`\`\`

### Wallet Features
- [ ] Frozen balance (for pending withdrawals)
- [ ] Multi-currency support
- [ ] Transaction reversals/refunds
- [ ] Scheduled transactions
- [ ] Wallet statements/exports

## Troubleshooting

### User Reports Wrong Balance

1. **Check both systems**:
   \`\`\`sql
   SELECT 
     u.username,
     u.total_coins,
     uw.balance as wallet_balance,
     (SELECT SUM(CASE WHEN cje.direction = 'credit' THEN cje.amount ELSE -cje.amount END)
      FROM coin_journal_entries cje
      WHERE cje.wallet_id = uw.wallet_id) as journal_calculated
   FROM users u
   LEFT JOIN user_wallet uw ON u.id = uw.user_id
   WHERE u.id = '<user_id>';
   \`\`\`

2. **Identify source of truth**: Journal balance is canonical

3. **Fix drift**:
   \`\`\`typescript
   // Update wallet balance from journal
   await reconcileUserWallet(userId);
   
   // Update users.total_coins from wallet
   await db.update(users)
     .set({ totalCoins: walletBalance })
     .where(eq(users.id, userId));
   \`\`\`

### New Transaction Not Reflected

**Checklist**:
- [ ] Used `beginLedgerTransaction()` method?
- [ ] Created balanced entries (debits = credits)?
- [ ] Updated `users.total_coins` separately?
- [ ] Committed transaction successfully?
- [ ] No errors in logs?

### Wallet Creation Failed

**Common Issues**:
1. **No system user**: Create with ID 'system'
2. **Foreign key violation**: User doesn't exist in users table
3. **Duplicate wallet**: User already has wallet (use upsert logic)

## References

- **Backfill Script**: `scripts/backfill-wallets.ts`
- **Verification Script**: `scripts/verify-wallet-integrity.ts`
- **Fix Script**: `scripts/fix-missing-journal-entries.ts`
- **Storage Interface**: `server/storage.ts` (lines 8979-9150)
- **Schema**: `shared/schema.ts` (wallet tables)

## Contact

For questions or issues with the wallet system:
- Check this documentation first
- Run verification script
- Review audit logs in `coin_ledger_transactions`
- Escalate to platform engineering team
