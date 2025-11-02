# YoForex Sweets Economy Documentation

**Last Updated:** November 2, 2025

## Table of Contents
1. [Overview](#overview)
2. [Earning Mechanisms](#earning-mechanisms)
3. [Spending Options](#spending-options)
4. [Economy Controls](#economy-controls)
5. [Anti-Fraud Measures](#anti-fraud-measures)
6. [Technical Implementation](#technical-implementation)

---

## Overview

**Sweets** are YoForex's virtual currency that rewards user engagement, quality contributions, and community participation. Users earn Sweets through various activities and can spend them on premium features, visibility boosts, and exclusive content.

### Core Principles
- **Engagement-Driven**: Reward quality interactions and contributions
- **Anti-Fraud**: Prevent abuse through velocity checks and multi-account detection
- **Balanced Economy**: Daily and weekly caps prevent inflation
- **Transparent**: All transactions are logged and auditable

---

## Earning Mechanisms

### One-Time Bonuses

#### Welcome Bonus
- **Amount**: 150 Sweets
- **Trigger**: Email verification completion
- **Frequency**: Once per account
- **Implementation**: Automatic grant via `coinTransactions` with `trigger: "welcome_bonus"`
- **Database**: User's `totalCoins` updated atomically

### Daily Activities

#### Login Streak Rewards
Progressive rewards for consecutive daily logins:

| Streak Days | Reward (Sweets) | Frequency |
|------------|----------------|-----------|
| Day 1      | 10             | Daily     |
| Day 3      | 15             | Once      |
| Day 7      | 20             | Once      |
| Day 14     | 30             | Once      |
| Day 30+    | 50             | Daily     |

**Implementation Notes**:
- Tracked via user's `last_login_at` field
- Streaks reset after 48-hour inactivity
- Bonus coins granted at midnight UTC

### Forum Activity

#### Thread Creation
- **Amount**: 15 Sweets
- **Conditions**: 
  - Thread must be at least 50 characters
  - Not flagged as spam
  - Posted in valid category
- **Daily Cap**: 3 threads/day eligible for rewards

#### Thread Replies
- **Amount**: 5 Sweets per reply
- **Conditions**:
  - Reply must be at least 20 characters
  - Not flagged as spam
  - Original content (not copy-paste)
- **Daily Cap**: 10 replies/day eligible for rewards

#### Helpful Votes Received
- **Amount**: 10 Sweets per upvote
- **Conditions**:
  - Received on thread replies
  - From verified users only
  - Max 1 vote per user per reply
- **Daily Cap**: 50 Sweets from votes

#### Trending Thread Bonus
- **Amount**: 100 Sweets
- **Trigger**: Thread reaches 50+ views and 10+ helpful votes within 24 hours
- **Frequency**: Once per thread

### Marketplace Activity

#### Upload EA/Indicator
- **Amount**: 50 Sweets
- **Conditions**:
  - File passes validation
  - Includes description (100+ characters)
  - Categorized properly
- **Daily Cap**: 2 uploads/day eligible for rewards

#### EA Purchased (Seller Reward)
- **Amount**: 20% of sale price in Sweets
- **Example**: 100-coin EA sale = 20 Sweets reward
- **Conditions**:
  - Purchase successfully completed
  - No refund within 7 days
- **Monthly Cap**: 500 Sweets from sales

#### EA Review Written
- **Amount**: 10 Sweets
- **Conditions**:
  - Review at least 50 characters
  - Attached to verified purchase
  - Not flagged as spam
- **Daily Cap**: 3 reviews/day

### Social Engagement

#### Follower Milestones
Progressive rewards for gaining followers:

| Milestone     | Reward (Sweets) | Frequency |
|--------------|----------------|-----------|
| 10 followers  | 50             | Once      |
| 50 followers  | 200            | Once      |
| 100 followers | 500            | Once      |
| 500 followers | 1,500          | Once      |

#### Profile View Milestones
- **100 views**: 30 Sweets
- **500 views**: 100 Sweets
- **1,000 views**: 250 Sweets
- **5,000 views**: 1,000 Sweets

### Referral Program

#### Successful Referral
- **Amount**: 200 Sweets per verified referral
- **Conditions**:
  - Referred user must verify email
  - Referred user must remain active for 7 days
  - Referred user must earn at least 50 Sweets
- **Monthly Cap**: 5 referrals/month eligible (1,000 Sweets max)
- **Anti-Fraud**: Same IP/device detection, rapid signup velocity checks

**Referral Code System**:
- Each user receives unique 8-character alphanumeric code
- Code stored in `users.referralCode`
- Referrer tracked in `users.referredBy`
- Transactions logged in `referrals` table

### Achievement System

Various achievements grant one-time Sweets rewards:

| Achievement | Description | Reward |
|------------|-------------|--------|
| First Post | Create first forum thread | 50 |
| Helpful Helper | Receive 100 helpful votes | 200 |
| Trading Expert | Upload 10 verified EAs | 500 |
| Community Leader | Reach level 10 | 300 |
| Popular Creator | EA downloaded 100 times | 400 |
| Conversation Starter | Create thread with 50+ replies | 150 |

---

## Spending Options

### Forum Features

#### Boost Thread Visibility
- **Cost**: 75 Sweets/day
- **Effect**: Thread appears in "Boosted" section on homepage
- **Duration**: 24 hours
- **Limit**: Max 3 active boosts per user

#### Featured Thread (Premium)
- **Cost**: 300 Sweets
- **Effect**: 
  - Pin thread to top of category
  - Highlighted with special badge
  - Increased visibility in search
- **Duration**: 7 days
- **Limit**: Max 1 featured thread per user at a time

### Marketplace Features

#### Premium EA Download
- **Cost**: 150-500 Sweets (set by seller)
- **Alternative**: Pay with real money or Sweets
- **Benefit**: Access to premium indicators and EAs
- **Refund**: 50% Sweets refund within 24 hours if unsatisfied

### Profile Customization

#### Profile Badges
- **Cost**: 100-300 Sweets per badge
- **Options**:
  - Verified Trader (100 Sweets)
  - Top Contributor (200 Sweets)
  - EA Developer (150 Sweets)
  - Community Expert (250 Sweets)
  - Premium Member (300 Sweets)
- **Duration**: Permanent

#### Custom Profile Theme
- **Cost**: 200 Sweets
- **Options**:
  - Custom color schemes
  - Background patterns
  - Banner customization
- **Duration**: Permanent

#### Profile Banner Upload
- **Cost**: 100 Sweets
- **Benefit**: Upload custom banner image
- **Duration**: Permanent

### Redemption Store

#### Digital Gift Cards
- **Amazon Gift Card**: 
  - $5 = 500 Sweets
  - $10 = 1,000 Sweets
  - $25 = 2,500 Sweets
- **Visa Prepaid**:
  - $10 = 1,200 Sweets
  - $25 = 3,000 Sweets
- **PayPal Credit**:
  - $5 = 550 Sweets
  - $10 = 1,100 Sweets

#### Trading Courses & Resources
- **Beginner Course**: 800 Sweets
- **Advanced Strategies**: 1,500 Sweets
- **Expert Masterclass**: 3,000 Sweets
- **1-on-1 Mentoring Session**: 5,000 Sweets

#### Premium Subscriptions
- **Pro Plan (1 month)**: 1,200 Sweets
- **Pro Plan (3 months)**: 3,000 Sweets
- **Pro Plan (1 year)**: 10,000 Sweets

---

## Economy Controls

### Daily Earning Caps

Earning limits increase with user level to reward engagement:

| User Level | Daily Cap (Sweets) | Weekly Cap (Sweets) |
|-----------|-------------------|-------------------|
| 0-5       | 300               | 1,500             |
| 6-15      | 500               | 2,500             |
| 16-30     | 1,000             | 5,000             |
| 31+       | 1,500             | 7,500             |

**Implementation**:
- Tracked via `users.weeklyEarned` field
- Resets every Sunday at midnight UTC
- Excludes one-time bonuses and achievement rewards
- Admin adjustments bypass caps

### Coin Expiration

**Inactivity-Based Expiration**:
- Coins expire after **180 days of inactivity**
- Inactivity = No earning or spending transactions
- **Warning**: Email sent at 150 days, 170 days, and 175 days
- **Grace Period**: 7 days to redeem before expiration
- **Implementation**: Tracked in `coinExpirations` table

**Exemptions**:
- Purchased coins (real money) never expire
- Achievement rewards expire after 365 days
- Admin-granted coins follow custom rules

### Bot Wallet Segregation

To prevent economic manipulation:

**Bot Accounts**:
- Identified via `users.role = 'bot'`
- Cannot spend Sweets (only earn)
- Earnings tracked in separate `botWallets` table
- Used for engagement and community activity
- Cannot transfer coins to human accounts
- Logged in `botWalletEvents` for transparency

**Bot Detection**:
- Automated behavior patterns
- Admin flagging
- API-based activity patterns

### Admin Controls

#### Manual Adjustments
- **Grant Coins**: Admins can award Sweets for special contributions
- **Deduct Coins**: Penalty for rule violations
- **Freeze Account**: Prevent earning/spending during investigation
- **Tracking**: All adjustments logged in `treasuryAdjustments`

**Reasons for Manual Adjustments**:
- Contest prizes
- Bug compensation
- Fraud penalties
- Special promotions
- Community events

#### Treasury Management
- **Total Supply**: Monitored via `treasurySnapshots`
- **Inflation Rate**: Target 5-10% annual growth
- **Coin Sink**: Redemptions remove coins from economy
- **Coin Source**: New registrations and activities add coins

---

## Anti-Fraud Measures

### Multi-Account Detection

**Detection Methods**:
1. **IP Address Tracking**
   - Same IP creating multiple accounts flagged
   - Shared IPs (VPNs, schools) whitelisted after verification
   - Logged in `fraudSignals` table

2. **Device Fingerprinting**
   - Browser fingerprint tracking
   - Multiple accounts from same device flagged
   - Exemption for family/shared devices after verification

3. **Email Pattern Analysis**
   - Similar email patterns (e.g., user+1@, user+2@)
   - Disposable email detection
   - Domain reputation checking

4. **Behavioral Analysis**
   - Similar posting times
   - Identical content patterns
   - Coordinated voting/liking

**Penalties**:
- **Warning**: First offense, account flagged
- **Coin Freeze**: Suspicious accounts can't spend
- **Account Suspension**: Severe violations (30-90 days)
- **Permanent Ban**: Repeated fraud attempts

### Velocity Checks

**Earning Rate Limits**:
- **Alert Threshold**: 500 Sweets in 1 hour
- **Investigation Threshold**: 1,000 Sweets in 6 hours
- **Auto-Freeze Threshold**: 2,000 Sweets in 24 hours

**Implementation**:
- Real-time transaction monitoring
- Sliding window velocity calculation
- Admin dashboard for review queue
- Automatic notifications to fraud team

**Legitimate High-Earning Scenarios**:
- Contest winnings (whitelisted)
- Admin grants (pre-approved)
- Achievement clusters (verified patterns)

### Referral Abuse Detection

**Red Flags**:
1. **Rapid Signups**: 5+ referrals in 1 hour
2. **Same IP Referrals**: Multiple referrals from identical IP
3. **Inactive Referrals**: Referred users don't engage (7-day check)
4. **Coordinated Activity**: Referred users all act at same time
5. **Referral Farming**: User creates accounts just to refer themselves

**Verification Process**:
- 7-day waiting period for referral rewards
- Email verification required for both parties
- Activity threshold (50 Sweets earned) for referred user
- Manual review for 10+ referrals/month

**Penalties**:
- Referral rewards clawed back if fraud detected
- Referral privileges suspended (30-90 days)
- Account terminated for severe abuse

### Content Quality Controls

**Spam Detection**:
- **Duplicate Content**: Posts flagged if 80%+ identical to previous
- **Low Effort**: Posts <10 words flagged for review
- **Mass Posting**: 10+ posts in 5 minutes triggers alert
- **Link Spam**: External links in first 5 posts flagged

**AI-Assisted Moderation**:
- Content analyzed for quality and relevance
- Auto-flag suspicious patterns
- Human review for edge cases
- Appeals process for false positives

---

## Technical Implementation

### Database Schema

#### Core Tables

**coinTransactions**:
```typescript
{
  id: varchar (UUID)
  userId: varchar (FK to users.id)
  type: "earn" | "spend" | "admin_grant" | "admin_deduct"
  amount: integer
  description: text
  trigger: varchar (e.g., "welcome_bonus", "forum_post", "referral")
  status: "pending" | "completed" | "failed" | "reversed"
  channel: "web" | "mobile" | "api"
  createdAt: timestamp
}
```

**emailVerificationTokens**:
```typescript
{
  id: varchar (UUID)
  userId: varchar (FK to users.id, cascade delete)
  email: varchar
  token: varchar (unique, indexed)
  expiresAt: timestamp
  createdAt: timestamp
}
```

**referrals**:
```typescript
{
  id: varchar (UUID)
  referrerId: varchar (FK to users.id)
  referredUserId: varchar (FK to users.id)
  referralCode: varchar
  status: "pending" | "verified" | "rewarded" | "rejected"
  rewardAmount: integer
  createdAt: timestamp
  verifiedAt: timestamp
}
```

**fraudSignals**:
```typescript
{
  id: varchar (UUID)
  userId: varchar (FK to users.id)
  signalType: "multi_account" | "velocity" | "referral_abuse" | "content_spam"
  severity: "low" | "medium" | "high" | "critical"
  details: jsonb
  status: "open" | "investigating" | "resolved" | "false_positive"
  createdAt: timestamp
}
```

#### User Fields

**users table extensions**:
```typescript
{
  totalCoins: integer (default: 0)
  weeklyEarned: integer (default: 0)
  referralCode: varchar (unique, 8-char alphanumeric)
  referredBy: varchar (referral code of referrer)
  is_email_verified: boolean (default: false)
  auth_provider: "email" | "google" | "both"
}
```

### API Endpoints

#### Registration & Verification
- `POST /api/auth/register` - Create account with email verification
- `GET /api/auth/verify-email?token=XXX` - Verify email & grant welcome bonus
- `POST /api/auth/resend-verification` - Resend verification email
- `POST /api/auth/link-google` - Link Google account to email account

#### Coin Management
- `GET /api/sweets/balance` - Get user's Sweets balance
- `GET /api/sweets/transactions` - Get transaction history
- `POST /api/sweets/earn` - Internal endpoint for earning events
- `POST /api/sweets/spend` - Process spending transaction

#### Referral System
- `GET /api/referrals/my-code` - Get user's referral code
- `GET /api/referrals/stats` - Get referral statistics
- `POST /api/referrals/validate` - Validate referral code

### Cron Jobs

#### Daily Tasks (00:00 UTC)
1. Reset weekly earnings counter (Sundays)
2. Process login streak rewards
3. Check coin expiration warnings (150, 170, 175 days)
4. Update treasury snapshots
5. Aggregate fraud signals

#### Hourly Tasks
1. Process pending referral rewards (7-day check)
2. Velocity check monitoring
3. Bot wallet reconciliation
4. Transaction status cleanup

### Event-Driven Triggers

**On Email Verification**:
```typescript
1. Mark user.is_email_verified = true
2. Create coinTransaction (150 Sweets, trigger: "welcome_bonus")
3. Update user.totalCoins += 150
4. Send welcome email
5. Trigger onboarding checklist
```

**On Forum Post**:
```typescript
1. Check spam filters
2. Check daily cap
3. Create coinTransaction (15 Sweets, trigger: "forum_post")
4. Update user.totalCoins and weeklyEarned
5. Check trending threshold
```

**On Referral Signup**:
```typescript
1. Validate referral code
2. Create referral record (status: "pending")
3. Start 7-day verification period
4. Track referred user activity
5. Award coins if criteria met
```

### Monitoring & Analytics

**Key Metrics**:
- Total Sweets in circulation
- Daily new Sweets issued
- Daily Sweets redeemed/spent
- Fraud signal rate
- Referral conversion rate
- Average user balance
- Coin velocity (transactions/user/day)

**Dashboards**:
- Admin treasury dashboard
- Fraud detection queue
- Referral analytics
- User earning patterns
- Redemption trends

---

## Future Enhancements

### Planned Features
1. **Sweets Staking**: Lock coins for 30/60/90 days for bonus returns
2. **Daily Challenges**: Complete tasks for bonus Sweets
3. **Seasonal Events**: Limited-time earning opportunities
4. **Sweets Leaderboard**: Top earners get monthly bonuses
5. **Charity Donations**: Convert Sweets to real-world donations
6. **Sweets Marketplace**: Trade Sweets for NFTs or digital assets

### Economy Adjustments
- Quarterly review of earning/spending rates
- Inflation monitoring and adjustment
- User feedback integration
- A/B testing for new features

---

## Support & Contact

For questions about the Sweets economy:
- **Email**: support@yoforex.com
- **Forum**: YoForex Community → Economy Discussion
- **Discord**: #sweets-economy channel

For fraud reports:
- **Email**: fraud@yoforex.com
- **Urgent**: Use "Report Fraud" button in user dashboard

---

**Document Version**: 1.0  
**Effective Date**: November 2, 2025  
**Review Cycle**: Quarterly
