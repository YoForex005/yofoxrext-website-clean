# Sweets Economy System - Technical Documentation

## Overview

The YoForex "Sweets" (coins) economy is a virtual currency system that rewards user contributions and enables content marketplace transactions. This document covers the technical implementation, database schema, API endpoints, and integration points.

**Exchange Rate**: 100 coins = $5.50 USD (1 coin = $0.055)

## Table of Contents

1. [Database Schema](#database-schema)
2. [API Endpoints](#api-endpoints)
3. [Earning Opportunities](#earning-opportunities)
4. [Bot Economy Integration](#bot-economy-integration)
5. [Transaction History](#transaction-history)
6. [Wallet Management](#wallet-management)
7. [Withdrawal System](#withdrawal-system)
8. [Code Examples](#code-examples)

---

## Database Schema

### Core Tables

#### `coin_transactions`
Stores all coin transactions (earnings, purchases, withdrawals, refunds).

```typescript
{
  id: varchar PRIMARY KEY (UUID),
  userId: varchar FK -> users.id,
  type: enum('earn', 'spend', 'purchase', 'withdraw', 'refund', 'bonus'),
  amount: integer NOT NULL,
  balance: integer NOT NULL,  // Balance after transaction
  description: text,
  metadata: jsonb,            // Additional context
  relatedId: varchar,         // FK to related entity (threadId, eaId, etc.)
  relatedType: varchar,       // Type of related entity
  isReversed: boolean,
  reversedAt: timestamp,
  reversedBy: varchar FK -> users.id,
  createdAt: timestamp
}
```

**Indexes**:
- `userId` (for user transaction history)
- `type` (for filtering by transaction type)
- `createdAt` (for chronological sorting)
- `relatedId` + `relatedType` (for finding transactions related to specific entities)

#### `users` (relevant coin fields)
```typescript
{
  id: varchar PRIMARY KEY,
  coinBalance: integer DEFAULT 0,  // Current coin balance
  totalEarned: integer DEFAULT 0,  // Lifetime earnings
  totalSpent: integer DEFAULT 0,   // Lifetime spending
  ...
}
```

---

## API Endpoints

### Wallet & Balance

#### `GET /api/coins/balance`
Get current user's coin balance and stats.

**Response**:
```json
{
  "balance": 1250,
  "totalEarned": 5000,
  "totalSpent": 3750,
  "pendingWithdrawals": 0
}
```

#### `GET /api/coins/transactions`
Get user's transaction history.

**Query Parameters**:
- `limit` (default: 50, max: 200)
- `offset` (default: 0)
- `type` (optional filter: 'earn', 'spend', 'purchase', etc.)
- `startDate` (ISO 8601)
- `endDate` (ISO 8601)

**Response**:
```json
{
  "transactions": [
    {
      "id": "uuid",
      "type": "earn",
      "amount": 10,
      "balance": 1250,
      "description": "Thread published",
      "relatedId": "thread-uuid",
      "relatedType": "thread",
      "createdAt": "2025-11-01T20:00:00Z"
    }
  ],
  "total": 245,
  "hasMore": true
}
```

### Earning Opportunities

#### `GET /api/coins/opportunities`
Get available earning opportunities and progress.

**Response**:
```json
{
  "opportunities": [
    {
      "id": "daily_checkin",
      "title": "Daily Check-In",
      "description": "Log in daily to earn coins",
      "reward": 1,
      "frequency": "daily",
      "progress": { "today": true, "streak": 7 },
      "available": false
    },
    {
      "id": "publish_thread",
      "title": "Publish Quality Thread",
      "description": "Share knowledge with the community",
      "reward": 10,
      "frequency": "unlimited",
      "available": true
    }
  ],
  "dailyLimits": {
    "replies": { "limit": 20, "used": 12, "remaining": 8 },
    "reports": { "limit": 5, "used": 2, "remaining": 3 }
  }
}
```

### Purchases

#### `POST /api/coins/purchase`
Purchase content with coins (EA, indicator, article, etc.).

**Request**:
```json
{
  "contentId": "ea-uuid",
  "contentType": "ea",
  "price": 500
}
```

**Response**:
```json
{
  "success": true,
  "transactionId": "uuid",
  "newBalance": 750,
  "purchased": {
    "id": "ea-uuid",
    "title": "Scalping EA Pro",
    "downloadUrl": "/downloads/ea-uuid"
  }
}
```

### Withdrawals

#### `POST /api/coins/withdraw/request`
Request coin withdrawal to cryptocurrency.

**Request**:
```json
{
  "amount": 1000,
  "cryptoType": "USDT",
  "walletAddress": "0x..."
}
```

**Response**:
```json
{
  "success": true,
  "withdrawalId": "uuid",
  "grossAmount": 1000,
  "fee": 50,
  "netAmount": 950,
  "netUSD": 52.25,
  "status": "pending_review",
  "estimatedProcessing": "24-48 hours"
}
```

---

## Earning Opportunities

### 1. Forum Participation

#### Create Thread
- **Endpoint**: `POST /api/threads`
- **Reward**: 10 coins base + bonuses
- **Triggers**: Automatic on successful thread creation
- **Daily Limit**: None
- **Bonuses**:
  - Instrument/pair: +2 coins
  - Timeframe: +2 coins
  - Broker: +1 coin
  - Trading rules: +2 coins
  - Screenshot: +3 coins
  - Related thread links: +2 coins

**Implementation**:
```typescript
async function rewardThreadCreation(userId: string, threadId: string, metadata: any) {
  let reward = EARNING_REWARDS.PUBLISH_THREAD_BASE; // 10
  
  if (metadata.instrument) reward += 2;
  if (metadata.timeframe) reward += 2;
  if (metadata.broker) reward += 1;
  if (metadata.tradingRules) reward += 2;
  if (metadata.screenshots?.length > 0) reward += 3;
  if (metadata.relatedThreads?.length >= 2) reward += 2;
  
  await storage.createCoinTransaction({
    userId,
    type: 'earn',
    amount: reward,
    description: `Thread published with ${reward} coins reward`,
    relatedId: threadId,
    relatedType: 'thread'
  });
}
```

#### Reply to Thread
- **Reward**: 2 coins per reply
- **Daily Limit**: 20 replies (40 coins/day max)
- **Triggers**: Reply creation (must not be spam)

#### Upvote Received
- **Reward**: 1 coin per upvote
- **Daily Limit**: None
- **Triggers**: When another user upvotes your content

#### Accepted Answer
- **Reward**: 15 coins
- **Daily Limit**: None (naturally limited by thread opportunities)
- **Triggers**: Thread author marks reply as accepted answer

### 2. Content Publishing

#### Publish EA/Indicator
- **Reward**: 10 coins upfront + 80% of sales
- **Triggers**: Admin approval of EA/indicator
- **Sales Commission**: 80% seller / 20% platform

**Implementation**:
```typescript
async function handleEAPurchase(eaId: string, buyerId: string, price: number) {
  const ea = await storage.getEAById(eaId);
  const sellerId = ea.authorId;
  
  // Buyer transaction
  await storage.createCoinTransaction({
    userId: buyerId,
    type: 'purchase',
    amount: -price,
    description: `Purchased EA: ${ea.title}`,
    relatedId: eaId,
    relatedType: 'ea'
  });
  
  // Seller transaction (80% commission)
  const sellerAmount = Math.floor(price * 0.80);
  await storage.createCoinTransaction({
    userId: sellerId,
    type: 'earn',
    amount: sellerAmount,
    description: `EA sale: ${ea.title}`,
    relatedId: eaId,
    relatedType: 'ea_sale'
  });
  
  // Platform commission (20%) - tracked but not given to user
  const platformAmount = price - sellerAmount;
  await storage.createPlatformRevenue({
    amount: platformAmount,
    source: 'ea_sale',
    relatedId: eaId
  });
}
```

### 3. Daily Check-In
- **Reward**: 1 coin/day
- **Streak Bonuses**:
  - 7 days: +10 coins
  - 30 days: +50 coins
- **Reset**: Midnight UTC

### 4. Referral Program
- **Signup**: 10 coins when referral signs up
- **First Post**: 10 coins when referral creates first thread
- **Lifetime Commission**: 5% of referral's earnings forever

### 5. Backtest Reports
- **Basic**: 3 coins
- **Detailed**: 4 coins (with spread, slippage settings)
- **Forward Test**: 5 coins (includes forward test comparison)
- **Daily Limit**: 3 reports (max 15 coins/day)

### 6. Moderation Reports
- **Spam Report**: 1 coin (verified)
- **Scam Warning**: 2 coins (verified)
- **Serious Violation**: 3 coins (verified)
- **Daily Limit**: 5 reports (max 15 coins/day)
- **False Report Penalty**: -5 coins

### 7. Competitions
- **Best Thread of Month**: 100-500 coins
- **Top Contributor Awards**: 200-1,000 coins
- **Coding Challenges**: 300-1,500 coins
- **Admin-triggered**: Manual coin grants with description

### 8. Bot-Generated Engagement
- **Follower Acquired** (from bot): +1 coin
- **Like Received** (from bot): +0 coins (bots don't reward for likes)
- **EA Purchase** (from bot): +80% of sale price
- **Auto-Refund**: Bots refund purchases at 3 AM daily

---

## Bot Economy Integration

### Overview
Bots interact with the coin economy to create natural engagement patterns while maintaining economic balance.

### Bot Actions That Grant Coins

#### Bot Follows User
When a bot follows a user (targeted users with <50 followers):
```typescript
// Bot follow triggers coin reward for user
await storage.createCoinTransaction({
  userId: targetUserId,
  type: 'earn',
  amount: 1,
  description: 'New follower',
  relatedId: botId,
  relatedType: 'follower',
  metadata: { source: 'bot' }
});
```

#### Bot Purchases EA
When a bot purchases an EA:
```typescript
// Bot spends from treasury
await treasuryService.deduct(eaPrice);

// Seller receives 80% (normal commission)
const sellerAmount = Math.floor(eaPrice * 0.80);
await storage.createCoinTransaction({
  userId: sellerId,
  type: 'earn',
  amount: sellerAmount,
  description: `EA sale: ${ea.title}`,
  relatedId: eaId,
  relatedType: 'ea_sale',
  metadata: { buyer: 'bot', botId }
});

// Schedule refund for 3 AM
await storage.createBotRefund({
  botId,
  sellerId,
  originalAmount: sellerAmount,
  scheduledFor: getNext3AM()
});
```

### Bot Economy Constraints

#### Wallet Cap Enforcement
Bots won't purchase from users who already have ≥199 coins to prevent economy inflation:
```typescript
async function canBotPurchaseFrom(userId: string): Promise<boolean> {
  const user = await storage.getUser(userId);
  return user.coinBalance < 199;
}
```

#### Daily Spend Limits
Bot treasury has daily spend cap (default: $500 worth of coins):
```typescript
const DAILY_SPEND_LIMIT = 500 / 0.055; // ~9,090 coins
```

#### Auto-Refund System
All bot purchases are automatically refunded at 3 AM daily:
```typescript
// Job runs daily at 3 AM
async function processBotRefunds() {
  const pendingRefunds = await storage.getPendingBotRefunds();
  
  for (const refund of pendingRefunds) {
    // Deduct from seller
    await storage.createCoinTransaction({
      userId: refund.sellerId,
      type: 'refund',
      amount: -refund.originalAmount,
      description: 'Bot purchase refund (automated)',
      relatedId: refund.botActionId,
      relatedType: 'bot_refund'
    });
    
    // Refill treasury
    await treasuryService.refill(refund.originalAmount);
    
    // Mark as processed
    await storage.markRefundProcessed(refund.id);
  }
}
```

---

## Transaction History

### Fetching User Transactions

```typescript
// Get recent transactions
const transactions = await storage.getUserCoinTransactions(userId, {
  limit: 50,
  offset: 0,
  type: 'earn' // Optional filter
});

// Response format
interface CoinTransaction {
  id: string;
  userId: string;
  type: 'earn' | 'spend' | 'purchase' | 'withdraw' | 'refund' | 'bonus';
  amount: number;        // Positive for earn, negative for spend
  balance: number;       // Balance after transaction
  description: string;
  relatedId?: string;
  relatedType?: string;
  metadata?: any;
  createdAt: Date;
}
```

### Transaction Types

| Type | Amount Sign | Description |
|------|-------------|-------------|
| `earn` | Positive | User earned coins (thread, reply, sale, etc.) |
| `spend` | Negative | User spent coins (purchased content) |
| `purchase` | Negative | User purchased content (same as spend but specifically for marketplace) |
| `withdraw` | Negative | User withdrew coins to cryptocurrency |
| `refund` | Variable | Refund for purchase (positive) or reversal (negative) |
| `bonus` | Positive | Admin-granted bonus, competition prize, streak reward |

### Filtering & Pagination

```typescript
interface TransactionFilters {
  limit?: number;        // Max 200
  offset?: number;
  type?: TransactionType;
  startDate?: Date;
  endDate?: Date;
  relatedType?: string;  // Filter by related entity type
}
```

---

## Wallet Management

### Balance Calculation
User's coin balance is stored in `users.coinBalance` and updated atomically with each transaction.

```typescript
async function createCoinTransaction(data: InsertCoinTransaction) {
  // Use database transaction for atomicity
  return await db.transaction(async (tx) => {
    // Get current balance
    const user = await tx.select()
      .from(users)
      .where(eq(users.id, data.userId))
      .forUpdate(); // Lock row for update
    
    const currentBalance = user[0].coinBalance;
    const newBalance = currentBalance + data.amount;
    
    // Prevent negative balance
    if (newBalance < 0) {
      throw new Error('Insufficient coin balance');
    }
    
    // Create transaction record
    const transaction = await tx.insert(coinTransactions)
      .values({
        ...data,
        balance: newBalance
      })
      .returning();
    
    // Update user balance
    await tx.update(users)
      .set({ 
        coinBalance: newBalance,
        totalEarned: data.amount > 0 
          ? sql`${users.totalEarned} + ${data.amount}`
          : users.totalEarned,
        totalSpent: data.amount < 0
          ? sql`${users.totalSpent} + ${Math.abs(data.amount)}`
          : users.totalSpent
      })
      .where(eq(users.id, data.userId));
    
    return transaction[0];
  });
}
```

### Preventing Negative Balances

```typescript
// Always check balance before deduction
async function deductCoins(userId: string, amount: number, description: string) {
  const user = await storage.getUser(userId);
  
  if (user.coinBalance < amount) {
    throw new Error(`Insufficient balance. Required: ${amount}, Available: ${user.coinBalance}`);
  }
  
  return await storage.createCoinTransaction({
    userId,
    type: 'spend',
    amount: -amount,
    description
  });
}
```

---

## Withdrawal System

### Withdrawal Flow

1. **User Request** (`POST /api/coins/withdraw/request`)
   - Minimum: 1,000 coins
   - Fee: 5% of amount
   - Supported: BTC, ETH, USDT
   
2. **Validation**
   - Check minimum amount
   - Check balance
   - Validate wallet address format
   - Check for pending withdrawals
   
3. **Hold Coins**
   - Deduct from user balance
   - Create withdrawal record (status: pending_review)
   
4. **Admin Review** (24-48 hours)
   - Manual verification
   - Anti-fraud checks
   - Approve or reject
   
5. **Processing** (if approved)
   - Send cryptocurrency
   - Update status to completed
   - Provide transaction hash

### Implementation

```typescript
async function requestWithdrawal(
  userId: string,
  amount: number,
  cryptoType: 'BTC' | 'ETH' | 'USDT',
  walletAddress: string
) {
  // Validate minimum
  if (amount < WITHDRAWAL_CONFIG.MIN_AMOUNT) {
    throw new Error(`Minimum withdrawal: ${WITHDRAWAL_CONFIG.MIN_AMOUNT} coins`);
  }
  
  // Calculate fees
  const fee = Math.floor(amount * WITHDRAWAL_CONFIG.FEE_PERCENT);
  const netAmount = amount - fee;
  const netUSD = coinsToUSD(netAmount);
  
  // Check balance
  const user = await storage.getUser(userId);
  if (user.coinBalance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // Deduct from balance (held during review)
  await storage.createCoinTransaction({
    userId,
    type: 'withdraw',
    amount: -amount,
    description: `Withdrawal request (${cryptoType})`,
    metadata: {
      cryptoType,
      walletAddress,
      grossAmount: amount,
      fee,
      netAmount,
      netUSD
    }
  });
  
  // Create withdrawal record
  return await storage.createWithdrawal({
    userId,
    amount,
    fee,
    netAmount,
    cryptoType,
    walletAddress,
    status: 'pending_review'
  });
}
```

### Admin Approval

```typescript
async function approveWithdrawal(withdrawalId: string, adminId: string) {
  const withdrawal = await storage.getWithdrawal(withdrawalId);
  
  // Process cryptocurrency transfer (external service)
  const txHash = await cryptoService.sendTransaction(
    withdrawal.cryptoType,
    withdrawal.walletAddress,
    withdrawal.netUSD
  );
  
  // Update withdrawal status
  await storage.updateWithdrawal(withdrawalId, {
    status: 'completed',
    processedAt: new Date(),
    processedBy: adminId,
    transactionHash: txHash
  });
  
  // Log admin action
  await storage.createAdminAction({
    adminId,
    actionType: 'approve_withdrawal',
    targetType: 'withdrawal',
    targetId: withdrawalId
  });
}
```

---

## Code Examples

### Award Coins for Thread Creation

```typescript
import { storage } from './storage';
import { EARNING_REWARDS } from '@shared/coinUtils';

async function handleThreadCreated(thread: Thread) {
  const reward = EARNING_REWARDS.PUBLISH_THREAD_BASE; // 10 coins
  
  await storage.createCoinTransaction({
    userId: thread.authorId,
    type: 'earn',
    amount: reward,
    description: 'Thread published',
    relatedId: thread.id,
    relatedType: 'thread'
  });
}
```

### Handle Content Purchase

```typescript
async function purchaseEA(buyerId: string, eaId: string) {
  const ea = await storage.getEAById(eaId);
  
  // Check if user already owns
  const alreadyPurchased = await storage.hasUserPurchased(buyerId, eaId);
  if (alreadyPurchased) {
    throw new Error('Already purchased');
  }
  
  // Check balance
  const buyer = await storage.getUser(buyerId);
  if (buyer.coinBalance < ea.price) {
    throw new Error('Insufficient balance');
  }
  
  // Process purchase
  await storage.createCoinTransaction({
    userId: buyerId,
    type: 'purchase',
    amount: -ea.price,
    description: `Purchased: ${ea.title}`,
    relatedId: eaId,
    relatedType: 'ea'
  });
  
  // Award seller (80%)
  const sellerAmount = Math.floor(ea.price * 0.80);
  await storage.createCoinTransaction({
    userId: ea.authorId,
    type: 'earn',
    amount: sellerAmount,
    description: `Sale: ${ea.title}`,
    relatedId: eaId,
    relatedType: 'ea_sale'
  });
  
  // Grant access
  await storage.grantEAAccess(buyerId, eaId);
}
```

### Display User's Transaction History

```typescript
async function getUserTransactionHistory(userId: string, page: number = 1) {
  const limit = 50;
  const offset = (page - 1) * limit;
  
  const transactions = await storage.getUserCoinTransactions(userId, {
    limit,
    offset
  });
  
  return transactions.map(tx => ({
    id: tx.id,
    date: tx.createdAt.toLocaleDateString(),
    type: tx.type,
    amount: tx.amount,
    balance: tx.balance,
    description: tx.description,
    // Format amount with color
    displayAmount: tx.amount > 0 
      ? `+${tx.amount} coins` 
      : `${tx.amount} coins`,
    color: tx.amount > 0 ? 'green' : 'red'
  }));
}
```

### Check Daily Limits

```typescript
async function checkDailyReplyLimit(userId: string): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayReplies = await storage.getUserCoinTransactions(userId, {
    type: 'earn',
    startDate: today,
    relatedType: 'reply'
  });
  
  return todayReplies.length < DAILY_LIMITS.MAX_REPLIES; // 20
}
```

---

## Testing Checklist

- [ ] Coin transactions are atomic (balance updates with transaction record)
- [ ] Negative balances are prevented
- [ ] Daily limits are enforced correctly
- [ ] Bot purchases grant coins to sellers
- [ ] Bot refunds deduct coins at 3 AM
- [ ] Wallet cap (199 coins) prevents bot purchases
- [ ] Commission splits are correct (80/20 for EAs, 75/25 for sets)
- [ ] Withdrawal minimum (1,000 coins) is enforced
- [ ] Withdrawal fee (5%) is calculated correctly
- [ ] Transaction history pagination works
- [ ] Balance display is always accurate
- [ ] Referral commissions are calculated correctly

---

## Future Enhancements

1. **Coin Gifting** - Allow users to send coins to friends
2. **Tip System** - Tip helpful replies directly with coins
3. **Coin Bundles** - Bulk purchase discounts
4. **Dynamic Pricing** - AI-suggested EA pricing based on market demand
5. **Coin Leaderboard** - Top earners each month
6. **Achievement Rewards** - Unlock badges with coin bonuses
7. **Subscription Model** - Monthly subscriptions with coin payouts
8. **Coin Staking** - Earn interest on held coins

---

## Support & Contact

For technical questions about the sweets economy:
- Review this documentation
- Check `/api/coins/opportunities` endpoint for current earning rules
- Test transactions in development environment first
- Contact dev team for schema changes or new earning opportunities

---

**Last Updated**: November 1, 2025
**Version**: 1.0.0
