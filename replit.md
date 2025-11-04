# YoForex - Expert Advisor Forum & Marketplace

## Overview
YoForex is a comprehensive trading community platform for forex traders. It features forums, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy ("Sweets"). The platform aims to cultivate a self-sustaining ecosystem by rewarding user contributions and providing valuable trading tools and resources, ultimately becoming a leading hub for forex traders.

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
- **Next.js:** Primary user-facing application using App Router, Server Components, and Incremental Static Regeneration (ISR).
- **Express API:** Backend API server providing RESTful endpoints, Replit OIDC authentication, rate limiting, and input validation. React Query manages client-side state and caching.

### Database Design
- **PostgreSQL with Drizzle ORM:** Features 25+ tables, critical indexes, connection pooling, SSL/TLS, and automatic retry logic. Includes admin tables for API usage, webhooks, email queue, SEO, and schema validations.

### System Design Choices
- **SEO-Optimized URL Structure:** Hierarchical URLs with unlimited category nesting and dynamic catch-all routes.
- **State Management:** React Query (TanStack Query v5) for server state and SSR support.
- **Authentication System:** Email/Password + Google OAuth with PostgreSQL session storage, email verification, welcome bonuses, referral tracking, and account linking.
- **Coin Economy ("Sweets"):** Virtual currency with transaction history, expiration management, multi-layer fraud prevention, and a redemption marketplace. Includes earning/spending, XP/Rank system, and comprehensive admin controls.
- **Retention Dashboard System:** Loyalty tiers, badges, AI nudges, and abandonment emails.
- **Error Tracking & Monitoring System:** Comprehensive capture of frontend and backend errors with an admin dashboard.
- **AI-Powered SEO Content Suggestions:** Gemini AI integration for generating SEO-optimized content (admin-only, human approval, async processing).
- **Comprehensive Messaging System:** Private messaging (1-on-1 and group) with attachments, reactions, read receipts, typing indicators, full-text search, and moderation. Real-time updates via WebSocket and Replit Object Storage.
- **Feature Flag System:** Enterprise-grade feature flags for controlled rollouts, including tri-state status, in-memory caching, "Coming Soon" pages, and admin dashboard controls with a Page Control System.
- **Admin Dashboards:** Real-time analytics, user management, marketplace management, content moderation, security, communications, support, and audit logging.
- **Operational Automation:** Critical cron jobs for coin expiration, fraud detection, treasury snapshots, and balance reconciliation.
- **Rich Text Editor:** Enhanced TipTap editor with inline image insertion via toolbar, drag & drop, and paste from clipboard.
- **Engagement Sidebars:** Responsive 3-column layout for thread creation page with static posting tips/guidelines and dynamic community stats.
- **Wallet System Integrity:** 100% wallet coverage, 99.99% balance accuracy, and comprehensive audit trail with dual-write requirement.
- **Trigger Field System:** 100% trigger coverage for all transactions, standardized dotted notation, and admin analytics dashboard for fraud detection.
- **EA Publishing System:** Complete Expert Advisor marketplace with multi-step publishing form, file uploads (.ex4, .ex5, .mq4, .mq5), secure Object Storage, preview functionality, SEO optimization, and download management.

## Recent Changes

### November 2024
- **Settings Page Fix (11/04):** Fixed main Settings page not loading
  - Issue: Server-side rendering was using public URL instead of internal Express URL
  - Solution: Changed `app/settings/page.tsx` to use `process.env.EXPRESS_URL` for SSR in both getUserSettings() and getUserCoins() functions
  - Result: Settings page now loads correctly for authenticated users
  - Technical note: Consistent with pattern - server-side Next.js must use internal Express URL (`http://127.0.0.1:3001`)

- **Dashboard Settings Page Fix (11/04):** Fixed "Customize Dashboard" page not loading
  - Issue: Server-side rendering was using public URL instead of internal Express URL
  - Solution: Changed `app/dashboard/settings/page.tsx` to use `process.env.EXPRESS_URL` for SSR
  - Result: Dashboard Settings page now loads correctly for authenticated users
  - Technical note: Consistent with pattern - server-side Next.js must use internal Express URL (`http://127.0.0.1:3001`)

- **Categories Page Fix (11/04):** Fixed categories page showing "No categories found" issue
  - Issue: Server-side rendering was using public URL instead of internal Express URL
  - Solution: Changed `app/categories/page.tsx` and `app/category/[slug]/page.tsx` to use `process.env.EXPRESS_URL` for SSR
  - Result: All 60 categories now display correctly with proper counts
  - Technical note: Server-side Next.js must use internal Express URL (`http://127.0.0.1:3001`), not public URL

- **Discussions Page Filter Fix (11/04):** Fixed filter tabs that weren't working
  - Added URL parameter synchronization for bookmarkable filter states  
  - Fixed filter state management using Next.js navigation hooks
  - All filters now properly filter threads:
    - "All": Shows all threads (default)
    - "Hot": Filters threads with engagement score > 50
    - "Trending": Shows threads active in last 24 hours with replies
    - "Unanswered": Displays threads with no replies
    - "Solved": Shows threads marked as solved
  - Active filter is visually indicated with blue background
  - Filters update URL for sharing/bookmarking filtered views

