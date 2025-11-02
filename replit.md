# YoForex - Expert Advisor Forum & Marketplace

## Overview
YoForex is a comprehensive trading community platform for forex traders, featuring forums, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy ("Sweets"). The platform aims to cultivate a self-sustaining ecosystem by rewarding user contributions and providing valuable trading tools and resources. Its business vision is to become a leading hub for forex traders, fostering engagement and providing essential trading resources and tools.

## User Preferences
### Communication Style
- Use simple, everyday language
- Avoid technical jargon when explaining to user
- Be concise and clear

### Task Execution Workflow (CRITICAL - ALWAYS FOLLOW)

**When starting ANY new work session:**

1. **Error Dashboard Check (MANDATORY FIRST STEP)**
   - **ALWAYS** check error monitoring dashboard at `/admin/errors` BEFORE starting ANY new task
   - Review all unsolved/active errors first (check database and admin panel)
   - Fix ALL critical and high-severity errors before proceeding with new work
   - Verify no TypeScript errors, routing errors, API errors, database errors, or connection issues
   - Check ALL logs: frontend console logs, backend Express logs, Next.js build logs
   - Review error categories: Unsolved, Solved, To-Be-Solved
   - Document all fixes in the task list
   - **This ensures system stability before adding new features or making changes**
   - **NEVER skip this step - ALL errors must be resolved first before starting new work**

**When receiving a new task:**

2. **Deep Analysis Phase**
   - Think thoroughly about the task before starting
   - Consider all edge cases and implications
   - Identify potential challenges upfront

3. **Planning Phase (MANDATORY)**
   - Call `architect` tool with `responsibility: "plan"` to get strategic guidance
   - Break down complex tasks into clear, logical subtasks
   - Create comprehensive plan with dependencies identified
   - Document the approach before implementation

4. **Delegation Phase**
   - Use `start_subagent` for complex, multi-step subtasks
   - Provide clear context and success criteria to subagents
   - Ensure subagents have all necessary file paths and context

5. **Autonomous Execution**
   - **DO NOT ask user for confirmation mid-task**
   - Work through entire task list to completion
   - Handle errors and obstacles independently
   - Only return to user when task is 100% complete or genuinely blocked

6. **Documentation Phase (MANDATORY)**
   - Update replit.md regularly during work
   - Document what was changed and why
   - Keep documentation clean, organized, and current
   - Remove outdated information
   - Add completion dates to major changes

7. **Review Phase (BEFORE COMPLETION)**
   - Call `architect` with `responsibility: "evaluate_task"` to review all work
   - Fix any issues architect identifies
   - Only mark tasks complete after architect approval

### Documentation Standards

- **Update Frequency:** After each major change
- **Keep Clean:** Remove outdated/deprecated information
- **Be Specific:** Include file paths, dates, and reasons for changes
- **Section Organization:** Recent Changes should list newest first with dates

## Recent Changes

### November 2, 2025: Thread Creation Engagement Sidebars & Error Monitoring Fixes

**Thread Creation Page Enhancement:**
- **Issue**: Thread creation page was bare - only showing header, form, and footer without any engagement elements
- **Solution**: Implemented responsive 3-column layout with engaging sidebars
- **Features Added**:
  - **Left Sidebar (280px)**: Static engagement content
    - Posting Tips (4 actionable tips)
    - Formatting Shortcuts (keyboard shortcuts guide)
    - Community Guidelines reminder
  - **Right Sidebar (320px)**: Dynamic community data
    - Community Stats (156 active users, 4 threads today, 27 total threads, 60 categories)
    - Trending Threads (top threads by views in last 24 hours)
    - Popular Categories (categories ranked by thread count)
    - Recent Activity (latest thread creations)
  - **Responsive Design**: Sidebars hidden on mobile (<lg), visible on desktop
  - **Sticky Positioning**: `lg:sticky lg:top-[88px]` for optimal UX
