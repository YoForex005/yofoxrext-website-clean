# YoForex - Expert Advisor Forum & Marketplace

## Overview
YoForex is a comprehensive trading community platform for forex traders, featuring forums, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy ("Sweets"). The platform aims to cultivate a self-sustaining ecosystem by rewarding user contributions, boosting retention through loyalty tiers, badges, AI nudges, and abandonment emails, and providing valuable trading tools and resources. Its business vision is to become a leading hub for forex traders, fostering engagement and providing essential trading resources and tools.

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
- **Coin Economy ("Sweets"):** Virtual currency with transaction history, expiration management, multi-layer fraud prevention, and a redemption marketplace.
- **Retention Dashboard System:** Loyalty tiers, badges, AI nudges, and abandonment emails to enhance user engagement.
- **Bot Economy System:** Automated bot system for natural engagement using Gemini AI, with wallet caps, daily budgets, and activity limits.
- **Error Tracking & Monitoring System:** Comprehensive capture of frontend and backend errors, smart grouping, and an admin dashboard for resolution.
- **AI-Powered SEO Content Suggestions:** Gemini AI integration for generating SEO-optimized meta descriptions, alt text, and H1 tags (admin-only, human approval, async processing).
- **Comprehensive Messaging System:** Private messaging (1-on-1 and group chats) with file attachments, reactions, read receipts, typing indicators, full-text search, privacy, spam prevention, and admin moderation. Real-time updates via WebSocket and Replit Object Storage.
- **Feature Flag System:** Enterprise-grade feature flag infrastructure for controlled rollouts, including tri-state status, in-memory caching, "Coming Soon" pages, and admin dashboard controls. This includes a robust Page Control System (ON/OFF/Coming Soon/Maintenance) with database storage, caching, API endpoints, Next.js middleware, dedicated page templates, and an admin UI.
- **Admin Analytics Dashboard:** Real-time analytics dashboard at `/admin/overview` with 8 KPI cards, interactive Recharts visualizations, React Query auto-refresh, and role-based access control.
- **User Management Admin Dashboard:** Comprehensive user management dashboard at `/admin/users` with admin-only access, featuring KPI cards, real-time search, advanced filtering, sorting, paginated data table, ban/unban functionality, CSV export, and URL param synchronization.
- **Marketplace Management Admin Dashboard:** Full-featured marketplace moderation dashboard at `/admin/marketplace` with admin-only access, featuring KPI cards, revenue trend chart, items table with pagination and filtering, approve/reject workflows, and email notifications to sellers.
- **Content Moderation Admin Dashboard:** Comprehensive forum content moderation system at `/admin/moderation` with admin-only access, featuring tab navigation, content type filtering, moderation queue table, approve/reject workflows with mandatory reasons, and immutable audit logging.
- **Security & Safety Admin Dashboard:** Enterprise-grade security monitoring and IP ban management system at `/admin/security` with admin-only access. Includes database tables for security events and IP bans, a centralized security service for event logging and auto-blocking, middleware for IP banning and login security, and admin API endpoints. The frontend features a 3-tab layout (Security Events, IP Bans, Security Metrics) with React Query auto-refresh, filterable tables, an add IP ban form, and KPI cards. Auto-blocking is triggered by 5 failed login attempts within 15 minutes, with severity escalation.
- **Communications Admin Dashboard (November 2, 2025):** Enterprise-grade announcement and email campaign management system at `/admin/communications` with admin-only access. Backend: Four database tables (announcements, emailCampaigns, emailDeliveries, announcementViews) with 11 indexes, 14 DrizzleStorage CRUD methods, communicationsService for announcement lifecycle (publish, schedule, expire, audience preview), campaignService for email delivery (send campaign, create deliveries, embed tracking pixels, update stats), 15 admin API endpoints (announcements CRUD, campaigns CRUD, audience preview, tracking), and public tracking routes (GET /track/email/:id.png for open tracking, GET /track/email/:id for click redirect). WebSocket integration via io.emit for real-time announcement broadcasts (announcement:published, campaign:sent events). Frontend: 2-tab shadcn layout (Announcements, Email Campaigns) with React Query auto-refresh (10s polling), dark theme styling. Announcements tab: Create/edit dialog with title, content, type selector (banner/modal/toast), audience targeting (role, coins, activity), scheduling (scheduledAt, expiresAt), table displaying title, type, audience, status (draft/scheduled/active/expired), views, clicks, created date, and actions (edit, delete, publish). Email Campaigns tab: Create/edit dialog with name, subject, HTML content editor, audience targeting, scheduling, table showing name, subject, recipients, opens, clicks, status (draft/scheduled/sending/sent/failed), created date, and actions (edit, delete, send). Audience targeting: JSONB storage with role filtering (member/admin), coin range (minCoins/maxCoins), activity filtering (lastActiveWithinDays). Tracking system: Unique trackingId per email delivery, tracking pixel (1x1 transparent PNG) increments opens count on load, click redirect logs clicks and forwards to target URL, delivery stats aggregation (sent/opened/clicked counts). Campaign delivery workflow: Create campaign → Validate audience → createCampaignDeliveries generates delivery records with tracking IDs → embedTrackingPixels adds pixel and link tracking to HTML → Queue emails via emailQueueService → Background worker sends emails → Tracking routes update delivery status → updateCampaignStats aggregates metrics. All mutations invalidate React Query cache for real-time UI updates. Rate limiting: Admin endpoints (20 req/min), tracking endpoints (500 req/min per IP). Real-time: WebSocket broadcasts on publish/send, React Query polling for table updates. Files: shared/schema.ts (4 tables, Zod schemas), server/storage.ts (14 methods), server/services/communicationsService.ts (6 functions), server/services/campaignService.ts (5 functions), server/routes.ts (15 endpoints), server/index.ts (WebSocket integration), app/admin/communications/page.tsx (2-tab UI).
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