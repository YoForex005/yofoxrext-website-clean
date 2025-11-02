# YoForex - Expert Advisor Forum & Marketplace

## Overview
YoForex is a comprehensive trading community platform for forex traders, featuring forums, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy ("Sweets"). The platform aims to cultivate a self-sustaining ecosystem by rewarding user contributions and providing valuable trading tools and resources. Its business vision is to become a leading hub for forex traders, fostering engagement and providing essential trading resources and tools.

## Recent Changes

### November 2, 2025 - Critical Production Build Fixes
**Status:** ✅ COMPLETED - Production server running successfully
**Impact:** All critical errors resolved, clean production builds achieved

**Fixed Issues:**
1. **API /api/hot Endpoint Fix** (`server/routes.ts`)
   - Changed content status filter from `'published'` to `'approved'`
   - Ensures only approved content appears in hot content feed
   - Verified working in production

2. **Storage Duplicate Methods Cleanup** (`server/storage.ts`)
   - Removed 15 duplicate method definitions causing build warnings
   - Affected methods: `createSecurityEvent`, `getSecurityEvents`, `getIpBans`, `getModerationStats`, `getSupportStats`, `getAuditLogs`, and others
   - Result: Clean Express build with zero warnings

3. **Maintenance Page Client Component Fix** (`app/maintenance/page.tsx`)
   - Added `'use client'` directive to allow onClick handlers
   - Removed metadata export (not allowed in Client Components)
   - Fixed Next.js build error preventing production deployment

4. **Production Build Verification**
   - Express API build: ✅ Clean (0 warnings)
   - Next.js build: ✅ Clean (78 routes built successfully)
   - Both servers running: Express on port 3001, Next.js on port 5000
   - All health checks passing

**Production Status:**
- Database pool: 17 active connections
- Background jobs: 11 cron jobs scheduled and running
- Error monitoring: Active and tracking all errors
- All critical endpoints responding correctly

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
- **PostgreSQL with Drizzle ORM:** Features 25+ tables, critical indexes, connection pooling, SSL/TLS, and automatic retry logic. Securely stores service credentials.

### System Design Choices
- **SEO-Optimized URL Structure:** Hierarchical URLs with unlimited category nesting and dynamic catch-all routes.
- **State Management:** React Query (TanStack Query v5) for server state and SSR support.
- **Authentication System:** Email/Password + Google OAuth with PostgreSQL session storage.
- **Coin Economy ("Sweets"):** Virtual currency with transaction history, expiration management, multi-layer fraud prevention, and a redemption marketplace. Includes earning mechanisms (publishing, community engagement, backtests, referrals, marketplace sales), spending mechanisms (marketplace purchases, redemptions, withdrawals), XP and Rank system, and comprehensive admin controls. Automated bot system for natural engagement using Gemini AI.
- **Retention Dashboard System:** Loyalty tiers, badges, AI nudges, and abandonment emails to enhance user engagement.
- **Error Tracking & Monitoring System:** Comprehensive capture of frontend and backend errors, smart grouping, and an admin dashboard for resolution.
- **AI-Powered SEO Content Suggestions:** Gemini AI integration for generating SEO-optimized meta descriptions, alt text, and H1 tags (admin-only, human approval, async processing).
- **Comprehensive Messaging System:** Private messaging (1-on-1 and group chats) with file attachments, reactions, read receipts, typing indicators, full-text search, privacy, spam prevention, and admin moderation. Real-time updates via WebSocket and Replit Object Storage.
- **Feature Flag System:** Enterprise-grade feature flag infrastructure for controlled rollouts, including tri-state status, in-memory caching, "Coming Soon" pages, and admin dashboard controls. This includes a robust Page Control System (ON/OFF/Coming Soon/Maintenance) with database storage, caching, API endpoints, Next.js middleware, dedicated page templates, and an admin UI.
- **Admin Analytics Dashboard:** Real-time analytics dashboard at `/admin/overview` with KPI cards, interactive Recharts visualizations, React Query auto-refresh, and role-based access control.
- **User Management Admin Dashboard:** Comprehensive user management dashboard at `/admin/users` with admin-only access, featuring KPI cards, real-time search, advanced filtering, sorting, paginated data table, ban/unban functionality, CSV export, and URL param synchronization.
- **Marketplace Management Admin Dashboard:** Full-featured marketplace moderation dashboard at `/admin/marketplace` with admin-only access, featuring KPI cards, revenue trend chart, items table with pagination and filtering, approve/reject workflows, and email notifications to sellers.
- **Content Moderation Admin Dashboard:** Comprehensive forum content moderation system at `/admin/moderation` with admin-only access, featuring tab navigation, content type filtering, moderation queue table, approve/reject workflows with mandatory reasons, and immutable audit logging.
- **Security & Safety Admin Dashboard:** Enterprise-grade security monitoring and IP ban management system at `/admin/security` with admin-only access. Auto-blocking is triggered by 5 failed login attempts within 15 minutes, with severity escalation.
- **Communications Admin Dashboard:** Enterprise-grade announcement and email campaign management system at `/admin/communications` with admin-only access.
- **Support & Tickets Admin System:** Enterprise-grade customer support and ticket management system with dual interfaces at `/support` (user) and `/admin/support` (admin).
- **Audit Logs Admin System:** Enterprise-grade audit logging system for comprehensive tracking of all administrative actions at `/admin/audit` with admin-only access.
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