- **New API Endpoints**:
  - `GET /api/forum/trending?hours=24&limit=7` - Trending threads by views
  - `GET /api/forum/popular-categories?limit=5` - Categories with thread counts
  - `GET /api/forum/recent-activity?limit=10` - Recent thread activity
  - `GET /api/forum/stats` - Community statistics
- **New Storage Methods**: `listTrendingThreads()`, `listPopularCategories()`, `listRecentThreadActivity()`, `getCommunityStats()`
- **Technical Implementation**: Fixed Drizzle ORM SQL syntax errors by using raw SQL queries for complex aggregations
- **Files Created**:
  - `app/discussions/new/LeftEngagementSidebar.tsx` - Static tips and guidelines
  - `app/discussions/new/RightEngagementSidebar.tsx` - Dynamic data with React Query
- **Files Modified**:
  - `app/discussions/new/EnhancedThreadComposeClient.tsx` - 3-column grid layout
  - `server/storage.ts` - Added 4 new sidebar data methods
  - `server/routes.ts` - Added 4 new sidebar API endpoints

**Error Monitoring System Fixes:**
- **Issue**: Error dashboard showed 0 active errors despite 15 errors in database
- **Solution**: Fixed authentication middleware chain for all 8 error monitoring endpoints
- **Changes**:
  - Updated endpoints to use proper `isAdminMiddleware` instead of manual role checks
  - Extended auto-resolve timeout from 1 hour to 7 days to prevent premature resolution
  - All error endpoints now return proper 200 responses with data
- **Impact**: Error monitoring dashboard now correctly displays all 15 active errors

### November 2, 2025: Critical Wallet System Backfill & Trigger Field Enhancements

**Wallet System 100% Drift Fixed (Production-Ready):**
- **Issue**: user_wallet table was 56% empty - only 87/196 users had wallet records, causing 100% balance drift (348,290 coins)
- **Solution**: Executed comprehensive backfill using `backfillOpeningBalances()` method
- **Results**: 
  - Created 197 wallet records (100% coverage including system account)
  - Fixed 59 users with missing journal entries
  - Reduced drift from 348,290 coins to only 21 coins (3 users, 0.004%)
  - 99.99% balance accuracy achieved
- **Files Created**:
  - `scripts/verify-wallet-integrity.ts` - Ongoing health check script
  - `scripts/fix-missing-journal-entries.ts` - Journal entry creation script
  - `docs/WALLET_SYSTEM_DOCUMENTATION.md` - Complete dual-write system guide
  - `docs/WALLET_BACKFILL_EXECUTION_REPORT.md` - Execution report with metrics
- **Critical Architecture**: Dual-write requirement - both `users.total_coins` AND `user_wallet.balance` must be updated together at every transaction point

**Trigger Field System Enhancements (100% Coverage Verified):**
- **Issue**: Initial report suggested all transactions missing trigger data
- **Audit**: Database revealed 100% trigger coverage (97/97 transactions have valid triggers)
- **Enhancements**:
  - Added 8 new trigger types to taxonomy (treasury.withdraw.rejected, marketplace.sale.item, etc.)
  - Standardized all triggers to dotted notation: `{domain}.{action}.{result}`
  - Fixed incorrect trigger values in routes.ts and storage.ts
  - Created admin trigger analytics dashboard (TriggerStatsCard component)
- **Files Modified**:
  - `shared/schema.ts` - Enhanced trigger taxonomy
  - `server/routes.ts` - Fixed triggers + added `/api/admin/finance/trigger-stats` endpoint
  - `server/storage.ts` - Standardized trigger values
  - `app/admin/finance/page.tsx` - Added trigger statistics
  - `app/components/admin/finance/TriggerStatsCard.tsx` - NEW analytics component
  - `app/hooks/useTriggerStats.ts` - NEW data hook
- **Fraud Detection**: Admin can now track earning patterns by source for fraud detection

