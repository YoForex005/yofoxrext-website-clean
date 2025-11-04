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

## Recent Changes

### November 4, 2025 - Category Navigation Fix
- **Implemented Fuzzy Slug Matching:** Added intelligent category slug matching using Levenshtein distance
  - New `/api/categories/find/:slug` endpoint handles slug variations (e.g., "ea" vs "eas", singular vs plural)
  - Category pages now redirect to correct slugs when similar ones are accessed
  - Eliminated 404 errors when users click category links with minor slug differences
  - Enhanced not-found page with category suggestions
  - Files changed: `server/routes.ts`, `app/category/[slug]/page.tsx`, `lib/utils/levenshtein.ts`

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