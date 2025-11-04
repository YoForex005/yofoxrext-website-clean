import { db } from "../server/db";
import { forumThreads } from "../shared/schema";
import { sql } from "drizzle-orm";

async function createTestThread() {
  try {
    console.log("Creating test thread...");
    
    // Create the test thread with slug "test-something-good"
    const testThread = {
      id: crypto.randomUUID(),
      authorId: "866f4832-a46b-44de-9d25-2279ee3eecc7", // Using indicator_guy88
      categorySlug: "forex-indicators-mt4-mt5",
      subcategorySlug: null,
      title: "Best Forex Trading Strategies for Consistent Profits in 2025",
      body: `## Introduction to Profitable Forex Trading

I've been trading forex for over 5 years now, and I want to share some insights about profitable trading strategies that have worked consistently for me, especially in volatile market conditions.

### 1. The London Breakout Strategy

One of my favorite strategies is trading the London session breakout. Here's how it works:

- **Entry Time**: 8:00 AM GMT (London Open)
- **Currency Pairs**: EUR/USD, GBP/USD, EUR/GBP
- **Timeframe**: H1 and M15 for confirmation
- **Risk Management**: Always use 1-2% risk per trade

The key here is to wait for the first hour of the London session to establish a range, then trade the breakout with proper stop-loss placement.

### 2. Support and Resistance Trading

This is the bread and butter of technical analysis. I've found that major support and resistance levels on the daily chart are incredibly reliable, especially when combined with:

- Price action patterns (pin bars, engulfing candles)
- Volume confirmation
- RSI divergence for extra confluence

### 3. The 50 EMA Strategy

Simple but effective. When price is above the 50 EMA on the 4H chart, only look for long trades. When below, only shorts. This keeps you trading with the trend and filters out a lot of bad trades.

### Risk Management Tips

Remember, the most important part of trading isn't the strategy—it's risk management:

1. **Never risk more than 2% per trade**
2. **Use a risk-reward ratio of at least 1:2**
3. **Keep a trading journal to track your performance**
4. **Don't overtrade—quality over quantity**

### My Current Setup

I'm currently using MT4 with these indicators:
- RSI (14)
- MACD (12, 26, 9)
- Bollinger Bands (20, 2)
- Custom pivot points indicator

### Conclusion

Trading forex successfully requires discipline, patience, and continuous learning. These strategies have helped me achieve consistent profits, but remember that no strategy works 100% of the time. Always backtest and demo trade before going live.

What strategies are working for you in 2025? Let's discuss in the comments below!

**Disclaimer**: This is not financial advice. Trading forex involves significant risk of loss.`,
      slug: "test-something-good",
      focusKeyword: "forex trading strategies",
      metaDescription: "Discover proven forex trading strategies for consistent profits in 2025. Learn about London breakout, support resistance, and risk management techniques.",
      metaTitle: "Best Forex Trading Strategies for Consistent Profits | YoForex",
      metaKeywords: "forex trading, trading strategies, London breakout, support resistance, risk management, MT4, forex indicators",
      threadType: "guide" as const,
      seoExcerpt: "Learn proven forex trading strategies including London breakout, support resistance trading, and the 50 EMA strategy for consistent profits.",
      primaryKeyword: "forex trading strategies",
      language: "en",
      instruments: ["EURUSD", "GBPUSD", "EURGBP", "USDJPY"],
      timeframes: ["M15", "H1", "H4", "D1"],
      strategies: ["breakout", "support-resistance", "trend-following"],
      platform: "MT4",
      broker: "Various (IC Markets, Pepperstone, XM)",
      riskNote: "Always use proper risk management. Never risk more than 2% per trade.",
      hashtags: ["#forextrading", "#tradingstrategy", "#technicalanalysis", "#mt4", "#riskmanagement"],
      attachmentUrls: [],
      contentHtml: null,
      attachments: [],
      isPinned: false,
      isLocked: false,
      isSolved: false,
      views: 42,
      replyCount: 3,
      likeCount: 7,
      bookmarkCount: 2,
      shareCount: 1,
      lastActivityAt: new Date(),
      status: "approved" as const,
      moderatedBy: null,
      moderatedAt: null,
      rejectionReason: null,
      publishedAt: new Date(),
      engagementScore: 15,
      lastScoreUpdate: new Date(),
      helpfulVotes: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Insert the thread
    const result = await db.insert(forumThreads).values(testThread).returning();
    
    console.log("✅ Test thread created successfully!");
    console.log("Thread ID:", result[0].id);
    console.log("Thread Slug:", result[0].slug);
    console.log("Thread URL: /thread/test-something-good");
    console.log("API URL: /api/threads/slug/test-something-good");
    
  } catch (error) {
    console.error("❌ Error creating test thread:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
createTestThread();