import { db } from "../server/db";
import {
  users,
  supportTickets,
  ticketMessages,
  coinTransactions,
  withdrawalRequests,
  announcements,
  emailCampaigns,
  emailDeliveries,
  securityEvents,
  auditLogs,
  apiKeys,
  apiKeyUsage,
  webhookEvents,
  webhooks,
  seoPages,
  schemaValidations,
  performanceMetrics,
  content,
  forumThreads,
} from "../shared/schema";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("🌱 Starting comprehensive admin demo seed...");

  try {
    // ==================== 0. CLEANUP EXISTING DEMO DATA ====================
    // Skip cleanup - use unique IDs instead
    console.log("ℹ️  Using timestamp-based IDs to avoid conflicts");

    // ==================== 1. USERS ====================
    console.log("👥 Seeding users...");
    
    const adminPassword = await bcrypt.hash("admin123", 10);
    const userPassword = await bcrypt.hash("user123", 10);

    const timestamp = Date.now();
    const seedUsers = await db.insert(users).values([
      {
        id: `demo-admin-${timestamp}`,
        username: `DemoAdmin${timestamp}`,
        email: `demoadmin${timestamp}@yoforex.net`,
        password: adminPassword,
        role: "super_admin",
        firstName: "Admin",
        lastName: "User",
        totalCoins: 10000,
        location: "United States",
        status: "active",
      },
      {
        id: `demo-mod1-${timestamp}`,
        username: `DemoModJohn${timestamp}`,
        email: `demomod1-${timestamp}@yoforex.net`,
        password: adminPassword,
        role: "moderator",
        firstName: "John",
        lastName: "Moderator",
        totalCoins: 5000,
        location: "United Kingdom",
        status: "active",
      },
      {
        id: `demo-mod2-${timestamp}`,
        username: `DemoModSarah${timestamp}`,
        email: `demomod2-${timestamp}@yoforex.net`,
        password: adminPassword,
        role: "moderator",
        firstName: "Sarah",
        lastName: "Wilson",
        totalCoins: 4500,
        location: "Canada",
        status: "active",
      },
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `demo-user${i + 1}-${timestamp}`,
        username: `demotrader${i + 1}-${timestamp}`,
        email: `demotrader${i + 1}-${timestamp}@example.com`,
        password: userPassword,
        role: "member" as const,
        firstName: ["Alice", "Bob", "Charlie", "David", "Emma", "Frank", "Grace", "Henry", "Ivy", "Jack"][i],
        lastName: ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"][i],
        totalCoins: Math.floor(Math.random() * 5000) + 500,
        location: ["USA", "UK", "Canada", "Australia", "Germany", "France", "Spain", "Italy", "Japan", "Singapore"][i],
        status: "active" as const,
      })),
      {
        id: `demo-suspended1-${timestamp}`,
        username: `demosuspended1-${timestamp}`,
        email: `demosuspended1-${timestamp}@example.com`,
        password: userPassword,
        role: "member",
        firstName: "Suspended",
        lastName: "User1",
        totalCoins: 100,
        location: "USA",
        status: "suspended",
        suspendedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
      {
        id: `demo-suspended2-${timestamp}`,
        username: `demosuspended2-${timestamp}`,
        email: `demosuspended2-${timestamp}@example.com`,
        password: userPassword,
        role: "member",
        firstName: "Suspended",
        lastName: "User2",
        totalCoins: 50,
        location: "UK",
        status: "suspended",
        suspendedUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        id: `demo-banned-${timestamp}`,
        username: `demobanned-${timestamp}`,
        email: `demobanned-${timestamp}@example.com`,
        password: userPassword,
        role: "member",
        firstName: "Banned",
        lastName: "User",
        totalCoins: 0,
        location: "Russia",
        status: "banned",
        banReason: "Repeated violation of community guidelines",
        bannedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    ]).returning();

    console.log(`✅ Created ${seedUsers.length} users`);

    // ==================== 2. SUPPORT TICKETS ====================
    console.log("🎫 Seeding support tickets...");

    const ticketCategories = ["technical", "billing", "general", "account", "other"] as const;
    const ticketPriorities = ["low", "medium", "high"] as const;
    const ticketStatuses: Array<"open" | "in_progress" | "closed"> = ["open", "in_progress", "closed"];

    const ticketData = [
      ...Array.from({ length: 5 }, (_, i) => ({
        ticketNumber: `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId: seedUsers[3 + i].id,
        subject: [
          "Unable to withdraw funds",
          "EA installation issues",
          "Account verification pending",
          "Payment not received",
          "Forum post deleted"
        ][i],
        description: `Detailed description of the issue for ticket ${i + 1}. The user is experiencing problems with...`,
        category: ticketCategories[i % ticketCategories.length],
        priority: ticketPriorities[Math.min(i, 2)],
        status: "open" as const,
      })),
      ...Array.from({ length: 3 }, (_, i) => ({
        ticketNumber: `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId: seedUsers[8 + i].id,
        subject: [
          "Need help with API integration",
          "Marketplace transaction dispute",
          "Profile update not saving"
        ][i],
        description: `In-progress ticket description ${i + 1}. Currently being investigated by support team...`,
        category: ticketCategories[(i + 1) % ticketCategories.length],
        priority: "medium" as const,
        status: "in_progress" as const,
        firstResponseAt: new Date(Date.now() - (i + 1) * 2 * 60 * 60 * 1000),
      })),
      ...Array.from({ length: 10 }, (_, i) => ({
        ticketNumber: `TKT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        userId: seedUsers[3 + (i % 10)].id,
        subject: `Resolved issue #${i + 1}`,
        description: `This ticket has been resolved. Issue was: ${["Login problem", "Email not receiving", "Coin balance discrepancy", "Feature request"][i % 4]}`,
        category: ticketCategories[i % ticketCategories.length],
        priority: ticketPriorities[i % ticketPriorities.length],
        status: "closed" as const,
        firstResponseAt: new Date(Date.now() - (i + 5) * 24 * 60 * 60 * 1000),
        resolvedAt: new Date(Date.now() - (i + 2) * 24 * 60 * 60 * 1000),
        satisfactionScore: Math.floor(Math.random() * 3) + 3,
        satisfactionComment: ["Great support!", "Very helpful", "Quick response", null][i % 4],
      })),
    ];

    const seedTickets = await db.insert(supportTickets).values(ticketData).returning();
    console.log(`✅ Created ${seedTickets.length} support tickets`);

    // ==================== 3. TICKET MESSAGES ====================
    console.log("💬 Seeding ticket messages...");

    const ticketMessageData = seedTickets.flatMap((ticket, ticketIdx) => {
      const messageCount = Math.floor(Math.random() * 3) + 3;
      return Array.from({ length: messageCount }, (_, i) => ({
        ticketId: ticket.id,
        authorId: i % 2 === 0 ? ticket.userId : "mod-001",
        body: i % 2 === 0 
          ? `User message ${i + 1}: This is my issue with ${ticket.subject.toLowerCase()}...`
          : `Admin response ${i + 1}: Thank you for contacting support. We are investigating...`,
        isAdmin: i % 2 !== 0,
      }));
    });

    await db.insert(ticketMessages).values(ticketMessageData);
    console.log(`✅ Created ${ticketMessageData.length} ticket messages`);

    // ==================== 4. COIN TRANSACTIONS ====================
    console.log("💰 Seeding coin transactions...");

    const transactionTypes = ["earn", "spend", "recharge"] as const;
    const transactionData = Array.from({ length: 20 }, (_, i) => ({
      userId: seedUsers[3 + (i % 10)].id,
      type: transactionTypes[i % transactionTypes.length],
      amount: Math.floor(Math.random() * 500) + 50,
      description: [
        "Daily login bonus",
        "Content purchase",
        "Coin recharge via PayPal",
        "Content purchase",
        "Marketplace purchase",
        "Forum post reward",
        "EA purchase",
        "Referral bonus",
        "Contest prize",
        "Marketplace sale"
      ][i % 10],
    }));

    await db.insert(coinTransactions).values(transactionData);
    console.log(`✅ Created ${transactionData.length} coin transactions`);

    // ==================== 5. WITHDRAWAL REQUESTS ====================
    console.log("🏦 Seeding withdrawal requests...");

    const withdrawalData = [
      {
        userId: seedUsers[3].id,
        amount: 500,
        cryptoType: "BTC" as const,
        walletAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        status: "pending" as const,
        processingFee: 50,
        requestedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        userId: seedUsers[4].id,
        amount: 750,
        cryptoType: "ETH" as const,
        walletAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        status: "pending" as const,
        processingFee: 75,
        requestedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      },
      {
        userId: seedUsers[5].id,
        amount: 1000,
        cryptoType: "BTC" as const,
        walletAddress: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
        status: "approved" as const,
        processingFee: 100,
        requestedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        processedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        adminNotes: "Verified and processed",
      },
      {
        userId: seedUsers[6].id,
        amount: 300,
        cryptoType: "BTC" as const,
        walletAddress: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
        status: "approved" as const,
        processingFee: 30,
        requestedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        processedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
      {
        userId: seedUsers[7].id,
        amount: 250,
        cryptoType: "ETH" as const,
        walletAddress: "0xInvalidAddress",
        status: "rejected" as const,
        processingFee: 25,
        requestedAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
        processedAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
        adminNotes: "Invalid wallet address provided",
      },
    ];

    await db.insert(withdrawalRequests).values(withdrawalData);
    console.log(`✅ Created ${withdrawalData.length} withdrawal requests`);

    // ==================== 6. ANNOUNCEMENTS ====================
    console.log("📢 Seeding announcements...");

    const announcementData = [
      {
        title: "New Feature: Advanced Trading Journal",
        content: "We're excited to announce the launch of our advanced trading journal feature with AI-powered insights!",
        type: "banner" as const,
        status: "active" as const,
        audience: { role: "member", minCoins: 0 },
        views: 1250,
        clicks: 89,
        createdBy: "admin-001",
      },
      {
        title: "Marketplace Commission Reduced",
        content: "Great news! We've reduced marketplace commission to 5% for all sellers.",
        type: "modal" as const,
        status: "active" as const,
        audience: { role: "member", minCoins: 100 },
        views: 890,
        clicks: 45,
        createdBy: "admin-001",
      },
      {
        title: "Weekend Trading Contest",
        content: "Join our weekend trading contest and win up to 5000 gold coins!",
        type: "toast" as const,
        status: "active" as const,
        views: 2100,
        clicks: 234,
        createdBy: "mod-001",
      },
      {
        title: "Scheduled: Black Friday Sale",
        content: "Huge discounts on all EA content this Black Friday!",
        type: "banner" as const,
        status: "scheduled" as const,
        scheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdBy: "admin-001",
      },
      {
        title: "Scheduled: New Year Welcome",
        content: "Happy New Year to all our traders! Special bonuses await...",
        type: "modal" as const,
        status: "scheduled" as const,
        scheduledAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        createdBy: "admin-001",
      },
      {
        title: "Draft: Platform Update v2.0",
        content: "Major platform update coming soon with enhanced features...",
        type: "banner" as const,
        status: "draft" as const,
        createdBy: "admin-001",
      },
    ];

    await db.insert(announcements).values(announcementData);
    console.log(`✅ Created ${announcementData.length} announcements`);

    // ==================== 7. EMAIL CAMPAIGNS ====================
    console.log("📧 Seeding email campaigns...");

    const campaignData = [
      {
        name: "Welcome Series - Week 1",
        subject: "Welcome to YoForex! Get Started Guide",
        htmlContent: "<h1>Welcome!</h1><p>Thank you for joining YoForex...</p>",
        status: "sent" as const,
        totalRecipients: 450,
        opens: 320,
        clicks: 89,
        sentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        createdBy: "admin-001",
      },
      {
        name: "Monthly Newsletter - November",
        subject: "November Trading Highlights & Tips",
        htmlContent: "<h1>This Month in Trading</h1><p>Check out our top performers...</p>",
        status: "sent" as const,
        totalRecipients: 1200,
        opens: 780,
        clicks: 156,
        sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        createdBy: "admin-001",
      },
      {
        name: "Black Friday Promotion",
        subject: "🎉 Black Friday Sale - Up to 70% Off!",
        htmlContent: "<h1>Limited Time Offer</h1><p>Don't miss our biggest sale...</p>",
        status: "scheduled" as const,
        totalRecipients: 0,
        scheduledAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        createdBy: "admin-001",
      },
      {
        name: "Draft: Product Update Announcement",
        subject: "Exciting Updates Coming to YoForex",
        htmlContent: "<h1>We've been working hard...</h1>",
        status: "draft" as const,
        totalRecipients: 0,
        createdBy: "mod-001",
      },
    ];

    const campaigns = await db.insert(emailCampaigns).values(campaignData).returning();
    console.log(`✅ Created ${campaigns.length} email campaigns`);

    // Add some email deliveries for sent campaigns
    const deliveryData = campaigns
      .filter(c => c.status === "sent" && c.totalRecipients != null && c.totalRecipients > 0)
      .flatMap(campaign => 
        Array.from({ length: Math.min(10, campaign.totalRecipients ?? 10) }, (_, i) => ({
          campaignId: campaign.id,
          userId: seedUsers[3 + (i % 10)].id,
          trackingId: `trk-${campaign.id}-${i}`,
          email: seedUsers[3 + (i % 10)].email || `user${i}@example.com`,
          status: ["sent", "opened", "clicked"][Math.floor(Math.random() * 3)] as any,
          sentAt: campaign.sentAt,
          openedAt: Math.random() > 0.5 ? new Date(campaign.sentAt!.getTime() + 60 * 60 * 1000) : null,
        }))
      );

    if (deliveryData.length > 0) {
      await db.insert(emailDeliveries).values(deliveryData);
      console.log(`✅ Created ${deliveryData.length} email deliveries`);
    }

    // ==================== 8. SECURITY EVENTS ====================
    console.log("🔒 Seeding security events...");

    const securityEventData = [
      ...Array.from({ length: 10 }, (_, i) => ({
        type: "login_failed" as const,
        severity: "medium" as const,
        userId: seedUsers[3 + (i % 10)].id,
        ipAddress: `192.168.1.${100 + i}`,
        description: `Failed login attempt #${i + 1}`,
        status: "open" as const,
      })),
      ...Array.from({ length: 5 }, (_, i) => ({
        type: "api_abuse" as const,
        severity: "high" as const,
        userId: seedUsers[8 + i].id,
        ipAddress: `10.0.${i}.${Math.floor(Math.random() * 255)}`,
        description: `Multiple rapid API requests detected`,
        status: "open" as const,
      })),
      {
        type: "login_bruteforce" as const,
        severity: "high" as const,
        userId: seedUsers[13].id,
        ipAddress: "203.0.113.45",
        description: "Credential stuffing attack detected and blocked",
        status: "resolved" as const,
      },
      {
        type: "suspicious_ip" as const,
        severity: "medium" as const,
        userId: seedUsers[5].id,
        ipAddress: "198.51.100.23",
        description: "Login from new country: Singapore",
        status: "resolved" as const,
      },
    ];

    await db.insert(securityEvents).values(securityEventData);
    console.log(`✅ Created ${securityEventData.length} security events`);

    // ==================== 9. AUDIT LOGS ====================
    console.log("📋 Seeding audit logs...");

    const auditActions = [
      { action: "USER_BAN", actionCategory: "USER_MANAGEMENT", targetType: "user", targetId: "user-banned-01" },
      { action: "USER_SUSPEND", actionCategory: "USER_MANAGEMENT", targetType: "user", targetId: "user-suspended-01" },
      { action: "TICKET_REPLY", actionCategory: "SUPPORT", targetType: "ticket", targetId: String(seedTickets[0].id) },
      { action: "WITHDRAWAL_APPROVE", actionCategory: "FINANCE", targetType: "withdrawal", targetId: "1" },
      { action: "WITHDRAWAL_REJECT", actionCategory: "FINANCE", targetType: "withdrawal", targetId: "5" },
      { action: "CONTENT_APPROVE", actionCategory: "MODERATION", targetType: "content", targetId: "content-001" },
      { action: "CONTENT_REJECT", actionCategory: "MODERATION", targetType: "content", targetId: "content-002" },
      { action: "ANNOUNCEMENT_CREATE", actionCategory: "COMMUNICATION", targetType: "announcement", targetId: "1" },
      { action: "SETTING_UPDATE", actionCategory: "SETTINGS", targetType: "setting", targetId: "site.maintenance" },
      { action: "API_KEY_CREATE", actionCategory: "API", targetType: "api_key", targetId: "1" },
    ];

    const auditLogData = Array.from({ length: 20 }, (_, i) => ({
      adminId: i % 3 === 0 ? "admin-001" : i % 3 === 1 ? "mod-001" : "mod-002",
      ...auditActions[i % auditActions.length],
      ipAddress: `192.168.1.${100 + i}`,
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      requestMethod: ["GET", "POST", "PUT", "DELETE"][i % 4],
      requestPath: "/admin/api/action",
      statusCode: 200,
      durationMs: Math.floor(Math.random() * 500) + 50,
      metadata: { note: `Action performed at ${new Date(Date.now() - i * 60 * 60 * 1000).toISOString()}` },
    }));

    await db.insert(auditLogs).values(auditLogData);
    console.log(`✅ Created ${auditLogData.length} audit logs`);

    // ==================== 10. API KEYS ====================
    console.log("🔑 Seeding API keys...");

    const apiKeyData = [
      {
        key: `yfx_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        name: "Production API Key",
        userId: seedUsers[3].id,
        permissions: ["read:market", "write:orders", "read:account"],
        rateLimit: 100,
        usageCount: 4523,
        isActive: true,
        lastUsed: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        key: `yfx_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        name: "Testing Key",
        userId: seedUsers[4].id,
        permissions: ["read:market", "read:account"],
        rateLimit: 60,
        usageCount: 892,
        isActive: true,
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        key: `yfx_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        name: "Mobile App Key",
        userId: seedUsers[5].id,
        permissions: ["read:market", "read:account", "write:profile"],
        rateLimit: 120,
        usageCount: 12456,
        isActive: true,
        lastUsed: new Date(Date.now() - 1 * 60 * 60 * 1000),
      },
      {
        key: `yfx_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
        name: "Revoked Key",
        userId: seedUsers[6].id,
        permissions: ["read:market"],
        rateLimit: 60,
        usageCount: 234,
        isActive: false,
        lastUsed: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    ];

    const apiKeysCreated = await db.insert(apiKeys).values(apiKeyData).returning();
    console.log(`✅ Created ${apiKeysCreated.length} API keys`);

    // Add API key usage logs
    const apiUsageData = apiKeysCreated
      .filter(k => k.isActive)
      .flatMap((apiKey, idx) => 
        Array.from({ length: 10 }, (_, i) => ({
          apiKeyId: apiKey.id,
          endpoint: ["/api/market/prices", "/api/account/balance", "/api/orders", "/api/positions"][i % 4],
          method: ["GET", "POST", "PUT"][i % 3],
          statusCode: i === 9 ? 429 : 200,
          ipAddress: `192.168.${idx}.${100 + i}`,
          userAgent: "YoForex-SDK/1.0",
          responseTime: Math.floor(Math.random() * 300) + 50,
        }))
      );

    await db.insert(apiKeyUsage).values(apiUsageData);
    console.log(`✅ Created ${apiUsageData.length} API usage logs`);

    // ==================== 11. WEBHOOKS & WEBHOOK EVENTS ====================
    console.log("🪝 Seeding webhooks and events...");

    const webhookData = [
      {
        url: "https://example.com/webhooks/yoforex",
        events: ["order.created", "order.filled", "balance.updated"],
        secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
        isActive: true,
        createdBy: seedUsers[3].id,
        lastTriggered: new Date(Date.now() - 30 * 60 * 1000),
        successCount: 245,
        failureCount: 3,
      },
      {
        url: "https://trader.example.com/hooks",
        events: ["market.alert", "news.published"],
        secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
        isActive: true,
        createdBy: seedUsers[4].id,
        lastTriggered: new Date(Date.now() - 2 * 60 * 60 * 1000),
        successCount: 89,
        failureCount: 1,
      },
    ];

    const webhooksCreated = await db.insert(webhooks).values(webhookData).returning();
    console.log(`✅ Created ${webhooksCreated.length} webhooks`);

    // Add webhook events
    const webhookEventData = webhooksCreated.flatMap((webhook, idx) => {
      if (!webhook.events || !Array.isArray(webhook.events) || webhook.events.length === 0) {
        return [];
      }
      const events = webhook.events;
      return Array.from({ length: 5 }, (_, i) => ({
        webhookId: webhook.id,
        eventType: events[i % events.length],
        payload: { eventId: `evt_${i}`, timestamp: Date.now(), data: { test: true } },
        status: i === 4 ? ("failed" as const) : ("success" as const),
        responseCode: i === 4 ? 500 : 200,
        responseBody: i === 4 ? "Internal Server Error" : "OK",
        attempts: i === 4 ? 3 : 1,
        lastAttemptAt: new Date(Date.now() - i * 60 * 60 * 1000),
      }));
    });

    await db.insert(webhookEvents).values(webhookEventData);
    console.log(`✅ Created ${webhookEventData.length} webhook events`);

    // ==================== 12. SEO PAGES ====================
    console.log("🔍 Seeding SEO pages...");

    const seoPageData = [
      { url: "/", title: "YoForex - Forex Trading Community", description: "Join the leading forex trading community", keywords: ["forex", "trading", "community"], seoScore: 92, lastScanned: new Date() },
      { url: "/marketplace", title: "Marketplace - Buy EAs & Indicators", description: "Browse our marketplace", keywords: ["marketplace", "ea", "indicators"], seoScore: 88, lastScanned: new Date() },
      { url: "/forum", title: "Trading Forum", description: "Discuss trading strategies", keywords: ["forum", "discussion", "trading"], seoScore: 85, lastScanned: new Date() },
      { url: "/pricing", title: "Pricing Plans", description: "Choose your plan", keywords: ["pricing", "plans", "subscription"], seoScore: 78, lastScanned: new Date() },
      { url: "/about", title: "About YoForex", description: "Learn about our platform", keywords: ["about", "company", "mission"], seoScore: 75, lastScanned: new Date() },
      { url: "/blog", title: "Trading Blog", description: "Latest trading insights", keywords: ["blog", "news", "insights"], seoScore: 82, lastScanned: new Date() },
      { url: "/brokers", title: "Forex Brokers Review", description: "Compare forex brokers", keywords: ["brokers", "review", "comparison"], seoScore: 70, lastScanned: new Date() },
      { url: "/tools", title: "Trading Tools", description: "Free trading tools", keywords: ["tools", "calculator", "charts"], seoScore: 68, lastScanned: new Date() },
      { url: "/education", title: "Trading Education", description: "Learn to trade forex", keywords: ["education", "learn", "courses"], seoScore: 90, lastScanned: new Date() },
      { url: "/contact", title: "Contact Us", description: "Get in touch", keywords: ["contact", "support", "help"], seoScore: 65, lastScanned: new Date() },
    ];

    await db.insert(seoPages).values(seoPageData);
    console.log(`✅ Created ${seoPageData.length} SEO pages`);

    // ==================== 13. SCHEMA VALIDATIONS ====================
    console.log("✅ Seeding schema validations...");

    const schemaValidationData = [
      {
        pageUrl: "/",
        schemaTypes: ["Organization", "WebSite"],
        status: "valid" as const,
        lastValidated: new Date(),
      },
      {
        pageUrl: "/marketplace",
        schemaTypes: ["Product", "Offer"],
        status: "warning" as const,
        warnings: [{ type: "Product", message: "Missing aggregateRating property" }],
        lastValidated: new Date(),
      },
      {
        pageUrl: "/forum",
        schemaTypes: ["DiscussionForumPosting"],
        status: "error" as const,
        errors: [{ type: "DiscussionForumPosting", message: "Missing required property: author" }],
        lastValidated: new Date(),
      },
      {
        pageUrl: "/blog",
        schemaTypes: ["BlogPosting", "Article"],
        status: "warning" as const,
        warnings: [{ type: "Article", message: "Consider adding publisher property" }],
        lastValidated: new Date(),
      },
      {
        pageUrl: "/brokers",
        schemaTypes: ["Review", "Rating"],
        status: "error" as const,
        errors: [{ type: "Review", message: "Missing itemReviewed property" }],
        lastValidated: new Date(),
      },
    ];

    await db.insert(schemaValidations).values(schemaValidationData);
    console.log(`✅ Created ${schemaValidationData.length} schema validations`);

    // ==================== 14. PERFORMANCE METRICS ====================
    console.log("📊 Seeding performance metrics...");

    const performanceData = [
      ...Array.from({ length: 50 }, (_, i) => ({
        metricType: "page_load",
        metricName: ["/", "/marketplace", "/forum", "/pricing", "/about"][i % 5],
        value: (Math.random() * 2 + 0.5).toFixed(2),
        unit: "seconds",
        metadata: { browser: "Chrome", device: "desktop" },
      })),
      ...Array.from({ length: 50 }, (_, i) => ({
        metricType: "api_response",
        metricName: ["/api/market/prices", "/api/account/balance", "/api/orders", "/api/positions"][i % 4],
        value: (Math.random() * 300 + 50).toFixed(2),
        unit: "milliseconds",
        metadata: { endpoint: "v1", status: 200 },
      })),
    ];

    await db.insert(performanceMetrics).values(performanceData);
    console.log(`✅ Created ${performanceData.length} performance metrics`);

    console.log("\n🎉 Comprehensive admin demo seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - ${seedUsers.length} users`);
    console.log(`   - ${seedTickets.length} support tickets`);
    console.log(`   - ${ticketMessageData.length} ticket messages`);
    console.log(`   - ${transactionData.length} coin transactions`);
    console.log(`   - ${withdrawalData.length} withdrawal requests`);
    console.log(`   - ${announcementData.length} announcements`);
    console.log(`   - ${campaigns.length} email campaigns`);
    console.log(`   - ${securityEventData.length} security events`);
    console.log(`   - ${auditLogData.length} audit logs`);
    console.log(`   - ${apiKeysCreated.length} API keys`);
    console.log(`   - ${apiUsageData.length} API usage logs`);
    console.log(`   - ${webhooksCreated.length} webhooks`);
    console.log(`   - ${webhookEventData.length} webhook events`);
    console.log(`   - ${seoPageData.length} SEO pages`);
    console.log(`   - ${schemaValidationData.length} schema validations`);
    console.log(`   - ${performanceData.length} performance metrics`);

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

seed();