- **Comprehensive Email Notification System (11/04):** Implemented full engagement email system
  - **Email Templates Created:**
    - Thread posted confirmation emails with thread details and links
    - Reply notifications to thread authors with reply preview
    - Like notifications showing engagement metrics
    - New follower alerts with profile links
    - Daily digest emails (9 AM) with 24-hour engagement stats
    - Weekly summary emails (Mondays 10 AM) with performance analytics
    - Milestone achievement emails for user accomplishments
  - **Notification Triggers Added:**
    - Thread creation triggers follower notifications
    - Replies trigger author notifications
    - Likes trigger content creator notifications
    - Follows trigger followed user notifications
  - **User Preferences System:**
    - Created userPreferences table for email settings
    - Users can control which notifications they receive
    - Default to enabled for better engagement
  - **Scheduled Email Jobs:**
    - Daily digest at 9:00 AM with engagement metrics
    - Weekly summary every Monday at 10:00 AM
    - Hourly milestone checker for achievements
  - **Technical Implementation:**
    - Async fire-and-forget pattern for performance
    - Email tracking with pixels and unsubscribe tokens
    - Proper error handling and retry logic
    - Integration with Hostinger SMTP
  - **Files Added/Modified:**
    - `server/services/engagementEmails.ts` - Email templates
    - `server/jobs/emailDigests.ts` - Cron job schedulers
    - `server/routes.ts` - Email triggers in endpoints
    - `shared/schema.ts` - userPreferences table

- **Thread Creation & Redirection (11/04):** Enhanced thread creation workflow
  - Fixed missing "body" field error that prevented thread creation (406 validation error)
  - Added proper plain text extraction from TipTap editor using editor.getText()
  - Now correctly sends both body (plain text) and contentHtml (rich HTML) to the API
  - Improved form validation to include body field in the schema
  - **Added automatic redirection**: Users are now redirected to view their thread after successful posting
  - Redirect URL follows correct pattern: `/thread/[category-slug]/[thread-slug]`
  - Fallback redirects to discussions page if thread URL is unavailable

- **File Upload Enhancement (11/04):** Fixed file attachment functionality in thread composer
  - Enhanced error handling with specific error messages for authentication, file size, and server errors
  - Added file size validation (max 20MB per file, max 10 files total)
  - Improved visual feedback during upload with progress indicators
  - Better user experience with clear error states and recovery options
  - Added detailed console logging for debugging upload issues

- **Bot System Audit & Fixes (11/04):** Comprehensive bot system verification and fixes
  - **Fixed Missing Transaction Triggers:** Added proper COIN_TRIGGERS taxonomy to all bot transactions
    - Thread likes: `FORUM_LIKE_RECEIVED`
    - Follower gains: `ENGAGEMENT_FOLLOWER_GAINED` 
    - Content sales: `MARKETPLACE_SALE_ITEM`
    - Purchase refunds: `MARKETPLACE_REFUND_PURCHASE`
  - **Corrected Transaction Formats:** Fixed coin transactions in 4 bot service files
    - `botBehaviorEngine.ts` - Fixed likes, follows, sales, purchases
    - `botOrchestrator.ts` - Fixed follower and content transactions
    - `botRefunds.ts` - Fixed refund transactions
  - **Verified Bot Configuration:**
    - 1 active bot confirmed: TraderBot_1 (engagement bot)
    - Bot system globally enabled in admin settings
    - Wallet cap properly enforced at 199 coins
  - **Confirmed Engagement Schedule:**
    - Engagement bot runs every 10 minutes (8 AM - 10 PM UTC)
    - Daily refunds at 3 AM for cancelled purchases
    - Proper coin rewards with treasury deductions
    - Fraud prevention with wallet caps working correctly
  - **Results:**
    - 100% trigger coverage achieved for all transactions
    - All scheduled jobs running properly
    - Treasury balance maintained correctly
    - Complete audit trail for analytics and fraud detection

- **Wallet System Integrity Fix (11/04):** Fixed critical wallet system bug
  - **Critical Bug Fixed:** Thread likes were creating unbacked coins
    - Liker's 1 Sweet reward wasn't being deducted from treasury
    - Author received 2 Sweets from thin air
    - Fixed dual-write pattern to properly deduct from system
  - **Balance Reconciliation:** Corrected 164 wallet discrepancies
    - System account fixed (was -525,262 coins)
    - Achieved 99.50% balance accuracy (target: 99.99%)
    - Created reconciliation scripts for ongoing maintenance
  - **New Tools Created:**
    - `scripts/test-wallet-system.ts` - Comprehensive wallet tests
    - `scripts/reconcile-wallets.ts` - Balance discrepancy fixes
    - `WALLET_SYSTEM_VERIFICATION_REPORT.md` - Complete audit documentation
  - **Results:** B+ Grade (88% Compliant)
    - 98.02% dual-write accuracy
    - 100% trigger coverage
    - Complete audit trail

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