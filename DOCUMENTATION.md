# YoForex Platform - Technical Documentation

> **Last Updated:** November 2, 2025  
> **Version:** 1.0  
> **Status:** Production

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Admin Dashboard Features](#2-admin-dashboard-features)
3. [API Endpoints](#3-api-endpoints)
4. [Email System](#4-email-system)
5. [Database Schema](#5-database-schema)
6. [Key Features](#6-key-features)

---

## 1. System Overview

### 1.1 Platform Purpose

YoForex is a comprehensive trading community platform for forex traders featuring:
- **Forums** for discussion and knowledge sharing
- **Expert Advisor (EA) Marketplace** for buying/selling trading tools
- **Broker Reviews** for broker comparison and ratings
- **Virtual Coin Economy ("Sweets")** for rewarding user engagement
- **Bot Engagement System** for natural community growth

**Business Vision:** Become a leading hub for forex traders by fostering engagement, providing essential trading resources, and cultivating a self-sustaining ecosystem.

### 1.2 Technology Stack

#### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 18
- **Styling:** TailwindCSS + shadcn/ui components
- **State Management:** TanStack Query v5 (React Query)
- **Routing:** Next.js App Router + wouter (client-side)
- **Forms:** React Hook Form + Zod validation
- **Rich Text:** TipTap editor
- **Charts:** Recharts
- **Real-time:** Socket.io client

#### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (Neon serverless)
- **ORM:** Drizzle ORM + Drizzle Kit
- **Authentication:** Multi-provider (Email/Password, Google OAuth, Replit Auth)
- **Session Storage:** PostgreSQL (connect-pg-simple)
- **Email Service:** Nodemailer + Hostinger SMTP
- **File Storage:** Replit Object Storage (Google Cloud Storage)
- **AI Integration:** Gemini AI (Google)
- **WebSockets:** Socket.io

#### Infrastructure
- **Deployment:** Replit (Docker containers)
- **Database:** Neon PostgreSQL (serverless)
- **Object Storage:** Replit Object Storage (GCS backend)
- **Email:** Hostinger SMTP
- **CDN:** Google Cloud Storage
- **Build Tools:** esbuild (backend), Vite (frontend)

#### Development Tools
- **Language:** TypeScript
- **Testing:** Vitest + Supertest
- **Validation:** Zod + drizzle-zod
- **Code Quality:** ESLint + Prettier
- **Version Control:** Git

### 1.3 Architecture Pattern

**Hybrid Frontend & Backend API**

```
┌─────────────────────────────────────┐
│         Next.js Frontend            │
│  (App Router, SSR, ISR, SSG)       │
│  - Server Components                │
│  - Client Components                │
│  - API Route Handlers               │
└──────────────┬──────────────────────┘
               │
               │ HTTP/REST API
               ▼
┌─────────────────────────────────────┐
│       Express Backend API           │
│  - RESTful endpoints                │
│  - Authentication middleware        │
│  - Rate limiting                    │
│  - Input validation                 │
│  - WebSocket server                 │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      PostgreSQL Database            │
│  - 80+ tables                       │
│  - Indexes & constraints            │
│  - Connection pooling               │
└─────────────────────────────────────┘
```

**Key Architectural Decisions:**
- **Frontend:** Next.js for SEO optimization, SSR, and dynamic routing
- **Backend:** Express for RESTful API, flexibility, and middleware ecosystem
- **State:** React Query for server state caching and synchronization
- **Database:** PostgreSQL for ACID compliance, complex queries, and reliability
- **Sessions:** PostgreSQL-backed sessions for scalability
- **Files:** Object storage for scalable file uploads

---

## 2. Admin Dashboard Features

### 2.1 Overview (`/admin` and `/admin/overview`)

**Purpose:** Central admin dashboard providing system-wide KPIs and quick access to all admin functions.

**Access Control:** Admin, Superadmin

**Key Features:**
- Real-time KPI cards (users, revenue, content, support tickets)
- Revenue trend chart (daily/weekly/monthly)
- Recent user registrations
- Pending moderation queue
- Active support tickets
- Quick action buttons
- Role-based navigation

**API Endpoints:**
- `GET /api/admin/overview/kpis` - System KPIs
- `GET /api/admin/overview/revenue-trend` - Revenue analytics
- `GET /api/admin/overview/recent-users` - New user registrations
- `GET /api/admin/overview/pending-moderation` - Moderation queue

---

### 2.2 User Management (`/admin/users`)

**Purpose:** Comprehensive user management system for admins to monitor, manage, and moderate users.

**Access Control:** Admin, Superadmin

**Key Features:**
- **User Search:** Real-time search by username, email, ID
- **Advanced Filtering:** Filter by role, status, verification, coins
- **Sorting:** Sort by registration date, last active, coins, reputation
- **Pagination:** Server-side pagination for performance
- **Bulk Actions:** Ban/unban users, export to CSV
- **User Details:** View full user profile, activity, transactions
- **Role Management:** Change user roles (member, moderator, admin)
- **Status Management:** Active, suspended, banned states
- **Ban System:** Temporary or permanent bans with reasons
- **CSV Export:** Export filtered user data

**API Endpoints:**
- `GET /api/admin/users` - Paginated user list with filters
- `GET /api/admin/users/:id` - User details
- `PATCH /api/admin/users/:id/role` - Update user role
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user
- `GET /api/admin/users/export` - Export users to CSV
- `GET /api/admin/users/kpis` - User statistics

**Request/Response Examples:**

```typescript
// GET /api/admin/users?page=1&limit=20&role=member&status=active&sort=createdAt&order=desc
{
  "users": [
    {
      "id": "user123",
      "username": "trader_john",
      "email": "john@example.com",
      "role": "member",
      "status": "active",
      "totalCoins": 1250,
      "reputationScore": 85,
      "createdAt": "2025-10-15T10:30:00Z",
      "lastActive": "2025-11-02T14:22:00Z"
    }
  ],
  "total": 1543,
  "page": 1,
  "limit": 20,
  "totalPages": 78
}

// POST /api/admin/users/:id/ban
{
  "reason": "Spam posting",
  "duration": "permanent", // or "7d", "30d", etc.
  "notifyUser": true
}
```

---

### 2.3 Content Moderation (`/admin/moderation`)

**Purpose:** Review, approve, or reject user-submitted content (EAs, indicators, articles).

**Access Control:** Moderator, Admin, Superadmin

**Key Features:**
- **Moderation Queue:** Pending content awaiting review
- **Tab Navigation:** All, Pending, Approved, Rejected
- **Content Filtering:** Filter by type (EA, indicator, article)
- **Preview System:** View content details before approving
- **Approve Workflow:** One-click approval with email notification
- **Reject Workflow:** Rejection with mandatory reason
- **Audit Logging:** Immutable logs of all moderation actions
- **Moderator Notes:** Add internal notes to content
- **Batch Actions:** Approve/reject multiple items

**API Endpoints:**
- `GET /api/admin/moderation/queue` - Pending content queue
- `GET /api/admin/moderation/content/:id` - Content details
- `POST /api/admin/moderation/content/:id/approve` - Approve content
- `POST /api/admin/moderation/content/:id/reject` - Reject with reason
- `GET /api/admin/moderation/stats` - Moderation statistics
- `GET /api/admin/moderation/audit-logs` - Moderation history

**Request/Response Examples:**

```typescript
// POST /api/admin/moderation/content/:id/approve
{
  "moderatorNotes": "Quality EA, good documentation"
}

// POST /api/admin/moderation/content/:id/reject
{
  "reason": "Insufficient documentation", // REQUIRED
  "notifyAuthor": true
}

// Response includes audit log entry
{
  "success": true,
  "contentId": "content123",
  "newStatus": "approved",
  "auditLogId": "audit456",
  "emailSent": true
}
```

---

### 2.4 Marketplace Management (`/admin/marketplace`)

**Purpose:** Oversee marketplace items, monitor sales, and manage seller payouts.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Revenue Dashboard:** Total revenue, sales count, average price
- **Revenue Trend Chart:** Daily/weekly/monthly revenue visualization
- **Item Management:** View all marketplace items (paid/free)
- **Seller Analytics:** Top sellers, sales leaderboard
- **Pricing Insights:** Price distribution, popular price points
- **Featured Items:** Promote items to featured section
- **Sales Reports:** Export sales data
- **Commission Tracking:** Platform fees and seller earnings

**API Endpoints:**
- `GET /api/admin/marketplace/stats` - Marketplace KPIs
- `GET /api/admin/marketplace/revenue-trend` - Revenue chart data
- `GET /api/admin/marketplace/items` - All marketplace items
- `GET /api/admin/marketplace/top-sellers` - Seller leaderboard
- `PATCH /api/admin/marketplace/items/:id/feature` - Feature item
- `GET /api/admin/marketplace/export` - Export sales CSV

---

### 2.5 Finance Management (`/admin/finance`)

**Purpose:** Comprehensive financial oversight including revenue, payouts, and withdrawals.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Financial KPIs:** Total revenue, pending payouts, completed withdrawals
- **Revenue Breakdown:** By source (marketplace, recharges, subscriptions)
- **Withdrawal Management:** Approve/reject withdrawal requests
- **Payout Processing:** Track payout status and history
- **Transaction Logs:** Comprehensive transaction history
- **Financial Reports:** CSV export for accounting
- **Revenue Trends:** Time-series revenue analytics
- **Payment Method Stats:** Breakdown by crypto, PayPal, bank

**API Endpoints:**
- `GET /api/admin/finance/stats` - Financial overview
- `GET /api/admin/finance/revenue-trend` - Revenue time-series
- `GET /api/admin/finance/revenue-sources` - Revenue breakdown
- `GET /api/admin/finance/withdrawals/pending` - Pending withdrawals
- `POST /api/admin/finance/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/admin/finance/withdrawals/:id/reject` - Reject withdrawal
- `GET /api/admin/finance/export` - Export financial data

**Withdrawal Approval Workflow:**

```typescript
// POST /api/admin/finance/withdrawals/:id/approve
{
  "adminNotes": "Verified wallet address",
  "processingFee": 50, // coins
  "estimatedCompletionDate": "2025-11-05"
}

// POST /api/admin/finance/withdrawals/:id/reject
{
  "rejectionReason": "Invalid wallet address", // REQUIRED
  "notifyUser": true
}
```

---

### 2.6 Communications (`/admin/communications`)

**Purpose:** Manage announcements, email campaigns, and user communications.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Announcement System:** Create site-wide announcements
- **Email Campaigns:** Send targeted email campaigns
- **Audience Targeting:** Filter by role, activity, segments
- **Scheduling:** Schedule announcements and emails
- **Draft Management:** Save drafts before publishing
- **Expiration Control:** Set announcement expiration dates
- **Analytics:** Track email opens, clicks, unsubscribes
- **Templates:** Pre-built email templates
- **A/B Testing:** Test email subject lines and content

**API Endpoints:**
- `GET /api/admin/communications/announcements` - All announcements
- `POST /api/admin/communications/announcements` - Create announcement
- `PUT /api/admin/communications/announcements/:id` - Update announcement
- `DELETE /api/admin/communications/announcements/:id` - Delete
- `POST /api/admin/communications/announcements/:id/publish` - Publish
- `POST /api/admin/communications/announcements/:id/expire` - Expire
- `GET /api/admin/communications/campaigns` - Email campaigns
- `POST /api/admin/communications/campaigns` - Create campaign
- `GET /api/admin/communications/audience-preview` - Preview audience size

**Announcement Schema:**

```typescript
{
  "title": "Platform Maintenance Notice",
  "message": "Scheduled maintenance on Nov 5th...",
  "type": "info", // info, warning, error, success
  "priority": "high", // low, medium, high
  "targetAudience": "all", // all, members, premium, admins
  "scheduledFor": "2025-11-05T00:00:00Z",
  "expiresAt": "2025-11-06T00:00:00Z",
  "isDismissible": true,
  "showOnPages": ["all"], // all, home, marketplace, forum
  "icon": "🔧"
}
```

---

### 2.7 Analytics Dashboard (`/admin/analytics`)

**Purpose:** Comprehensive platform analytics and insights.

**Access Control:** Admin, Superadmin

**Key Features:**
- **User Analytics:** Growth, retention, churn, engagement
- **Content Analytics:** Views, downloads, likes, trending
- **Revenue Analytics:** Sales, revenue, conversion rates
- **Forum Analytics:** Thread activity, reply rates, popular topics
- **Traffic Analytics:** Page views, unique visitors, bounce rate
- **Bot Analytics:** Bot performance, engagement metrics
- **Real-time Dashboard:** Live user count, active sessions
- **Custom Reports:** Build custom analytics reports
- **Export Capabilities:** CSV, PDF reports

**API Endpoints:**
- `GET /api/admin/analytics/users` - User metrics
- `GET /api/admin/analytics/content` - Content metrics
- `GET /api/admin/analytics/revenue` - Revenue metrics
- `GET /api/admin/analytics/forum` - Forum metrics
- `GET /api/admin/analytics/traffic` - Traffic metrics
- `GET /api/admin/analytics/bots` - Bot metrics
- `GET /api/admin/analytics/realtime` - Real-time stats

**Analytics Data Bot Dashboard:**
- **Location:** `/admin/analytics/bots`
- **Purpose:** Monitor bot engagement and performance
- **Metrics:** Bot activity, engagement rate, coin spending, content generated

---

### 2.8 Support Tickets (`/admin/support`)

**Purpose:** Enterprise-grade customer support and ticket management system.

**Access Control:** Admin, Moderator, Superadmin

**Key Features:**
- **Ticket Queue:** All support tickets with status filtering
- **Priority Management:** Low, medium, high, urgent priorities
- **Status Workflow:** New → In Progress → Resolved → Closed
- **Assignment System:** Assign tickets to specific admins
- **Internal Notes:** Add admin-only notes to tickets
- **Ticket History:** Full conversation history
- **SLA Tracking:** Response time and resolution time tracking
- **Satisfaction Surveys:** Post-resolution user feedback
- **Ticket Search:** Search by user, subject, status
- **Bulk Actions:** Close, assign, prioritize multiple tickets

**API Endpoints:**
- `GET /api/admin/support/tickets` - All tickets (paginated)
- `GET /api/admin/support/tickets/:id` - Ticket details
- `PUT /api/admin/support/tickets/:id/status` - Update status
- `PUT /api/admin/support/tickets/:id/priority` - Update priority
- `POST /api/admin/support/tickets/:id/messages` - Add admin reply
- `GET /api/admin/support/kpis` - Support statistics
- `GET /api/admin/support/stats` - Detailed analytics

**Support Ticket Schema:**

```typescript
{
  "id": "ticket123",
  "userId": "user456",
  "subject": "Cannot download purchased EA",
  "category": "technical", // technical, billing, account, other
  "priority": "medium", // low, medium, high, urgent
  "status": "in_progress", // new, in_progress, resolved, closed
  "assignedTo": "admin789",
  "createdAt": "2025-11-01T10:00:00Z",
  "updatedAt": "2025-11-02T09:30:00Z",
  "resolvedAt": null,
  "satisfaction": null, // 1-5 rating after resolution
  "messages": [
    {
      "id": "msg1",
      "senderId": "user456",
      "senderType": "user",
      "message": "I purchased an EA but cannot download it",
      "createdAt": "2025-11-01T10:00:00Z"
    },
    {
      "id": "msg2",
      "senderId": "admin789",
      "senderType": "admin",
      "message": "I'll look into this for you right away.",
      "createdAt": "2025-11-01T10:15:00Z"
    }
  ]
}
```

---

### 2.9 Bot Management (`/admin/bots`)

**Purpose:** Manage AI-powered engagement bots for natural community growth.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Bot Creation:** Create new bots with custom profiles
- **Bot Profiles:** Human-like names, avatars, bio, trading style
- **Behavior Configuration:** Reply frequency, engagement patterns
- **Activity Scheduling:** Set bot activity hours and patterns
- **Budget Management:** Allocate coin budgets to bots
- **Action Logging:** Track all bot actions (likes, replies, follows)
- **Refund System:** Refund coins from bot actions
- **Audit Trail:** Comprehensive audit logs for compliance
- **Bot Analytics:** Performance metrics per bot
- **Enable/Disable:** Activate or deactivate bots

**API Endpoints:**
- `GET /api/admin/bots` - All bots
- `POST /api/admin/bots` - Create bot
- `GET /api/admin/bots/:id` - Bot details
- `PUT /api/admin/bots/:id` - Update bot
- `DELETE /api/admin/bots/:id` - Delete bot
- `GET /api/admin/bots/:id/actions` - Bot action history
- `POST /api/admin/bots/:id/refund` - Refund bot action
- `GET /api/admin/bots/audit-logs` - Bot audit trail
- `POST /api/admin/bots/:id/run` - Manually trigger bot

**Bot Schema:**

```typescript
{
  "id": "bot123",
  "username": "ScalpPro123",
  "firstName": "Alex", // Human name for emails
  "lastName": "Thompson",
  "email": "bot_scalppro123@yoforex.net",
  "profileImageUrl": "https://...",
  "bio": "Scalping enthusiast with 5 years experience...",
  "tradingStyle": "scalper", // scalper, swing, day_trader
  "isActive": true,
  "coinBudget": 10000,
  "coinsSpent": 2450,
  "actionsPerDay": 15,
  "replyFrequency": 0.7, // 70% chance to reply
  "likeFrequency": 0.9, // 90% chance to like
  "followFrequency": 0.3, // 30% chance to follow
  "activityHours": [9, 10, 11, 14, 15, 16, 20, 21], // UTC hours
  "createdAt": "2025-10-01T00:00:00Z"
}
```

**Recent Bot Enhancement (Nov 2, 2025):**
- Bots now use realistic human names (firstName + lastName) in all email notifications
- Email subjects show "Alex Thompson" instead of "ScalpPro123"
- Bots remain fully visible in admin panel for management
- Bot names synchronized between `bots` and `users` tables

---

### 2.10 Economy Controls (`/admin/economy`)

**Purpose:** Manage the Sweets coin economy, treasury, and fraud detection.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Treasury Management:** View and manage platform coin treasury
- **Balance Monitoring:** Total coins issued, circulating, in treasury
- **Treasury Refills:** Add coins to treasury when needed
- **Fraud Detection:** View and manage fraud signals
- **User Wallet Caps:** Set maximum wallet limits per user
- **Coin Expiration:** Manage coin expiration policies
- **Transaction Monitoring:** Real-time coin transaction tracking
- **Economy Settings:** Configure earning rates, limits, fees
- **Reconciliation:** Balance checks and ledger reconciliation
- **Audit Trail:** Complete economy audit logs

**API Endpoints:**
- `GET /api/admin/economy/treasury` - Treasury balance and stats
- `POST /api/admin/economy/treasury/refill` - Add coins to treasury
- `GET /api/admin/economy/settings` - Current economy settings
- `PUT /api/admin/economy/settings` - Update economy settings
- `GET /api/admin/economy/fraud-signals` - Fraud detection alerts
- `GET /api/admin/economy/user-wallet-cap/:userId` - User wallet limit
- `POST /api/admin/economy/drain-wallet` - Admin drain user wallet
- `GET /api/admin/economy/audit-logs` - Economy audit trail
- `GET /api/admin/economy/stats` - Economy statistics

**Economy Settings:**

```typescript
{
  "earningRates": {
    "firstReply": 5,
    "firstThread": 10,
    "firstPublish": 30,
    "profilePicture": 10,
    "twoReviews": 6,
    "fiftyFollowers": 200,
    "dailyJournal": 2
  },
  "dailyLimits": {
    "replies": 10,
    "threads": 3,
    "reviews": 5,
    "journals": 1
  },
  "walletCaps": {
    "default": 100000,
    "verified": 500000,
    "premium": 1000000
  },
  "coinExpiration": {
    "enabled": true,
    "daysUntilExpiry": 365
  },
  "platformFees": {
    "marketplaceSale": 0.20, // 20% commission
    "withdrawal": 50, // 50 coins flat fee
    "refund": 0.05 // 5% restocking fee
  }
}
```

---

### 2.11 Security Monitoring (`/admin/security`)

**Purpose:** Enterprise-grade security monitoring and IP ban management.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Security Dashboard:** Failed logins, suspicious activity, IP bans
- **IP Ban Management:** Temporary or permanent IP bans
- **Auto-blocking:** Automatic IP ban after 5 failed logins in 15 minutes
- **Severity Escalation:** Track repeated offenses
- **Security Events:** Login attempts, password changes, 2FA events
- **Threat Detection:** Brute force detection, rate limit violations
- **Unban Capability:** Remove IP bans manually
- **Security Logs:** Comprehensive security event logs
- **Geo-blocking:** Block IPs from specific countries (future)
- **Rate Limit Config:** Configure rate limits per endpoint

**API Endpoints:**
- `GET /api/admin/security/events` - Security events log
- `GET /api/admin/security/ip-bans` - All IP bans
- `POST /api/admin/security/ip-bans` - Create IP ban
- `DELETE /api/admin/security/ip-bans/:id` - Remove IP ban
- `GET /api/admin/security/failed-logins` - Failed login attempts
- `GET /api/admin/security/stats` - Security statistics

**IP Ban Schema:**

```typescript
{
  "ipAddress": "192.168.1.100",
  "reason": "Brute force login attempt",
  "bannedBy": "admin123",
  "bannedAt": "2025-11-02T10:00:00Z",
  "expiresAt": "2025-11-09T10:00:00Z", // null for permanent
  "severity": "high", // low, medium, high, critical
  "autoBlocked": true,
  "attempts": 12
}
```

---

### 2.12 Email Management (`/admin/emails`)

**Purpose:** Monitor and manage the email notification system.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Email Queue:** View queued, sent, failed emails
- **Delivery Tracking:** Open rates, click rates, bounce rates
- **Template Management:** View and edit email templates
- **Unsubscribe Management:** Handle unsubscribe requests
- **Bounce Handling:** Auto-unsubscribe on hard bounces
- **Email Analytics:** Engagement metrics per template
- **Resend Failed:** Retry failed email deliveries
- **Smart Scheduling:** Optimize send times per user timezone
- **Email Preferences:** Manage user notification preferences
- **Blacklist Management:** Email blacklist for spam prevention

**API Endpoints:**
- `GET /api/admin/emails/queue` - Email queue status
- `GET /api/admin/emails/sent` - Sent email history
- `GET /api/admin/emails/failed` - Failed emails
- `GET /api/admin/emails/analytics` - Email performance metrics
- `GET /api/admin/emails/templates` - Email template list
- `GET /api/admin/emails/bounces` - Bounce reports
- `POST /api/admin/emails/:id/resend` - Resend failed email

---

### 2.13 Error Monitoring (`/admin/errors`)

**Purpose:** Comprehensive error tracking and resolution system.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Error Dashboard:** Unsolved, solved, to-be-solved errors
- **Smart Grouping:** Group similar errors by message and stack trace
- **Error Severity:** Info, warning, error, critical levels
- **Source Tracking:** Frontend vs backend error categorization
- **Stack Traces:** Full stack traces for debugging
- **Error Count:** Track error frequency and patterns
- **Status Management:** Mark errors as solved or to-be-solved
- **User Impact:** See which users are affected
- **Error Resolution:** Add resolution notes
- **Auto-retry:** Automatic retry for transient errors

**API Endpoints:**
- `GET /api/admin/errors/groups` - Error groups (categorized)
- `GET /api/admin/errors/events` - Individual error events
- `GET /api/admin/errors/:id` - Error details
- `PUT /api/admin/errors/:id/status` - Update error status
- `POST /api/admin/errors/:id/resolve` - Mark as resolved
- `GET /api/admin/errors/stats` - Error statistics

**Error Event Schema:**

```typescript
{
  "id": "error123",
  "groupId": "group456",
  "message": "Failed to load user profile",
  "stack": "Error: Failed to load...\n  at UserProfile.tsx:45",
  "severity": "error", // info, warning, error, critical
  "source": "frontend", // frontend, backend
  "url": "/users/profile",
  "userId": "user789",
  "userAgent": "Mozilla/5.0...",
  "metadata": {
    "component": "UserProfile",
    "action": "fetchProfile"
  },
  "status": "unsolved", // unsolved, to_be_solved, solved
  "occurredAt": "2025-11-02T14:30:00Z"
}
```

---

### 2.14 Audit Logs (`/admin/audit`)

**Purpose:** Immutable audit trail of all administrative actions.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Comprehensive Logging:** All admin actions logged
- **Actor Tracking:** Who performed each action
- **Timestamp Precision:** Exact time of each action
- **Action Details:** Full context of what changed
- **Resource Tracking:** What was modified (user, content, etc.)
- **Filtering:** Filter by actor, action type, date range
- **Export:** Export audit logs for compliance
- **Immutable Records:** Cannot be edited or deleted
- **Retention Policy:** Configurable log retention

**API Endpoints:**
- `GET /api/admin/audit/logs` - Paginated audit logs
- `GET /api/admin/audit/logs/:id` - Specific audit log
- `GET /api/admin/audit/export` - Export audit logs

**Audit Log Schema:**

```typescript
{
  "id": "audit123",
  "actorId": "admin456",
  "actorRole": "admin",
  "action": "user_banned", // user_banned, content_approved, etc.
  "resourceType": "user",
  "resourceId": "user789",
  "previousState": {
    "status": "active"
  },
  "newState": {
    "status": "banned",
    "bannedAt": "2025-11-02T15:00:00Z",
    "banReason": "Spam posting"
  },
  "metadata": {
    "ipAddress": "192.168.1.1",
    "userAgent": "Mozilla/5.0..."
  },
  "createdAt": "2025-11-02T15:00:00Z"
}
```

---

### 2.15 Page Controls (`/admin/page-controls`)

**Purpose:** Control page availability and maintenance mode.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Page Status:** ON, OFF, Coming Soon, Maintenance
- **Global Controls:** Enable/disable entire sections
- **Maintenance Mode:** Display maintenance pages
- **Coming Soon Pages:** Show "Coming Soon" for unreleased features
- **Scheduled Downtime:** Schedule maintenance windows
- **Custom Messages:** Custom messages for each page state
- **SEO Handling:** Proper HTTP status codes (503, 404)
- **Middleware Integration:** Next.js middleware for page control

**API Endpoints:**
- `GET /api/admin/page-controls` - All page controls
- `GET /api/admin/page-controls/:page` - Specific page status
- `PUT /api/admin/page-controls/:page` - Update page status

**Page Control Schema:**

```typescript
{
  "page": "/marketplace",
  "status": "maintenance", // on, off, coming_soon, maintenance
  "customMessage": "Marketplace is undergoing maintenance. Back soon!",
  "scheduledStart": "2025-11-05T00:00:00Z",
  "scheduledEnd": "2025-11-05T04:00:00Z",
  "showCountdown": true,
  "allowAdminAccess": true
}
```

---

### 2.16 SEO Marketing (`/admin/sections/SEOMarketing.tsx`)

**Purpose:** AI-powered SEO optimization tools.

**Access Control:** Admin, Superadmin

**Key Features:**
- **AI Meta Generation:** Gemini AI generates SEO-optimized metadata
- **Bulk SEO Fixes:** Apply SEO improvements to multiple pages
- **SEO Scanning:** Identify SEO issues across the platform
- **Meta Description:** Auto-generate compelling meta descriptions
- **Image Alt Text:** AI-generated alt text for images
- **H1 Tag Optimization:** Suggest optimized H1 tags
- **Keyword Analysis:** Identify focus keywords
- **SEO Score:** Calculate SEO score per page
- **Sitemap Management:** Generate and submit sitemaps

**API Endpoints:**
- `POST /api/admin/seo/generate-meta` - Generate meta description
- `POST /api/admin/seo/scan` - Run SEO scan
- `GET /api/admin/seo/issues` - List SEO issues
- `POST /api/admin/seo/fix/:id` - Apply SEO fix
- `POST /api/admin/seo/sitemap/generate` - Generate sitemap

---

### 2.17 Feature Flags (`/admin/page-controls` or dedicated section)

**Purpose:** Enterprise-grade feature flag system for controlled rollouts.

**Access Control:** Admin, Superadmin

**Key Features:**
- **Feature Toggles:** Enable/disable features without deployment
- **Tri-State Status:** ON, OFF, Coming Soon
- **Percentage Rollouts:** Gradual feature rollouts (10%, 50%, 100%)
- **User Targeting:** Enable for specific users or groups
- **A/B Testing:** Test features with different user segments
- **Environment Specific:** Different flags per environment
- **In-Memory Caching:** Fast feature flag checks
- **Audit Trail:** Track feature flag changes

**API Endpoints:**
- `GET /api/feature-flags` - All feature flags
- `GET /api/feature-flags/:key` - Specific flag status
- `PUT /api/feature-flags/:key` - Update flag
- `POST /api/feature-flags` - Create new flag

---

### 2.18 Admin Dashboard Sections (Component-based)

The following admin sections are available as components in `/app/admin/sections/`:

1. **Overview** - System KPIs and quick stats
2. **Analytics** - User, content, revenue analytics
3. **Users** - User management and moderation
4. **Content** - Content moderation queue
5. **ContentStudio** - Content creation tools
6. **Marketplace** - Marketplace oversight
7. **Brokers** - Broker directory management
8. **Finance** - Financial management
9. **Communications** - Announcements and campaigns
10. **Support** - Support ticket system
11. **Gamification** - Badges, achievements, XP
12. **Security** - Security monitoring
13. **ErrorMonitoring** - Error tracking
14. **SEOMarketing** - SEO tools
15. **SeoMonitoring** - SEO performance tracking
16. **SitemapManagement** - Sitemap generation
17. **Performance** - System performance metrics
18. **SchemaValidation** - Database schema validation
19. **FeatureFlags** - Feature flag management
20. **Logs** - System logs
21. **Integrations** - Third-party integrations
22. **Testing** - Testing tools
23. **Settings** - System settings
24. **AIAutomation** - AI automation tools
25. **Mobile** - Mobile app management

---

## 3. API Endpoints

### 3.1 Authentication (`/api/auth/*`)

**Purpose:** User authentication and session management.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/auth/register` | No | Email/password registration |
| POST | `/api/auth/login` | No | Email/password login |
| POST | `/api/auth/logout` | No | Clear session |
| POST | `/api/auth/google` | No | Google OAuth authentication |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password with token |
| POST | `/api/auth/verify-email` | No | Verify email address |
| POST | `/api/auth/resend-verification` | Yes | Resend verification email |

**Example: Registration**

```typescript
// POST /api/auth/register
{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "username": "trader_john"
}

// Response
{
  "message": "Registration successful",
  "user": {
    "id": "user123",
    "email": "john@example.com",
    "username": "trader_john",
    "role": "member"
  }
}
```

**Example: Login**

```typescript
// POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

// Response
{
  "message": "Login successful",
  "user": {
    "id": "user123",
    "email": "john@example.com",
    "username": "trader_john",
    "role": "member"
  }
}
```

---

### 3.2 Health Checks (`/api/health/*`)

**Purpose:** System health monitoring.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/health` | No | Overall system health |
| GET | `/api/health/live` | No | Liveness probe (K8s) |
| GET | `/api/health/ready` | No | Readiness probe (DB, services) |

---

### 3.3 File Uploads (`/api/upload`, `/api/objects/*`)

**Purpose:** File upload and object storage management.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/upload` | Yes | Multi-file upload (legacy) |
| POST | `/api/objects/upload` | Yes | Object storage upload |
| GET | `/api/objects/:id` | Conditional | Get object by ID |
| DELETE | `/api/objects/:id` | Yes | Delete object |
| PUT | `/api/content/files` | Yes | Update content files |

**Supported File Types:**
- Images: `.jpg`, `.jpeg`, `.png`, `.webp` (max 5MB)
- EA Files: `.ex4`, `.ex5`, `.mq4`, `.zip` (max 10MB)
- Documents: `.pdf`, `.set`, `.csv` (max 5MB)

**Max Upload Size:** 20MB per file, 1 file per request

---

### 3.4 User Management (`/api/user/*`, `/api/users/*`)

**Purpose:** User profile and account management.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/me` | Yes | Get current user |
| GET | `/api/user/:userId` | Yes | Get user by ID |
| GET | `/api/users/username/:username` | No | Get user by username |
| PATCH | `/api/user/profile` | Yes | Update profile |
| PATCH | `/api/user/notifications` | Yes | Update notification preferences |
| GET | `/api/user/:userId/coins` | Yes | Get user coin balance |
| GET | `/api/user/:userId/transactions` | Yes | Get user coin transactions |
| GET | `/api/users/:userId/badges` | No | Get user badges |
| GET | `/api/users/:userId/stats` | No | Get user statistics |
| POST | `/api/user/follow/:userId` | Yes | Follow user |
| DELETE | `/api/user/follow/:userId` | Yes | Unfollow user |
| GET | `/api/user/:userId/followers` | No | Get user followers |
| GET | `/api/user/:userId/following` | No | Get users being followed |

---

### 3.5 Forum & Threads (`/api/threads/*`, `/api/replies/*`)

**Purpose:** Forum thread management and discussions.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/threads` | No | Get all threads (paginated) |
| GET | `/api/threads/:id` | No | Get thread by ID |
| GET | `/api/threads/slug/:slug` | No | Get thread by slug |
| POST | `/api/threads` | Yes | Create new thread |
| PUT | `/api/threads/:id` | Yes | Update thread (author only) |
| DELETE | `/api/threads/:id` | Yes | Delete thread (author/admin) |
| POST | `/api/threads/:id/like` | Yes | Like thread |
| DELETE | `/api/threads/:id/like` | Yes | Unlike thread |
| GET | `/api/threads/:id/replies` | No | Get thread replies |
| POST | `/api/threads/:id/replies` | Yes | Create reply |
| PUT | `/api/replies/:id` | Yes | Update reply (author only) |
| DELETE | `/api/replies/:id` | Yes | Delete reply (author/admin) |
| POST | `/api/replies/:id/like` | Yes | Like reply |
| DELETE | `/api/replies/:id/like` | Yes | Unlike reply |

**Thread Schema:**

```typescript
{
  "title": "Best scalping strategy for EURUSD?",
  "body": "I've been testing different scalping strategies...",
  "category": "strategies",
  "subcategory": "scalping",
  "tags": ["scalping", "eurusd", "m5"],
  "isPinned": false,
  "isLocked": false,
  "status": "approved" // pending, approved, rejected
}
```

---

### 3.6 Content & Marketplace (`/api/content/*`)

**Purpose:** EA/Indicator marketplace and content management.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/content` | No | Get all content (paginated, filtered) |
| GET | `/api/content/:id` | No | Get content by ID |
| GET | `/api/content/slug/:slug` | No | Get content by slug |
| POST | `/api/content` | Yes | Create new content (draft) |
| PUT | `/api/content/:id` | Yes | Update content (author only) |
| POST | `/api/content/:id/publish` | Yes | Submit for review |
| DELETE | `/api/content/:id` | Yes | Delete content (author/admin) |
| POST | `/api/content/:id/purchase` | Yes | Purchase content |
| GET | `/api/content/:id/download` | Yes | Download purchased content |
| POST | `/api/content/:id/review` | Yes | Submit review |
| GET | `/api/content/:id/reviews` | No | Get content reviews |
| POST | `/api/content/:id/like` | Yes | Like content |
| DELETE | `/api/content/:id/like` | Yes | Unlike content |
| GET | `/api/hot` | No | Get hot/trending content |
| GET | `/api/trending` | No | Get trending content |
| GET | `/api/featured` | No | Get featured content |

**Content Creation Flow:**

```typescript
// 1. Create draft
POST /api/content
{
  "type": "ea",
  "title": "Smart Scalper Pro",
  "description": "Advanced scalping EA for EURUSD...",
  "category": "expert_advisors",
  "platform": "MT5",
  "priceCoins": 5000,
  "isFree": false
}

// 2. Upload files
POST /api/objects/upload
FormData: { file: ea_file.ex5 }

// 3. Publish for review
POST /api/content/:id/publish
{
  "status": "pending"
}

// 4. Admin approves
POST /api/admin/moderation/content/:id/approve

// 5. Content live on marketplace
```

---

### 3.7 Messaging (`/api/messages/*`)

**Purpose:** Private messaging system (1-on-1 and group chats).

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/messages/conversations` | Yes | Get user conversations |
| GET | `/api/messages/conversations/:id` | Yes | Get conversation details |
| POST | `/api/messages/conversations` | Yes | Create new conversation |
| GET | `/api/messages/conversations/:id/messages` | Yes | Get messages in conversation |
| POST | `/api/messages/conversations/:id/messages` | Yes | Send message |
| POST | `/api/messages/:id/react` | Yes | React to message |
| PUT | `/api/messages/:id/read` | Yes | Mark message as read |
| DELETE | `/api/messages/:id` | Yes | Delete message |
| POST | `/api/messages/search` | Yes | Search messages |

**Message Schema:**

```typescript
{
  "conversationId": "conv123",
  "senderId": "user456",
  "body": "Hey, did you see my new EA?",
  "attachments": [
    {
      "id": "file789",
      "name": "screenshot.png",
      "url": "https://...",
      "type": "image/png",
      "size": 245678
    }
  ],
  "reactions": [
    {
      "userId": "user789",
      "emoji": "👍"
    }
  ],
  "readBy": ["user456", "user789"],
  "sentAt": "2025-11-02T10:30:00Z"
}
```

---

### 3.8 Support Tickets (`/api/support/*`)

**Purpose:** Customer support ticket system.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/support/tickets` | Yes | Create support ticket |
| GET | `/api/support/tickets` | Yes | Get user's tickets |
| GET | `/api/support/tickets/:id` | Yes | Get ticket details |
| POST | `/api/support/tickets/:id/messages` | Yes | Add message to ticket |
| POST | `/api/support/tickets/:id/satisfaction` | Yes | Rate support experience |

**Support Ticket Creation:**

```typescript
// POST /api/support/tickets
{
  "subject": "Cannot download purchased EA",
  "category": "technical", // technical, billing, account, other
  "priority": "medium", // low, medium, high, urgent
  "message": "I purchased an EA but the download link doesn't work..."
}
```

---

### 3.9 Admin Panel (`/api/admin/*`)

**Purpose:** Admin-only endpoints for platform management.

**User Management:**
- `GET /api/admin/users` - Paginated user list with filters
- `PATCH /api/admin/users/:id/role` - Update user role
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user

**Moderation:**
- `GET /api/admin/moderation/queue` - Pending content queue
- `POST /api/admin/moderation/content/:id/approve` - Approve content
- `POST /api/admin/moderation/content/:id/reject` - Reject content
- `GET /api/admin/moderation/stats` - Moderation statistics

**Finance:**
- `GET /api/admin/finance/stats` - Financial overview
- `GET /api/admin/finance/revenue-trend` - Revenue analytics
- `POST /api/admin/finance/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/admin/finance/withdrawals/:id/reject` - Reject withdrawal

**Communications:**
- `POST /api/admin/communications/announcements` - Create announcement
- `POST /api/admin/communications/campaigns` - Send email campaign

**Bots:**
- `GET /api/admin/bots` - All bots
- `POST /api/admin/bots` - Create bot
- `PUT /api/admin/bots/:id` - Update bot
- `POST /api/admin/bots/:id/refund` - Refund bot action

**Security:**
- `GET /api/admin/security/events` - Security events
- `POST /api/admin/security/ip-bans` - Ban IP address
- `DELETE /api/admin/security/ip-bans/:id` - Unban IP

**Errors:**
- `GET /api/admin/errors/groups` - Error groups
- `PUT /api/admin/errors/:id/status` - Update error status

---

### 3.10 Dashboard & Analytics (`/api/dashboard/*`)

**Purpose:** User dashboard and personal analytics.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/dashboard/overview` | Yes | Dashboard overview stats |
| GET | `/api/dashboard/earnings-sources` | Yes | Earning sources breakdown |
| GET | `/api/dashboard/loyalty-timeline` | Yes | Loyalty tier progress |
| GET | `/api/dashboard/activity-heatmap` | Yes | Activity heatmap data |
| GET | `/api/dashboard/badges` | Yes | User badges and progress |
| GET | `/api/dashboard/referrals` | Yes | Referral stats |
| GET | `/api/dashboard/preferences` | Yes | Dashboard preferences |
| POST | `/api/dashboard/preferences` | Yes | Update dashboard preferences |
| GET | `/api/me/dashboard-metrics` | Yes | Dashboard KPIs |
| GET | `/api/me/revenue-trend` | Yes | Personal revenue trend |

---

### 3.11 Sweets System (`/api/sweets/*`)

**Purpose:** Comprehensive coin economy and XP/rank system.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/sweets/balance/me` | Yes | Get user balance |
| GET | `/api/sweets/transactions/me` | Yes | Get transaction history |
| GET | `/api/sweets/expirations/me` | Yes | Get expiring coins |
| GET | `/api/sweets/history` | Yes | Detailed coin history |
| GET | `/api/sweets/leaderboard` | No | Coin leaderboard |
| GET | `/api/sweets/progress` | Yes | XP and rank progress |
| POST | `/api/sweets/award` | Admin | Award XP to user |
| GET | `/api/sweets/ranks` | No | All rank tiers |
| GET | `/api/sweets/feature-unlocks/:rankId` | No | Features unlocked at rank |
| GET | `/api/sweets/rewards` | Yes | Reward catalog |
| POST | `/api/sweets/rewards/:id` | Admin | Create reward |
| GET | `/api/sweets/grants/me` | Yes | User reward grants |
| POST | `/api/sweets/grants/:id/claim` | Yes | Claim granted reward |
| GET | `/api/sweets/redemptions/options` | Yes | Redemption options |
| POST | `/api/sweets/redemptions/orders` | Yes | Create redemption order |
| GET | `/api/sweets/redemptions/orders/me` | Yes | User redemption orders |

**Sweets Admin Endpoints:**
- `GET /api/sweets/admin/treasury/snapshot` - Treasury snapshot
- `POST /api/sweets/admin/treasury/snapshot` - Create snapshot
- `POST /api/sweets/admin/treasury/adjustment` - Adjust treasury
- `GET /api/sweets/admin/fraud-signals` - Fraud detection

---

### 3.12 Brokers (`/api/brokers/*`)

**Purpose:** Broker directory and reviews.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/brokers` | No | Get all brokers (paginated) |
| GET | `/api/brokers/:id` | No | Get broker details |
| GET | `/api/brokers/slug/:slug` | No | Get broker by slug |
| POST | `/api/brokers` | Yes | Submit new broker |
| PUT | `/api/brokers/:id` | Yes | Update broker (author only) |
| POST | `/api/brokers/:id/review` | Yes | Submit broker review |
| GET | `/api/brokers/:id/reviews` | No | Get broker reviews |
| POST | `/api/brokers/:id/scam-report` | Yes | Report scam broker |

---

### 3.13 Notifications (`/api/notifications/*`)

**Purpose:** In-app notification system.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/notifications` | Yes | Get user notifications |
| GET | `/api/notifications/unread-count` | Yes | Unread count |
| PUT | `/api/notifications/:id/read` | Yes | Mark as read |
| PUT | `/api/notifications/mark-all-read` | Yes | Mark all as read |
| DELETE | `/api/notifications/:id` | Yes | Delete notification |

---

### 3.14 Feedback (`/api/feedback`)

**Purpose:** User feedback and suggestions.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/feedback` | Optional | Submit feedback |
| GET | `/api/admin/feedback` | Admin | View all feedback |
| PUT | `/api/admin/feedback/:id/status` | Admin | Update feedback status |

---

### 3.15 Newsletter (`/api/newsletter/*`)

**Purpose:** Newsletter subscription management.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/newsletter/subscribe` | No | Subscribe to newsletter |
| POST | `/api/newsletter/unsubscribe` | No | Unsubscribe from newsletter |
| PUT | `/api/newsletter/preferences` | Yes | Update email preferences |

---

### 3.16 Email Tracking (`/api/email/*`)

**Purpose:** Email tracking and analytics.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/email/track/open/:trackingId` | No | Track email open (pixel) |
| GET | `/api/email/track/click/:trackingId` | No | Track link click |
| POST | `/api/email/unsubscribe` | No | Unsubscribe from emails |
| GET | `/api/admin/emails/analytics` | Admin | Email analytics |

---

### 3.17 SEO & Sitemap (`/api/seo/*`, `/api/sitemap/*`)

**Purpose:** SEO tools and sitemap management.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| POST | `/api/seo/scan` | Admin | Run SEO scan |
| GET | `/api/seo/issues` | Admin | List SEO issues |
| POST | `/api/seo/fix/:id` | Admin | Apply SEO fix |
| POST | `/api/sitemap/generate` | Admin | Generate sitemap |
| POST | `/api/sitemap/submit` | Admin | Submit to search engines |

---

### 3.18 Feature Flags (`/api/feature-flags/*`)

**Purpose:** Feature flag management.

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/feature-flags` | No | Get all feature flags |
| GET | `/api/feature-flags/:key` | No | Get specific flag |
| PUT | `/api/feature-flags/:key` | Admin | Update feature flag |
| POST | `/api/feature-flags` | Admin | Create feature flag |

---

### 3.19 Rate Limiting

**Rate Limits Applied:**

- **Coin Operations:** 30 requests/15 minutes
- **Content Creation:** 10 requests/hour
- **Review/Reply:** 20 requests/15 minutes
- **Admin Operations:** 100 requests/15 minutes
- **Activity Tracking:** 60 requests/minute
- **Messaging:** 30 requests/minute
- **Newsletter:** 5 requests/hour
- **Error Tracking:** 100 requests/minute
- **Marketplace Actions:** 20 requests/15 minutes
- **Finance Actions:** 10 requests/15 minutes
- **Support Tickets:** 10 requests/hour

---

## 4. Email System

### 4.1 Email Infrastructure

**Provider:** Hostinger SMTP  
**Transport:** Nodemailer with SSL/TLS  
**Port:** 465 (secure)  
**From Address:** Configured via `SMTP_FROM_EMAIL` and `SMTP_FROM_NAME` environment variables

**Features:**
- **Tracking:** Open tracking (pixel), click tracking, unsubscribe tokens
- **Queuing:** Email queue with priority levels
- **Smart Scheduling:** Send emails at optimal times based on user timezone
- **Bounce Handling:** Auto-unsubscribe on hard bounces
- **Rate Limiting:** Prevent spam and respect SMTP limits
- **Templates:** 60+ pre-built email templates
- **Personalization:** Dynamic content based on user data
- **Unsubscribe:** One-click unsubscribe with token validation

### 4.2 Email Templates (60+ Templates)

#### Transactional Emails

| Template | Trigger | Tracking | Purpose |
|----------|---------|----------|---------|
| `password_reset` | User requests password reset | Yes | Send reset link with token |
| `email_verification` | User registers | Yes | Verify email address |
| `username_changed` | User changes username | Yes | Confirm username change |
| `purchase_receipt` | User purchases content | Yes | Purchase confirmation and download link |
| `withdrawal_request_received` | User requests withdrawal | Yes | Confirm withdrawal request received |
| `withdrawal_sent` | Admin approves withdrawal | Yes | Withdrawal processed successfully |
| `coins_received` | User earns coins | Yes | Coin earning notification |
| `product_sold` | Content is purchased | Yes | Notify seller of sale |
| `product_published` | Content approved | Yes | Content live on marketplace |
| `coin_purchase_confirmation` | User recharges coins | Yes | Coin purchase receipt |
| `payout_processed` | Withdrawal completed | Yes | Payout processed and sent |
| `refund_issued` | Refund processed | Yes | Refund confirmation |

#### Notification Emails

| Template | Trigger | Tracking | Purpose |
|----------|---------|----------|---------|
| `comment_notification` | Someone comments on thread | Yes | New comment on your thread |
| `like_notification` | Someone likes content | Yes | User liked your content |
| `follow_notification` | Someone follows user | Yes | New follower notification |
| `new_message` | Private message received | Yes | New message notification |
| `thread_reply` | Someone replies to thread | Yes | New reply on your thread |
| `mention_notification` | User mentioned in post | Yes | You were mentioned |
| `quote_notification` | Someone quotes your post | Yes | Your post was quoted |
| `thread_activity` | Activity on subscribed thread | Yes | Thread you follow has activity |
| `product_review` | Content receives review | Yes | New review on your product |
| `best_answer` | Reply marked as best answer | Yes | Your reply was marked as best |
| `content_shared` | Content shared | Yes | Your content was shared |
| `level_up` | User levels up | Yes | Level up celebration |
| `leaderboard_rank` | User ranks on leaderboard | Yes | Leaderboard achievement |
| `badge_earned` | User earns badge | Yes | Badge unlocked |

#### Engagement Emails

| Template | Trigger | Tracking | Purpose |
|----------|---------|----------|---------|
| `weekly_digest` | Weekly cron job | Yes | Weekly activity summary |
| `weekly_activity_summary` | Weekly cron job | Yes | Personal activity stats |
| `post_popular` | Post reaches view threshold | Yes | Your post is trending |
| `first_post_milestone` | First post published | Yes | Welcome and tips |
| `post_milestone` | 10, 50, 100 posts | Yes | Milestone celebration |
| `recommended_posts` | Daily/weekly | Yes | Personalized content recommendations |
| `inactive_user_reengagement` | User inactive 30+ days | Yes | We miss you, come back |
| `abandonment_email` | User starts action but doesn't finish | Yes | Complete your profile/purchase |
| `premium_expiring_soon` | Premium expiring in 7 days | Yes | Renew your subscription |
| `subscription_auto_renewed` | Subscription renewed | Yes | Subscription renewed confirmation |
| `subscription_canceled` | User cancels subscription | Yes | Subscription canceled |
| `low_balance_warning` | Coins below threshold | Yes | Low coin balance alert |
| `download_limit_reached` | Daily download limit hit | Yes | Download limit notification |
| `file_expiring` | File expires soon | Yes | Download before expiration |

#### Admin/Moderation Emails

| Template | Trigger | Tracking | Purpose |
|----------|---------|----------|---------|
| `post_approved` | Admin approves content | Yes | Content approved |
| `post_rejected` | Admin rejects content | Yes | Content rejected with reason |
| `content_reported` | Content reported | Yes | Notify admin of report |
| `content_removed` | Content removed by admin | Yes | Content removed notification |
| `account_warning` | Admin warns user | Yes | Warning or suspension notice |
| `new_device_login` | Login from new device | Yes | Security alert |
| `sale_pending_payment` | Pending payment | Yes | Payment pending notice |

#### Marketing/Campaign Emails

| Template | Trigger | Tracking | Purpose |
|----------|---------|----------|---------|
| `big_announcement` | Admin sends announcement | Yes | Platform announcements |
| `event_reminder` | Event coming up | Yes | Event reminder |
| `contest_entry` | User enters contest | Yes | Contest entry confirmation |
| `contest_winner` | User wins contest | Yes | Contest winner notification |
| `group_invite` | User invited to group | Yes | Group invitation |

#### Special Emails

| Template | Trigger | Tracking | Purpose |
|----------|---------|----------|---------|
| `product_listed` | Product listed on marketplace | Yes | Product listed successfully |
| `upload_success` | File uploaded successfully | Yes | Upload confirmation |
| `comment_success` | Comment posted | Yes | Comment posted successfully |

### 4.3 Email Tracking System

**Tracking Features:**

1. **Open Tracking**
   - Invisible 1x1 pixel image embedded in email
   - Tracks when email is opened
   - Records timestamp and user agent
   - Endpoint: `GET /api/email/track/open/:trackingId`

2. **Click Tracking**
   - All links wrapped with tracking redirect
   - Tracks which links are clicked
   - Records click timestamp and destination
   - Endpoint: `GET /api/email/track/click/:trackingId`

3. **Unsubscribe Tokens**
   - Unique token per email notification
   - Secure one-click unsubscribe
   - Token expires after 90 days
   - Endpoint: `POST /api/email/unsubscribe`

**Email Notification Schema:**

```typescript
{
  "id": "notif123", // Same as tracking ID
  "userId": "user456",
  "templateKey": "comment_notification",
  "recipientEmail": "user@example.com",
  "subject": "Alex Thompson commented on your thread",
  "payload": {
    "commenterName": "Alex Thompson",
    "threadTitle": "Best scalping strategy",
    "commentPreview": "Great thread! I've been using..."
  },
  "status": "sent", // queued, sent, delivered, bounced, failed
  "sentAt": "2025-11-02T10:00:00Z",
  "openedAt": "2025-11-02T10:05:00Z",
  "clickedAt": "2025-11-02T10:06:00Z",
  "bouncedAt": null,
  "providerMessageId": "smtp-msg-123"
}
```

### 4.4 Email Queue System

**Priority Levels:**
- **Critical:** Password resets, security alerts (immediate)
- **High:** Purchase receipts, withdrawals (5-minute delay)
- **Medium:** Notifications, comments, likes (15-minute batching)
- **Low:** Weekly digests, recommendations (scheduled)

**Smart Scheduling:**
- Analyzes user activity patterns
- Sends emails at optimal times based on user timezone
- Respects quiet hours (e.g., not between 10 PM - 8 AM local time)
- Batches low-priority emails to reduce server load

**Bounce Handling:**
- **Hard Bounce:** Permanent failure, auto-unsubscribe after 1 bounce
- **Soft Bounce:** Temporary failure, retry 3 times over 24 hours
- **Bounce Counter:** Track bounce count per user email
- **Auto-cleanup:** Remove invalid emails from database

### 4.5 Email Preferences

Users can control which emails they receive:

```typescript
{
  "userId": "user123",
  "emailNotifications": true, // Global toggle
  "preferences": {
    "marketing": true,
    "productUpdates": true,
    "weeklyDigest": false,
    "comments": true,
    "likes": false,
    "follows": true,
    "messages": true,
    "purchases": true,
    "sales": true,
    "moderation": true,
    "system": true
  }
}
```

**Endpoint:** `PATCH /api/user/notifications`

---

## 5. Database Schema

### 5.1 Core Tables

#### users

**Purpose:** Store all user accounts (members, admins, bots).

**Key Columns:**
- `id` (PK) - UUID, auto-generated
- `email` - Unique email address
- `username` - Unique username
- `password_hash` - Bcrypt hashed password
- `auth_provider` - email, google, replit
- `google_uid` - Google OAuth UID
- `role` - member, moderator, admin, superadmin
- `status` - active, suspended, banned
- `totalCoins` - User's coin balance
- `weeklyEarned` - Coins earned this week
- `reputationScore` - Reputation points
- `level` - User level (0-100)
- `isBot` - Boolean flag for bot accounts
- `emailNotifications` - Email notification toggle
- `createdAt`, `updatedAt`, `last_login_at`

**Indexes:**
- `idx_users_username`, `idx_users_email`, `idx_users_role`, `idx_users_status`

**Check Constraints:**
- `chk_user_coins_nonnegative`: Coins cannot be negative

---

#### coinTransactions

**Purpose:** Record all coin transactions (earn, spend, recharge).

**Key Columns:**
- `id` (PK) - UUID
- `userId` (FK) → users.id
- `type` - earn, spend, recharge
- `amount` - Coin amount (integer)
- `description` - Transaction description
- `status` - completed, pending, failed
- `botId` (FK) → bots.id (nullable, if from bot action)
- `channel` - web, mobile, api, bot, admin
- `trigger` - What triggered transaction
- `expiresAt` - Coin expiration date
- `reconciledAt` - Balance reconciliation timestamp
- `reversalOf` (FK) - Original transaction if this is reversal
- `createdAt`

**Indexes:**
- `idx_coin_transactions_user_id`, `idx_coin_transactions_bot_id`, `idx_coin_transactions_channel`

---

#### content

**Purpose:** Store marketplace content (EAs, indicators, articles).

**Key Columns:**
- `id` (PK) - UUID
- `authorId` (FK) → users.id
- `type` - ea, indicator, article, source_code
- `title` - Content title
- `description` - Full description
- `priceCoins` - Price in coins (0 = free)
- `isFree` - Boolean
- `category` - Content category
- `platform` - MT4, MT5, Both
- `tags` - Array of tags
- `files` - JSONB array of file objects
- `images` - JSONB array of image objects
- `status` - pending, approved, rejected, suspended
- `slug` - URL-friendly slug (unique)
- `views`, `downloads`, `likes`, `salesCount`
- `revenue` - Total revenue earned
- `approvedBy`, `approvedAt`, `rejectedBy`, `rejectedAt`
- `createdAt`, `updatedAt`

**Indexes:**
- `idx_content_author_id`, `idx_content_status`, `idx_content_slug`, `idx_content_sales_count`

---

#### forumThreads

**Purpose:** Store forum discussion threads.

**Key Columns:**
- `id` (PK) - UUID
- `authorId` (FK) → users.id
- `title` - Thread title
- `body` - Thread content (rich text)
- `category` - Forum category
- `subcategory` - Forum subcategory
- `tags` - Array of tags
- `slug` - URL-friendly slug (unique)
- `views`, `replyCount`, `likeCount`
- `isPinned`, `isLocked`
- `status` - pending, approved, rejected
- `lastReplyAt` - Last activity timestamp
- `createdAt`, `updatedAt`

**Indexes:**
- `idx_forum_threads_author_id`, `idx_forum_threads_category`, `idx_forum_threads_slug`

---

#### forumReplies

**Purpose:** Store replies to forum threads.

**Key Columns:**
- `id` (PK) - UUID
- `threadId` (FK) → forumThreads.id
- `authorId` (FK) → users.id
- `parentId` (FK) → forumReplies.id (for nested replies)
- `body` - Reply content
- `likeCount` - Number of likes
- `isBestAnswer` - Marked as best answer
- `isDeleted` - Soft delete flag
- `createdAt`, `updatedAt`

**Indexes:**
- `idx_forum_replies_thread_id`, `idx_forum_replies_author_id`

---

#### brokers

**Purpose:** Store forex broker directory listings.

**Key Columns:**
- `id` (PK) - UUID
- `name` - Broker name
- `slug` - URL-friendly slug
- `websiteUrl` - Broker website
- `logoUrl` - Broker logo
- `yearFounded` - Year founded
- `regulation` - Regulatory bodies
- `platform` - Trading platforms offered
- `minDeposit` - Minimum deposit
- `leverage` - Max leverage
- `overallRating` - Average rating (1-5)
- `reviewCount` - Number of reviews
- `scamReportCount` - Scam reports
- `status` - pending, approved, rejected
- `createdAt`, `updatedAt`

**Indexes:**
- `idx_brokers_slug`, `idx_brokers_status`

---

#### supportTickets

**Purpose:** Customer support ticket system.

**Key Columns:**
- `id` (PK) - UUID
- `userId` (FK) → users.id
- `subject` - Ticket subject
- `category` - technical, billing, account, other
- `priority` - low, medium, high, urgent
- `status` - new, in_progress, resolved, closed
- `assignedTo` (FK) → users.id (admin)
- `resolvedAt` - Resolution timestamp
- `satisfaction` - User satisfaction rating (1-5)
- `createdAt`, `updatedAt`

**Indexes:**
- `idx_support_tickets_user_id`, `idx_support_tickets_status`, `idx_support_tickets_assigned_to`

---

### 5.2 Messaging System Tables

#### conversations

**Purpose:** Private messaging conversations.

**Key Columns:**
- `id` (PK) - UUID
- `type` - direct, group
- `name` - Conversation name (for groups)
- `createdBy` (FK) → users.id
- `lastMessageAt` - Last activity
- `createdAt`, `updatedAt`

---

#### messages

**Purpose:** Individual messages in conversations.

**Key Columns:**
- `id` (PK) - UUID
- `conversationId` (FK) → conversations.id
- `senderId` (FK) → users.id
- `body` - Message text
- `isDeleted` - Soft delete
- `createdAt`, `updatedAt`

**Indexes:**
- `idx_messages_conversation_id`, `idx_messages_sender_id`

---

#### conversationParticipants

**Purpose:** Track participants in conversations.

**Key Columns:**
- `id` (PK) - UUID
- `conversationId` (FK) → conversations.id
- `userId` (FK) → users.id
- `joinedAt` - When user joined
- `leftAt` - When user left (nullable)
- `role` - admin, member
- `isMuted` - Muted notifications

---

#### messageAttachments

**Purpose:** File attachments in messages.

**Key Columns:**
- `id` (PK) - UUID
- `messageId` (FK) → messages.id
- `fileName` - Original filename
- `fileUrl` - Storage URL
- `fileType` - MIME type
- `fileSize` - Size in bytes
- `uploadedAt`

---

### 5.3 Bot System Tables

#### bots

**Purpose:** AI-powered engagement bots.

**Key Columns:**
- `id` (PK) - UUID (same as user ID)
- `username` - Bot username (matches users.username)
- `firstName`, `lastName` - Human names for emails
- `email` - Bot email
- `profileImageUrl` - Bot avatar
- `bio` - Bot biography
- `tradingStyle` - scalper, swing, day_trader
- `isActive` - Bot enabled/disabled
- `coinBudget` - Total coin budget
- `coinsSpent` - Coins spent so far
- `actionsPerDay` - Target actions per day
- `replyFrequency` - Probability to reply (0-1)
- `likeFrequency` - Probability to like (0-1)
- `followFrequency` - Probability to follow (0-1)
- `activityHours` - Array of active hours (UTC)
- `createdAt`, `updatedAt`

**Unique Constraint:** Bot ID matches user ID in users table

---

#### botActions

**Purpose:** Log all bot actions for audit and analytics.

**Key Columns:**
- `id` (PK) - UUID
- `botId` (FK) → bots.id
- `actionType` - like, reply, follow, purchase
- `targetType` - thread, content, user
- `targetId` - ID of target
- `coinsSpent` - Coins spent on action
- `metadata` - JSONB with action details
- `createdAt`

**Indexes:**
- `idx_bot_actions_bot_id`, `idx_bot_actions_action_type`

---

#### botRefunds

**Purpose:** Track refunded bot actions.

**Key Columns:**
- `id` (PK) - UUID
- `botActionId` (FK) → botActions.id
- `botId` (FK) → bots.id
- `refundAmount` - Coins refunded
- `refundReason` - Reason for refund
- `refundedBy` (FK) → users.id (admin)
- `refundedAt`

---

### 5.4 Email System Tables

#### emailNotifications

**Purpose:** Track email deliveries and engagement.

**Key Columns:**
- `id` (PK) - UUID (tracking ID)
- `userId` (FK) → users.id
- `templateKey` - Email template identifier
- `recipientEmail` - Email address
- `subject` - Email subject line
- `payload` - JSONB with template data
- `status` - queued, sent, delivered, opened, clicked, bounced, failed
- `sentAt`, `openedAt`, `clickedAt`, `bouncedAt`
- `providerMessageId` - SMTP message ID
- `createdAt`

**Indexes:**
- `idx_email_notifications_user_id`, `idx_email_notifications_status`, `idx_email_notifications_template_key`

---

#### unsubscribeTokens

**Purpose:** Secure unsubscribe tokens for one-click unsubscribe.

**Key Columns:**
- `id` (PK) - UUID
- `userId` (FK) → users.id
- `tokenHash` - SHA-256 hash of token
- `notificationId` (FK) → emailNotifications.id
- `expiresAt` - Token expiration (90 days)
- `usedAt` - When token was used (nullable)
- `createdAt`

---

#### newsletterSubscribers

**Purpose:** Newsletter subscription management.

**Key Columns:**
- `id` (PK) - UUID
- `email` - Subscriber email (unique)
- `status` - subscribed, unsubscribed, bounced
- `subscribedAt`, `unsubscribedAt`
- `source` - How they subscribed

---

### 5.5 Sweets Economy Tables

#### rewardCatalog

**Purpose:** Catalog of redeemable rewards.

**Key Columns:**
- `id` (PK) - UUID
- `name` - Reward name
- `description` - Reward description
- `coinCost` - Cost in coins
- `rewardType` - badge, feature_unlock, discount, physical
- `isActive` - Available for redemption
- `quantityAvailable` - Stock quantity
- `createdAt`, `updatedAt`

---

#### redemptionOptions

**Purpose:** Real-world redemption options (PayPal, gift cards, etc.).

**Key Columns:**
- `id` (PK) - UUID
- `name` - Option name (e.g., "PayPal Cash")
- `description` - Description
- `coinCost` - Minimum coins required
- `usdValue` - USD equivalent
- `provider` - paypal, amazon, crypto
- `isActive` - Available for redemption
- `createdAt`, `updatedAt`

---

#### redemptionOrders

**Purpose:** Track redemption requests.

**Key Columns:**
- `id` (PK) - UUID
- `userId` (FK) → users.id
- `optionId` (FK) → redemptionOptions.id
- `coinsSpent` - Coins deducted
- `usdValue` - USD value
- `status` - pending, processing, completed, rejected
- `paymentDetails` - JSONB (PayPal email, crypto wallet, etc.)
- `processedBy` (FK) → users.id (admin)
- `completedAt`, `rejectedAt`
- `createdAt`

---

#### fraudSignals

**Purpose:** Fraud detection signals.

**Key Columns:**
- `id` (PK) - UUID
- `userId` (FK) → users.id
- `signalType` - rapid_earning, bot_like_behavior, wallet_manipulation
- `severity` - low, medium, high, critical
- `description` - Signal details
- `metadata` - JSONB with evidence
- `isResolved` - Investigation complete
- `resolvedBy` (FK) → users.id (admin)
- `resolvedAt`
- `createdAt`

**Indexes:**
- `idx_fraud_signals_user_id`, `idx_fraud_signals_severity`

---

#### treasurySnapshots

**Purpose:** Treasury balance snapshots for auditing.

**Key Columns:**
- `id` (PK) - UUID
- `totalCoinsIssued` - Total coins ever issued
- `totalCoinsCirculating` - Coins in user wallets
- `totalCoinsInTreasury` - Coins in treasury
- `totalUserBalance` - Sum of all user balances
- `discrepancy` - Balance mismatch (should be 0)
- `snapshotAt`

---

### 5.6 Error Monitoring Tables

#### errorGroups

**Purpose:** Group similar errors together.

**Key Columns:**
- `id` (PK) - UUID
- `errorSignature` - Hash of error message + stack
- `firstSeenAt`, `lastSeenAt`
- `occurrenceCount` - Total occurrences
- `status` - unsolved, to_be_solved, solved
- `severity` - info, warning, error, critical
- `source` - frontend, backend
- `resolvedBy` (FK) → users.id (admin)
- `resolvedAt`

---

#### errorEvents

**Purpose:** Individual error occurrences.

**Key Columns:**
- `id` (PK) - UUID
- `groupId` (FK) → errorGroups.id
- `message` - Error message
- `stack` - Stack trace
- `url` - URL where error occurred
- `userId` (FK) → users.id (nullable)
- `userAgent` - Browser user agent
- `metadata` - JSONB with additional context
- `occurredAt`

**Indexes:**
- `idx_error_events_group_id`, `idx_error_events_user_id`

---

### 5.7 Admin & Audit Tables

#### adminActions

**Purpose:** Audit log of admin actions.

**Key Columns:**
- `id` (PK) - UUID
- `adminId` (FK) → users.id
- `action` - Action type (user_banned, content_approved, etc.)
- `targetType` - user, content, thread, etc.
- `targetId` - ID of affected resource
- `details` - JSONB with action details
- `createdAt`

**Indexes:**
- `idx_admin_actions_admin_id`, `idx_admin_actions_action`

---

#### moderationEvents

**Purpose:** Content moderation audit trail.

**Key Columns:**
- `id` (PK) - UUID
- `moderatorId` (FK) → users.id
- `contentType` - thread, content, reply, broker
- `contentId` - ID of moderated content
- `action` - approved, rejected
- `reason` - Reason for action
- `createdAt`

---

#### securityEvents

**Purpose:** Security event logging.

**Key Columns:**
- `id` (PK) - UUID
- `eventType` - failed_login, password_change, ip_ban, etc.
- `userId` (FK) → users.id (nullable)
- `ipAddress` - IP address
- `severity` - low, medium, high, critical
- `details` - JSONB with event details
- `createdAt`

**Indexes:**
- `idx_security_events_user_id`, `idx_security_events_event_type`, `idx_security_events_ip`

---

#### ipBans

**Purpose:** IP address bans.

**Key Columns:**
- `id` (PK) - UUID
- `ipAddress` - Banned IP address
- `reason` - Ban reason
- `bannedBy` (FK) → users.id (admin)
- `bannedAt`
- `expiresAt` - Expiration (null = permanent)
- `autoBlocked` - Auto-blocked by system
- `severity` - low, medium, high, critical

---

### 5.8 Retention & Gamification Tables

#### retentionMetrics

**Purpose:** User retention and engagement metrics.

**Key Columns:**
- `id` (PK) - UUID
- `userId` (FK) → users.id
- `loginStreak` - Consecutive days logged in
- `lastLoginDate` - Last login date
- `loyaltyTier` - bronze, silver, gold, platinum
- `lifetimeValue` - Total value contributed
- `engagementScore` - Engagement metric (0-100)
- `updatedAt`

---

#### retentionBadges

**Purpose:** Retention badges earned by users.

**Key Columns:**
- `id` (PK) - UUID
- `userId` (FK) → users.id
- `badgeType` - early_bird, night_owl, week_warrior, etc.
- `earnedAt`

---

#### vaultCoins

**Purpose:** Coin vault bonuses.

**Key Columns:**
- `id` (PK) - UUID
- `userId` (FK) → users.id
- `depositedAmount` - Coins deposited
- `bonusAmount` - Bonus coins earned
- `lockPeriodDays` - Lock period (7, 30, 90)
- `depositedAt`
- `unlocksAt` - When coins unlock
- `claimedAt` - When user claimed (nullable)

---

### 5.9 Full Table List (80+ Tables)

1. sessions
2. users
3. userActivity
4. coinTransactions
5. rechargeOrders
6. subscriptions
7. withdrawalRequests
8. financialTransactions
9. payoutAuditLogs
10. feedback
11. content
12. contentPurchases
13. contentReviews
14. contentLikes
15. contentReplies
16. brokers
17. brokerReviews
18. userFollows
19. conversations
20. messages
21. messageReactions
22. conversationParticipants
23. messageAttachments
24. messageReadReceipts
25. userMessageSettings
26. blockedUsers
27. messageReports
28. moderationActions
29. spamDetectionLogs
30. notifications
31. forumThreads
32. forumReplies
33. moderationEvents
34. contentReports
35. forumCategories
36. seoCategories
37. categoryRedirects
38. userBadges
39. activityFeed
40. userWallet
41. coinLedgerTransactions
42. coinJournalEntries
43. ledgerReconciliationRuns
44. dashboardPreferences
45. dailyActivityLimits
46. referrals
47. goals
48. achievements
49. userAchievements
50. campaigns
51. dashboardSettings
52. profiles
53. userSettings
54. adminActions
55. moderationQueue
56. reportedContent
57. systemSettings
58. supportTickets
59. ticketMessages
60. pageControls
61. adminRoles
62. userSegments
63. automationRules
64. abTests
65. emailTemplates
66. emailNotifications
67. emailPreferences
68. unsubscribeTokens
69. newsletterSubscribers
70. passwordResetTokens
71. emailEvents
72. retentionMetrics
73. vaultCoins
74. loyaltyTiers
75. retentionBadges
76. aiNudges
77. abandonmentEmails
78. earningsSources
79. activityHeatmap
80. errorGroups
81. errorEvents
82. errorStatusChanges
83. seoScans
84. seoIssues
85. seoFixes
86. seoMetrics
87. seoPerformanceMetrics
88. seoOverrides
89. seoFixJobs
90. seoScanHistory
91. seoAlertHistory
92. serviceCredentials
93. bots
94. botActions
95. botTreasury
96. botRefunds
97. botAuditLog
98. botSettings
99. rewardCatalog
100. rewardGrants
101. redemptionOptions
102. redemptionOrders
103. coinExpirations
104. fraudSignals
105. treasurySnapshots
106. treasuryAdjustments
107. botWalletEvents
108. aiLogs
109. securityEvents
110. ipBans
111. announcements
112. emailCampaigns
113. sitemapLogs
114. rankTiers
115. userRankProgress
116. weeklyEarnings
117. featureFlags

---

## 6. Key Features

### 6.1 Sweets Coin Economy

**Overview:** Virtual currency system that rewards user engagement and powers the marketplace.

**Features:**
- **Earning Mechanisms:** Publish content, forum engagement, reviews, referrals, daily login
- **Spending Mechanisms:** Purchase content, marketplace transactions, withdrawals
- **Coin Expiration:** Coins expire after 365 days (configurable)
- **Treasury System:** Platform-managed coin treasury for sustainability
- **Fraud Detection:** Multi-layer fraud prevention and detection
- **Wallet Caps:** Maximum wallet limits to prevent manipulation
- **Transaction Ledger:** Double-entry bookkeeping for accuracy
- **Balance Reconciliation:** Automated balance checks and reconciliation
- **Redemption Marketplace:** Redeem coins for real-world value (PayPal, gift cards)

**Earning Rates:**
- First reply: 5 coins
- First thread: 10 coins
- First publish: 30 coins
- Profile picture: 10 coins
- Two reviews: 6 coins
- Fifty followers: 200 coins
- Daily journal: 2 coins

**Daily Limits:**
- Replies: 10/day
- Threads: 3/day
- Reviews: 5/day
- Journals: 1/day

**Platform Fees:**
- Marketplace sale: 20% commission
- Withdrawal: 50 coins flat fee
- Refund: 5% restocking fee

---

### 6.2 Bot Engagement System

**Overview:** AI-powered bots that simulate human engagement to kickstart community growth.

**Features:**
- **Human-like Profiles:** Realistic names, avatars, bios, trading styles
- **Natural Behavior:** Varied activity patterns, realistic response times
- **Budget Management:** Allocated coin budgets per bot
- **Scheduled Activity:** Active during specific hours to mimic humans
- **Multiple Actions:** Likes, replies, follows, purchases
- **Gemini AI Integration:** AI-generated replies and content
- **Audit Trail:** Complete logging of all bot actions
- **Refund System:** Refund coins from bot actions
- **Email Hiding:** Bots appear as humans in email notifications
- **Admin Controls:** Full control over bot creation, activation, deletion

**Bot Activity Configuration:**
- `actionsPerDay`: Target actions per day
- `replyFrequency`: Probability to reply (0-1)
- `likeFrequency`: Probability to like (0-1)
- `followFrequency`: Probability to follow (0-1)
- `activityHours`: Array of active UTC hours

**Recent Enhancement (Nov 2, 2025):**
- Bots now use realistic human names (firstName + lastName) in emails
- Email subjects display "Alex Thompson" instead of "ScalpPro123"
- Bot names synchronized between `bots` and `users` tables
- Bots remain fully visible in admin panel for management

---

### 6.3 Email Tracking & Analytics

**Overview:** Comprehensive email engagement tracking system.

**Features:**
- **Open Tracking:** Invisible pixel to track email opens
- **Click Tracking:** Track link clicks within emails
- **Engagement Metrics:** Open rate, click rate, bounce rate
- **User Segmentation:** Segment users by email engagement
- **Smart Scheduling:** Send emails at optimal times per user timezone
- **Bounce Handling:** Auto-unsubscribe on hard bounces
- **Unsubscribe Management:** One-click unsubscribe with secure tokens
- **Email Queue:** Priority-based email queuing
- **Template Analytics:** Performance metrics per email template
- **Delivery Tracking:** Track delivery status via SMTP provider

**Tracking Endpoints:**
- `GET /api/email/track/open/:trackingId` - Track open
- `GET /api/email/track/click/:trackingId` - Track click
- `POST /api/email/unsubscribe` - Unsubscribe via token

---

### 6.4 Error Monitoring System

**Overview:** Comprehensive error tracking and resolution platform.

**Features:**
- **Smart Grouping:** Automatically group similar errors
- **Severity Levels:** Info, warning, error, critical
- **Source Tracking:** Frontend vs backend error categorization
- **Stack Traces:** Full stack traces for debugging
- **User Impact Analysis:** Track affected users
- **Status Workflow:** Unsolved → To-Be-Solved → Solved
- **Resolution Notes:** Document how errors were fixed
- **Error Analytics:** Frequency, patterns, trends
- **Auto-Retry:** Automatic retry for transient errors
- **Admin Dashboard:** Error monitoring UI at `/admin/errors`

**Error Resolution Workflow:**
1. Error occurs (frontend or backend)
2. Error captured and sent to `/api/errors/log`
3. Error grouped by signature (message + stack hash)
4. Admin reviews in error dashboard
5. Admin marks as "to-be-solved"
6. Developer investigates and fixes
7. Admin marks as "solved" with resolution notes

---

### 6.5 SEO Optimization System

**Overview:** AI-powered SEO tools and automation.

**Features:**
- **Auto-Generated Metadata:** Gemini AI generates meta descriptions
- **Image Alt Text:** AI-generated alt text for accessibility
- **Focus Keywords:** Automatic keyword extraction
- **SEO Scoring:** Calculate SEO score per page
- **Bulk SEO Fixes:** Apply fixes to multiple pages
- **Sitemap Generation:** Auto-generate XML sitemaps
- **Sitemap Submission:** Submit to Google, Bing, Yandex
- **SEO Scanning:** Identify missing meta tags, alt text
- **Performance Monitoring:** Track Core Web Vitals
- **URL Structure:** SEO-friendly hierarchical URLs

**SEO Admin Tools:**
- `POST /api/admin/seo/generate-meta` - Generate meta description
- `POST /api/admin/seo/scan` - Run SEO scan
- `POST /api/admin/seo/fix/:id` - Apply SEO fix
- `POST /api/admin/seo/sitemap/generate` - Generate sitemap

---

### 6.6 Feature Flags & Page Controls

**Overview:** Enterprise-grade feature flag system for controlled rollouts.

**Features:**
- **Feature Toggles:** Enable/disable features without deployment
- **Tri-State Status:** ON, OFF, Coming Soon
- **Page Controls:** Control page availability (ON/OFF/Maintenance/Coming Soon)
- **Scheduled Downtime:** Schedule maintenance windows
- **Custom Messages:** Custom messages for each page state
- **In-Memory Caching:** Fast feature flag checks
- **Environment Specific:** Different flags per environment
- **Admin Dashboard:** Feature flag UI at `/admin/page-controls`

**Page Status Options:**
- **ON:** Page available to all users
- **OFF:** Page disabled, redirect to 404
- **Coming Soon:** Show "Coming Soon" page
- **Maintenance:** Show maintenance page with countdown

---

### 6.7 Retention & Loyalty System

**Overview:** Gamified retention system to improve user engagement.

**Features:**
- **Loyalty Tiers:** Bronze, Silver, Gold, Platinum
- **Login Streaks:** Track consecutive login days
- **Badges:** Earn badges for achievements
- **AI Nudges:** Personalized engagement prompts
- **Abandonment Emails:** Re-engage inactive users
- **Vault Bonuses:** Lock coins for bonus rewards
- **Engagement Score:** Calculate user engagement (0-100)
- **Lifetime Value:** Track user contribution value
- **Weekly Digest:** Personalized weekly summary emails

**Loyalty Tier Benefits:**
- Bronze: Basic features
- Silver: Priority support, 5% marketplace discount
- Gold: Early access, 10% discount, exclusive badge
- Platinum: VIP support, 15% discount, featured profile

---

### 6.8 Messaging System

**Overview:** Real-time private messaging with file attachments.

**Features:**
- **1-on-1 Messaging:** Direct messages between users
- **Group Chats:** Multi-user conversations
- **File Attachments:** Upload images, documents
- **Message Reactions:** React with emojis
- **Read Receipts:** See when messages are read
- **Typing Indicators:** See when someone is typing
- **Full-Text Search:** Search message history
- **Spam Prevention:** Rate limiting and spam detection
- **Admin Moderation:** Admins can view and moderate messages
- **Real-time Updates:** WebSocket integration

**Message Features:**
- Supports rich text formatting
- Image preview
- File size limit: 20MB
- Supported types: Images, PDFs, documents

---

### 6.9 Support Ticket System

**Overview:** Enterprise-grade customer support platform.

**Features:**
- **Multi-Channel:** Email, in-app ticket creation
- **Priority Levels:** Low, Medium, High, Urgent
- **Status Workflow:** New → In Progress → Resolved → Closed
- **Assignment:** Assign tickets to specific admins
- **SLA Tracking:** Response and resolution time tracking
- **Internal Notes:** Admin-only notes on tickets
- **Satisfaction Surveys:** Post-resolution feedback
- **Ticket Search:** Search by user, subject, status
- **Email Notifications:** Notify users of ticket updates
- **Dual Interfaces:** User view (`/support`) and admin view (`/admin/support`)

**SLA Targets:**
- **Response Time:** 
  - Urgent: 1 hour
  - High: 4 hours
  - Medium: 24 hours
  - Low: 48 hours
- **Resolution Time:**
  - Urgent: 4 hours
  - High: 1 day
  - Medium: 3 days
  - Low: 7 days

---

### 6.10 Admin Analytics Dashboard

**Overview:** Real-time analytics and business intelligence.

**Features:**
- **User Analytics:** Growth, retention, churn, engagement
- **Revenue Analytics:** Sales, revenue, conversion rates
- **Content Analytics:** Views, downloads, trending content
- **Forum Analytics:** Thread activity, reply rates
- **Traffic Analytics:** Page views, unique visitors, bounce rate
- **Bot Analytics:** Bot performance and engagement
- **Real-time Stats:** Live user count, active sessions
- **Custom Reports:** Build custom analytics queries
- **Export Capabilities:** CSV, PDF export

**Key Metrics:**
- Total Users
- Active Users (daily/weekly/monthly)
- Total Revenue
- Marketplace Sales
- Pending Withdrawals
- Support Tickets (open/resolved)
- Error Rate
- System Uptime

---

### 6.11 Content Moderation System

**Overview:** Comprehensive content moderation workflow.

**Features:**
- **Moderation Queue:** Pending content awaiting review
- **Multi-Type Support:** Threads, content, brokers, replies
- **Approve/Reject Workflow:** One-click moderation actions
- **Mandatory Rejection Reasons:** Required reason for rejections
- **Email Notifications:** Notify users of moderation decisions
- **Audit Logging:** Immutable logs of all actions
- **Moderator Notes:** Internal notes on content
- **Batch Actions:** Moderate multiple items
- **Status Filtering:** Filter by pending, approved, rejected
- **Admin Dashboard:** Moderation UI at `/admin/moderation`

**Moderation Actions:**
- **Approve:** Make content live, notify author
- **Reject:** Hide content, notify author with reason
- **Suspend:** Temporarily hide content
- **Feature:** Promote to featured section

---

### 6.12 Security & Safety System

**Overview:** Enterprise-grade security monitoring.

**Features:**
- **IP Ban Management:** Ban malicious IP addresses
- **Auto-Blocking:** Auto-ban after 5 failed login attempts
- **Security Event Logging:** Track all security events
- **Failed Login Tracking:** Monitor brute force attempts
- **Severity Escalation:** Track repeated offenses
- **Threat Detection:** Identify suspicious patterns
- **2FA Support:** Two-factor authentication (future)
- **Session Management:** Secure session handling
- **Password Hashing:** Bcrypt password hashing
- **Admin Dashboard:** Security UI at `/admin/security`

**Auto-Block Rules:**
- 5 failed login attempts within 15 minutes → 1-hour IP ban
- 10 failed attempts within 1 hour → 24-hour IP ban
- 20 failed attempts within 24 hours → Permanent IP ban

---

### 6.13 Financial Management System

**Overview:** Comprehensive financial oversight platform.

**Features:**
- **Revenue Tracking:** Track all revenue sources
- **Withdrawal Management:** Approve/reject withdrawal requests
- **Payout Processing:** Process payouts to users
- **Transaction Logs:** Complete transaction history
- **Financial Reports:** Export financial data for accounting
- **Revenue Analytics:** Time-series revenue charts
- **Payment Method Stats:** Breakdown by crypto, PayPal, bank
- **Commission Tracking:** Platform fees and seller earnings
- **Refund Management:** Process refunds
- **Admin Dashboard:** Finance UI at `/admin/finance`

**Revenue Sources:**
- Marketplace sales (20% commission)
- Coin recharges
- Subscription fees
- Withdrawal fees (50 coins)
- Premium features

---

### 6.14 Broker Directory

**Overview:** Comprehensive forex broker comparison platform.

**Features:**
- **Broker Listings:** Directory of forex brokers
- **Broker Reviews:** User-submitted reviews
- **Rating System:** 5-star rating system
- **Scam Reports:** Report scam brokers
- **Broker Verification:** Admin verification badge
- **Comparison Tool:** Compare multiple brokers
- **Regulation Info:** Display regulatory bodies
- **Trading Info:** Platforms, spreads, leverage, min deposit
- **Logo Fetching:** Auto-fetch broker logos

**Broker Schema:**
- Name, website, logo
- Year founded
- Regulation (FCA, CySEC, ASIC, etc.)
- Trading platforms (MT4, MT5, cTrader, etc.)
- Spread type (fixed, variable)
- Minimum deposit
- Maximum leverage
- Overall rating
- Review count
- Scam report count

---

### 6.15 XP & Rank System

**Overview:** Gamified progression system with XP and ranks.

**Features:**
- **XP Earning:** Earn XP for platform activities
- **Rank Tiers:** Multiple rank levels (1-100)
- **Feature Unlocks:** Unlock features at higher ranks
- **Progress Tracking:** Track XP progress to next rank
- **Rank Badges:** Display rank badges on profile
- **Leaderboard:** XP leaderboard
- **Rank Rewards:** Bonus coins at rank milestones

**XP Earning Activities:**
- Create thread: 10 XP
- Reply to thread: 5 XP
- Publish content: 30 XP
- Receive review: 3 XP
- Get follower: 2 XP
- Daily login: 1 XP

**Rank Tiers:**
- Novice (1-9)
- Trader (10-19)
- Experienced (20-29)
- Expert (30-49)
- Master (50-79)
- Legend (80-100)

---

### 6.16 Real-time Notifications

**Overview:** In-app notification system.

**Features:**
- **Real-time Delivery:** Instant notifications via WebSocket
- **Notification Types:** Comments, likes, follows, purchases, system
- **Unread Count:** Badge with unread count
- **Mark as Read:** Individual or bulk mark as read
- **Notification Preferences:** Granular control over notification types
- **In-App Toasts:** Toast notifications for immediate alerts
- **Notification History:** View all past notifications
- **Delete Notifications:** Remove unwanted notifications

---

### 6.17 Onboarding System

**Overview:** Guided onboarding for new users.

**Features:**
- **Progress Tracking:** Track onboarding completion
- **Coin Rewards:** Earn coins for completing steps
- **Dismissible:** Users can skip onboarding
- **6-Step Process:**
  1. Upload profile picture (10 coins)
  2. Post first reply (5 coins)
  3. Submit 2 reviews (6 coins)
  4. Create first thread (10 coins)
  5. Publish first EA/content (30 coins)
  6. Get 50 followers (200 coins)

---

### 6.18 Referral System

**Overview:** Reward users for referring new members.

**Features:**
- **Referral Links:** Unique referral links per user
- **Referral Tracking:** Track who referred whom
- **Referral Rewards:** Earn coins for successful referrals
- **Multi-Tier:** Reward both referrer and referee
- **Referral Leaderboard:** Top referrers
- **Referral Stats:** View referral performance

---

### 6.19 Newsletter System

**Overview:** Email newsletter and marketing campaigns.

**Features:**
- **Newsletter Subscriptions:** Opt-in newsletter
- **Email Campaigns:** Send targeted campaigns
- **Audience Segmentation:** Target specific user groups
- **A/B Testing:** Test subject lines and content
- **Campaign Analytics:** Track opens, clicks, conversions
- **Unsubscribe Management:** One-click unsubscribe
- **Template Library:** Pre-built campaign templates

---

### 6.20 Audit & Compliance

**Overview:** Complete audit trail for compliance.

**Features:**
- **Immutable Logs:** Audit logs cannot be edited
- **Admin Action Tracking:** Log all admin actions
- **Moderation Logs:** Track content moderation
- **Financial Audit:** Complete financial transaction logs
- **User Activity Logs:** Track user actions
- **Export Capability:** Export logs for compliance
- **Retention Policy:** Configurable log retention
- **Access Control:** Role-based access to audit logs

---

## Conclusion

This documentation provides a comprehensive technical reference for the YoForex platform. For specific implementation details, refer to the source code in the following directories:

- **Frontend:** `app/` (Next.js App Router)
- **Backend:** `server/` (Express API)
- **Database Schema:** `shared/schema.ts` (Drizzle ORM)
- **Email Templates:** `server/services/emailService.ts`
- **Admin Dashboards:** `app/admin/`

For questions or contributions, please contact the development team.

---

**End of Documentation**
