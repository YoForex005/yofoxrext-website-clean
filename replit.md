# YoForex - Expert Advisor Forum & Marketplace

## Overview
YoForex is a comprehensive trading community platform for forex traders, offering forums, an Expert Advisor (EA) marketplace, broker reviews, and a virtual coin economy ("Sweets"). Its primary purpose is to foster a self-sustaining ecosystem by rewarding user contributions and providing valuable trading tools and resources, aiming to become a leading hub for forex traders.

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

### 2025-11-05 - Fixed Thread Creation React Error #418
- **Issue**: React error #418 occurred when writing threads and clicking next button
- **Root Cause**: Bare text string "Free" was being rendered without proper JSX wrapping in attachment pricing display
- **Solution**: Wrapped the text in a React Fragment (<>Free</>) to properly render the text node
- **Result**: Thread creation form now works properly without any text rendering errors

### 2025-11-05 - Production Deployment Completed
- **Deployment Success**: Successfully deployed application to production mode
- **Fixed Build Issues**: Resolved Next.js 16 production build errors by adding Suspense boundaries
  - Fixed `/messages` page useSearchParams() issue with comprehensive loading fallback
  - Fixed `/discussions` page useSearchParams() issue with skeleton UI
- **Production Configuration**:
  - Express API running on port 3001 (internal)
  - Next.js frontend running on port 5000 (user-facing, bound to 0.0.0.0)
  - All background jobs and cron tasks active
  - Database connection pool working with optimization
  - WebSocket support enabled for real-time features
- **Result**: Application now runs in full production mode with all features active

### 2025-11-05 - Fixed Thread Creation Infinite Loop  
- **Critical Bug Fix**: Resolved React "Maximum update depth exceeded" error preventing thread creation
- **Root Cause**: Hashtag management functions were calling `form.watch()` inside `setValue()` operations, creating reactive dependency loops
- **Solution Details**:
  - Replaced `form.watch("hashtags")` with `form.getValues("hashtags")` in `addHashtag()` and `removeHashtag()` functions
  - This breaks the reactive chain that was causing infinite re-renders
  - Fixed validation helper to properly handle watched values without causing loops
- **Best Practice Established**: Never use `watch()` inside functions that call `setValue()` - use `getValues()` instead for reading current values during updates
- **Result**: Thread creation form now works correctly without infinite loop errors

### 2025-11-05 - Updated Publish EA Navigation Links
- **UX Improvement**: Changed all "Publish EA" links to go directly to publishing form
- **Files Updated**:
  - `Header.tsx`: Desktop and mobile navigation links
  - `MarketplaceClient.tsx`: Hero section and empty state buttons
  - `best-forex-ea/page.tsx`: Submit Your EA button
  - `ea/[slug]/EADetailClient.tsx`: Back button text improved
- **Old Behavior**: Links went to `/publish-ea` (marketplace listing page)
- **New Behavior**: Links go directly to `/publish-ea/new` (publishing form)
- **Result**: Users save a click and go straight to creating their EA listing

### 2025-11-06 - Transformed Marketplace UI with Modern Design
- **Major UI Overhaul**: Completely redesigned marketplace interface with modern, visually appealing components
- **Hero Section**: Created vibrant gradient background (indigo → purple → pink) with glassmorphism stats cards
- **Product Cards**: 
  - Switched from dark theme to bright white cards with shadows
  - Added hover effects with scale animations and quick action buttons
  - Implemented gradient overlays and visual depth
  - Enhanced product image display with proper aspect ratios
- **Visual Enhancements**:
  - Color-coded category badges with unique icons (Expert Advisors, Indicators, Templates, etc.)
  - Gradient-based pricing badges (green for free, gold gradient for paid)
  - Shimmer loading skeletons with animation effects
  - Star rating system with visual feedback
  - Smooth micro-animations throughout
- **Improved Layout**: Clean grid system with proper spacing, enhanced search/filter controls, responsive design
- **Result**: Marketplace now features a premium, professional appearance that encourages browsing and purchasing

### 2025-11-06 - Fixed Image Upload Issues on EA Publishing Page
- **Critical Bug Fix**: Resolved upload failures for all image types in EA publishing form
- **Root Cause**: FormData field name mismatch - client sending 'file' but server expecting 'files' (plural)
- **Solution**: Updated all upload functions to use 'files' field name and correct response handling
- **Fixed Components**:
  - Description editor inline image upload (TipTap editor)
  - EA file upload (.ex4, .ex5, .mq4, .zip files)
  - Screenshot upload (5 image slots)
- **Code Changes**: Modified `app/publish-ea/new/PublishEAFormClient.tsx` - changed FormData field from 'file' to 'files' and updated response handling to use `data.urls[0]`
- **Result**: All upload functionality now works correctly for authenticated users

### 2025-11-06 - Removed Duplicate Thread Creation Route
- **Issue Fixed**: Removed duplicate `/threads/create` route to maintain single source of truth
- **Changes Made**:
  - Deleted `/app/threads/create` folder and its page component
  - Updated all navigation links in Header.tsx to use `/discussions/new`
  - Consolidated thread creation to single route: `/discussions/new`
- **Result**: Cleaner routing structure with no duplicate pages

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
- **Coin Economy ("Sweets"):** Virtual currency with transaction history, expiration management, multi-layer fraud prevention, earning/spending, XP/Rank system, and comprehensive admin controls.
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
- **Marketplace UI:** Modern, visually appealing design with vibrant gradients, glassmorphism stats cards, bright product cards with hover effects, color-coded category badges, gradient pricing badges, shimmer loading skeletons, star ratings, and smooth micro-animations.

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