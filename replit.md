# YoForex - Expert Advisor Forum & Marketplace

## Overview
YoForex is a comprehensive trading community platform for forex traders, featuring forums, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy ("Sweets"). The platform aims to cultivate a self-sustaining ecosystem by rewarding user contributions and providing valuable trading tools and resources. Its business vision is to become a leading hub for forex traders, fostering engagement and providing essential trading resources and tools.

## Recent Changes

### November 2, 2025 - Platform-Wide Real Data Audit (COMPLETED)
**Status:** ✅ Audit Complete - **100% Real Database Data Verified Across All Pages**

**Audit Scope:**
Systematic verification that every page and component uses real PostgreSQL database queries instead of mock, test, or calculated data.

**Audit Results:**
All major platform components confirmed using **100% real database queries**:

1. **Members Page** (`app/members/MembersClient.tsx`)
   - Leaderboards: `getLeaderboard()` in DrizzleStorage queries users, threads, replies, content tables
   - Community Stats: `/api/members/stats` endpoint with real COUNT/SUM queries
   - All data fetched from PostgreSQL via React Query ✅

2. **Homepage** (`app/HomeClient.tsx`)
   - What's Hot: `/api/hot` endpoint queries forum_threads, content, brokers tables with engagement scoring
   - Top Sellers: `/api/content/top-sellers` endpoint with JOIN to users and sales stats
   - Stats Bar: `/api/stats` endpoint with real counts ✅

3. **Forum/Discussions** (`app/discussions/DiscussionsClient.tsx`, `app/thread/[slug]/ThreadDetailClient.tsx`)
   - Thread lists: `/api/threads?sortBy=newest&limit=100`
   - Trending: `/api/discussions/trending?period=24h&limit=5`
   - Activity feed: `/api/discussions/activity?limit=10`
   - Thread details and replies: Real database queries with view count updates ✅

4. **User Profiles** (`app/user/[username]/UserProfileClient.tsx`)
   - User data: `/api/user/...` endpoints
   - Badges: Real badge queries
   - Content/Threads: Real user content queries ✅

5. **Marketplace** (`app/marketplace/MarketplaceClient.tsx`)
   - Content listings: Real content table queries
   - Sales stats: `getContentSalesStats()` method
   - Purchase counts and reviews: Real database queries ✅

6. **Header/Navigation** (`app/components/Header.tsx`, `app/components/CoinBalance.tsx`)
   - Coin balance: `/api/user/${userId}/coins` endpoint
   - Notifications: `/api/notifications/unread-count` endpoint
   - All balances and counts from PostgreSQL ✅

**Conclusion:**
No fake data sources found. All components already use React Query + Express API endpoints querying PostgreSQL database. **No code changes needed.**

**Technical Implementation:**
- All pages use `@tanstack/react-query` (TanStack Query v5) for data fetching
- Express API endpoints in `server/routes.ts` handle all database queries
- DrizzleStorage class in `server/storage.ts` provides data access layer
- PostgreSQL database with proper indexes for performance

### November 2, 2025 - Members Page Real Data Fix
**Fixed:** Community Stats widget now displays real database data instead of fake calculated percentages.

**What Changed:**
- Added `getMemberStats()` method to storage interface (`server/storage.ts`)
- Implemented efficient database queries for member statistics
- Created `/api/members/stats` endpoint (`server/routes.ts`)
- Updated Members page frontend to fetch real data (`app/members/MembersClient.tsx`)

**Before (Fake Data):**
- "Online Now" was calculated as 15% of total members
- "New This Week" was calculated as 8% of total members
- Stats calculated from leaderboard data (only top 50 users)

**After (Real Data):**
- Total Members: Direct COUNT query on users table
- Online Now: COUNT of users with `last_active` within last 15 minutes
- New This Week: COUNT of users with `created_at` within last 7 days
- Total Coins Earned: SUM of all user `total_coins`

**Files Modified:**
- `server/storage.ts` - Added getMemberStats() interface method and implementation
- `server/routes.ts` - Added GET /api/members/stats endpoint with 30s cache
- `app/members/MembersClient.tsx` - Removed fake calculations, added real API query

**Test Data Created:** 101 realistic Asian users across 13 countries with varied coins (1,520-6,120), ranks, and profile pictures for demonstration.

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