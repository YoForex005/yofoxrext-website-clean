# YoForex - Expert Advisor Forum & Marketplace

## Overview
YoForex is a comprehensive trading community platform for forex traders, featuring forums, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy ("Sweets"). The platform aims to cultivate a self-sustaining ecosystem by rewarding user contributions, boosting retention through loyalty tiers, badges, AI nudges, and abandonment emails, and providing valuable trading tools and resources.

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
- **Next.js:** Primary user-facing application utilizing App Router, Server Components, and Incremental Static Regeneration (ISR) for SEO and dynamic routing.
- **Express API:** Backend API server providing RESTful endpoints, Replit OIDC authentication, rate limiting, and input validation. React Query manages client-side state and caching.

### Database Design
- **PostgreSQL with Drizzle ORM:** Features 25+ tables, critical indexes, connection pooling, SSL/TLS, and automatic retry logic. Securely stores service credentials.

### System Design Choices
- **SEO-Optimized URL Structure:** Hierarchical URLs with unlimited category nesting and dynamic catch-all routes.
- **State Management:** React Query (TanStack Query v5) for server state and SSR support.
- **Authentication System:** Email/Password + Google OAuth with PostgreSQL session storage.
- **Coin Economy ("Sweets"):** Virtual currency with transaction history, expiration management, multi-layer fraud prevention, and a redemption marketplace. Includes authentication-gated UI and API routes.
- **Production Deployment:** One-command deployment to Replit or full control via AWS EC2/VPS using Docker, PM2, Nginx, and Let's Encrypt.
- **Zero-Touch Migration System:** Automated GitHub import for fresh Replit database setup.
- **Retention Dashboard System:** Loyalty tiers, badges, AI nudges, and abandonment emails to enhance user engagement.
- **Bot Economy System:** Automated bot system for natural engagement (likes, follows, purchases, forum replies) using Gemini AI, with wallet caps, daily budgets, and activity limits. Bots are excluded from user-facing metrics.
- **Error Tracking & Monitoring System:** Comprehensive capture of frontend and backend errors, smart grouping, admin dashboard for resolution, and production hardening fixes.
- **AI-Powered SEO Content Suggestions:** Gemini AI integration for generating SEO-optimized meta descriptions, alt text, and H1 tags (admin-only, human approval, async processing).
- **Comprehensive Messaging System:** Private messaging (1-on-1 and group chats) with file attachments, reactions, read receipts, typing indicators, full-text search, privacy, spam prevention, and admin moderation. Real-time updates via WebSocket and Replit Object Storage.
- **Feature Flag System:** Enterprise-grade feature flag infrastructure for controlled rollouts, including tri-state status, in-memory caching, SEO-optimized "Coming Soon" pages, and admin dashboard controls. This includes a robust Page Control System (ON/OFF/Coming Soon/Maintenance) with database storage, caching, API endpoints, Next.js middleware, dedicated page templates, and an admin UI.
- **Admin Analytics Dashboard:** Real-time analytics dashboard at `/admin/overview` with 8 KPI cards (users, content, revenue, transactions, forum stats, broker reviews), interactive Recharts visualizations (User Growth AreaChart, Content Trend BarChart, Revenue Breakdown PieChart), React Query auto-refresh (60s), role-based access control (admin/superadmin only), responsive grid layout, loading/error/empty states, and dark theme styling. Four backend API endpoints: `/api/admin/analytics/stats`, `/api/admin/analytics/user-growth`, `/api/admin/analytics/content-trends`, `/api/admin/analytics/revenue`.
- **User Management Admin Dashboard:** Comprehensive user management dashboard at `/admin/users` with admin-only access, featuring 4 KPI cards (Total Users, Avg Reputation, Avg Coins, Banned Count), real-time search with 300ms debounce, advanced filtering (role, status, auth method), sorting options, paginated data table with columns (User, Email, Role, Auth, Status, Last Login, Actions), ban/unban functionality with confirmation modal and reason tracking, CSV export with current filters, URL param synchronization for shareable links, role-based access control, rate limiting (10 ban ops/minute), audit logging in adminActions table. Four backend API endpoints: `/api/admin/users`, `/api/admin/users/:userId`, `/api/admin/users/:userId/ban`, `/api/admin/users/export/csv`.
- **Marketplace Management Admin Dashboard:** Full-featured marketplace moderation dashboard at `/admin/marketplace` with admin-only access, featuring 3 KPI cards (Total Items, Total Sales, Total Revenue with weekly trends), 30-day revenue trend chart (Recharts LineChart), marketplace items table with pagination and filtering (search by title/seller, category filter, status filter, price range filter), approve/reject workflows with confirmation dialogs and rejection reason tracking, top 5 selling items and top 5 vendors sections, email notifications to sellers on approval/rejection, audit logging in adminActions table, rate limiting (20 approve/reject ops/minute), stats cache invalidation on mutations, dark theme styling. Seven backend API endpoints: `/api/admin/marketplace/stats`, `/api/admin/marketplace/revenue-trend`, `/api/admin/marketplace/items`, `/api/admin/marketplace/approve/:itemId`, `/api/admin/marketplace/reject/:itemId`, `/api/admin/marketplace/top-sellers`, `/api/admin/marketplace/top-vendors`. Marketplace item lifecycle: User uploads → Pending status → Admin approves/rejects → Approved items visible in public marketplace → Email notifications sent → Audit logs created.
- **Operational Automation:** Critical cron jobs for coin expiration, fraud detection, treasury snapshots, and balance reconciliation.

## External Dependencies

### Core Infrastructure
- **Neon PostgreSQL:** Serverless database.
- **Replit Object Storage:** Persistent file storage (for message attachments).
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
- **Google Cloud Storage:** Object storage backend (general storage).

### Development Tools
- **Drizzle Kit:** Database migrations.
- **TypeScript:** Type safety.
- **shadcn/ui:** Component library.
- **TailwindCSS:** Utility-first CSS framework.
- **Recharts:** Composable charting library for React (admin analytics visualizations).
- **Zod:** Runtime schema validation.
- **Vitest:** Testing framework.
- **Supertest:** API integration testing.
- **socket.io & socket.io-client:** WebSocket communication.

### Build & Deployment
- **Next.js 16:** React framework.
- **esbuild:** Express API bundling.
- **Docker:** Containerization.