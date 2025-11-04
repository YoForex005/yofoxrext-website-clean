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

### November 4, 2025 - Fixed TipTap Editor with Inline Image Rendering
- **Fixed Keyboard Shortcuts in TipTap Editor:** 
  - Configured all keyboard shortcuts properly (Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline, etc.)
  - Added explicit keyboard bindings to TipTap extensions
  - Shortcuts now work correctly as displayed in the UI
- **Fixed Inline Image Rendering (Visual Display):**
  - Enhanced Image extension to render images as visual elements, not markdown text
  - Images now display inline with rounded corners, shadows, and hover effects
  - Added support for drag & drop images directly into editor
  - Enabled paste from clipboard (Ctrl+V) for quick image insertion
  - Created simplified `/api/upload/simple` endpoint for reliable uploads
  - Images properly inserted as image nodes with alt and title attributes
  - Content sanitization preserves all image attributes when saving
- **Result:** Thread creation editor fully functional with rich text and visual inline images

### November 4, 2025 - Fixed All TypeScript Errors
- **Resolved 323 TypeScript Errors:**
  - Fixed 68 errors in server/routes.ts
  - Fixed 255 errors in server/storage.ts
  - Added all missing type imports to schema.ts
  - Fixed coin transaction validations with required channel/trigger fields
  - Enhanced type safety with `getAuthenticatedUserId(req)` helper
  - Fixed User type mismatches with missing properties
- **Result:** Codebase now fully type-safe with zero TypeScript errors

### November 4, 2025 - Fixed Critical EA Publishing and Detail Page Issues
- **Fixed EA Detail Page 404 Errors:** Corrected API endpoint URLs from `/api/content/by-slug/` to `/api/content/slug/` to match backend routes
- **Fixed "Publish New EA" Page Infinite Loading:** 
  - Removed complex authentication state management that caused infinite loading loops
  - Simplified component to render immediately without waiting for multiple state updates
  - Page now properly shows authentication prompt for unauthenticated users
  - Eliminated hydration mismatch issues by removing client-side only state checks
- **Fixed Next.js 15+ Params Handling:** Updated EA pages to properly await params Promise for SSR compatibility
- **Fixed TypeScript Errors:** Added proper type annotations to editor component event handlers
- **Result:** All EA features now working correctly - listing, detail views, and publishing form

### November 4, 2025 - Fixed Like Button Not Showing on Thread Replies
- **Fixed Field Name Mismatch:** Changed from `helpfulCount` to `helpful` to match backend field name
- **Implemented Optimistic Updates:** Likes now show immediately without page reload
- **Added Like Tracking:** Added state management to track which replies user has liked
- **Visual Feedback:** Added filled thumbs up icon and color highlighting for liked replies
- **Files Changed:** `app/thread/[...slug]/ReplySection.tsx`
- **Result:** Like button now provides instant feedback and properly tracks like status

### November 4, 2025 - Fixed All Navigation Issues from Recent Discussions Page
- **Fixed Thread Navigation Links:** Updated all thread links to use `/thread/[categorySlug]/[threadSlug]` format
  - Main discussion grid cards now navigate correctly
  - Trending Now section links work properly
  - Recent Activity items link to correct thread pages
- **Backend API Updates:** 
  - Activity feed endpoint now includes `threadSlug` and `categorySlug` fields
  - Thread slug route extracts thread slug from full path correctly
- **Files Changed:** `app/discussions/DiscussionsClient.tsx`, `server/routes.ts`
- **Result:** All navigation from Recent Discussions page now works correctly for existing threads

### November 4, 2025 - Fixed Thread Reply Validation Issue
- **Reduced Reply Minimum Character Requirement:** Changed from 10 to 3 characters in `shared/schema.ts`
  - Users can now post short replies like "Yes", "No", "OK", etc.
  - Prevents validation errors that were blocking legitimate short responses
  - Maintains anti-spam protection while allowing common brief responses

### November 4, 2025 - Broker Reviews Coming Soon Page
- **Replaced Broker Reviews with Coming Soon Page:** Temporarily replaced the broker directory with an engaging Coming Soon page
  - Preserved original broker directory code in `app/brokers/page.backup.tsx` for future restoration
  - Created professional Coming Soon page with header, footer, and email notification signup
  - Added feature preview grid showcasing upcoming broker review capabilities
  - Included timeline and statistics to maintain user engagement
  - Files changed: `app/brokers/page.tsx`, `app/brokers/BrokersComingSoonClient.tsx`

### November 4, 2025 - Thread Page 404 Fix
- **Fixed Thread Page Connectivity Issue:** Resolved 503 errors when accessing thread pages
  - Thread page was using wrong Express URL configuration causing server-side rendering failures
  - Updated `app/thread/[...slug]/page.tsx` to use `getInternalApiUrl()` from api-config module
  - Created test thread "test-something-good" to verify functionality
  - Thread pages now load correctly with all data fetched successfully

### November 4, 2025 - Category Navigation Fix
- **Implemented Fuzzy Slug Matching:** Added intelligent category slug matching using Levenshtein distance
  - New `/api/categories/find/:slug` endpoint handles slug variations (e.g., "ea" vs "eas", singular vs plural)
  - Category pages now redirect to correct slugs when similar ones are accessed
  - Eliminated 404 errors when users click category links with minor slug differences
  - Enhanced not-found page with category suggestions
  - Files changed: `server/routes.ts`, `app/category/[slug]/page.tsx`, `lib/utils/levenshtein.ts`

### November 4, 2025 - Fixed Marketplace Product Navigation
- **Fixed "Content Not Found" Error on Product Pages:** Resolved critical issue where clicking any marketplace product card showed error page
  - Root cause: Content page was using incorrect API URL for server-side rendering (`localhost:5000` instead of internal API URL)
  - Fixed by importing and using `getInternalApiUrl()` from centralized API configuration
  - Removed problematic redirect logic that was trying to use non-existent hierarchical category URLs
  - Product pages now fetch and display all data correctly including author info, reviews, and similar products
  - Files changed: `app/content/[slug]/page.tsx`
  - Result: All marketplace products now load properly with complete details and specifications

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