**System Health:**
- ✅ 100% wallet coverage (197/197 users)
- ✅ 100% trigger coverage (all transactions tracked)
- ✅ 99.99% balance accuracy (21 coins drift across 3 users)
- ✅ Complete audit trail via coin_ledger_transactions and coin_journal_entries
- ✅ System account properly balances all user credits (-525,262 coins)

## System Architecture

YoForex employs a hybrid frontend and a robust backend for scalability and performance.

### Hybrid Frontend Architecture
- **Next.js:** Primary user-facing application using App Router, Server Components, and Incremental Static Regeneration (ISR) for SEO and dynamic routing.
- **Express API:** Backend API server providing RESTful endpoints, Replit OIDC authentication, rate limiting, and input validation. React Query manages client-side state and caching.

### Database Design
- **PostgreSQL with Drizzle ORM:** Features 25+ tables, critical indexes, connection pooling, SSL/TLS, and automatic retry logic. Admin database schema with 5 new tables for API usage, webhooks, email queue, SEO pages, and schema validations.

### System Design Choices
- **SEO-Optimized URL Structure:** Hierarchical URLs with unlimited category nesting and dynamic catch-all routes.
- **State Management:** React Query (TanStack Query v5) for server state and SSR support.
- **Authentication System:** Email/Password + Google OAuth with PostgreSQL session storage. Features email verification, welcome bonuses, referral tracking, and account linking.
- **Coin Economy ("Sweets"):** Virtual currency with transaction history, expiration management, multi-layer fraud prevention, and a redemption marketplace. Includes earning/spending mechanisms, XP and Rank system, and comprehensive admin controls. Automated bot system for natural engagement.
- **Retention Dashboard System:** Loyalty tiers, badges, AI nudges, and abandonment emails.
- **Error Tracking & Monitoring System:** Comprehensive capture of frontend and backend errors with an admin dashboard for resolution.
- **AI-Powered SEO Content Suggestions:** Gemini AI integration for generating SEO-optimized meta descriptions, alt text, and H1 tags (admin-only, human approval, async processing).
- **Comprehensive Messaging System:** Private messaging (1-on-1 and group chats) with file attachments, reactions, read receipts, typing indicators, full-text search, privacy, spam prevention, and admin moderation. Real-time updates via WebSocket and Replit Object Storage.
- **Feature Flag System:** Enterprise-grade feature flag infrastructure for controlled rollouts, including tri-state status, in-memory caching, "Coming Soon" pages, and admin dashboard controls, with a robust Page Control System.
- **Admin Dashboards:** Real-time analytics, user management, marketplace management, content moderation, security & safety, communications, support & tickets, and audit logging dashboards.
- **Operational Automation:** Critical cron jobs for coin expiration, fraud detection, treasury snapshots, and balance reconciliation.

## External Dependencies

### Core Infrastructure
- **Neon PostgreSQL:** Serverless database.
- **Replit Object Storage:** Persistent file storage.
- **Replit OIDC:** OAuth authentication provider.

### Email Services
- **Hostinger SMTP:** Transactional email delivery.

### Analytics & SEO
- **Google Tag Manager:** Tag management.
- **Google Analytics 4:** User tracking.
- **Google Search Console, Bing Webmaster Tools, Yandex Webmaster:** SEO monitoring.
- **Google PageSpeed Insights API:** Performance monitoring.
- **Gemini AI:** AI-powered content suggestions and bot engagement.

### CDN & Storage
- **Google Cloud Storage:** Object storage backend.

### Development Tools
- **Drizzle Kit:** Database migrations.
- **TypeScript:** Type safety.
- **shadcn/ui:** Component library.
- **TailwindCSS:** Utility-first CSS framework.
- **Recharts:** Composable charting library for React.
- **Zod:** Runtime schema validation.
- **Vitest:** Testing framework.
- **Supertest:** API integration testing.
- **socket.io & socket.io-client:** WebSocket communication.

### Build & Deployment
- **Next.js 16:** React framework.
- **esbuild:** Express API bundling.
- **Docker:** Containerization.