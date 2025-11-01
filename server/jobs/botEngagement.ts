import cron from "node-cron";
import { storage } from "../storage/index.js";
import { createBotOrchestrator } from "../services/botOrchestrator.js";
import { generateBotReply, isGeminiServicePaused } from "../services/gemini-bot-service.js";
import { db } from "../db.js";
import { forumThreads, forumReplies, users, bots } from "../../shared/schema.js";
import { eq, gte, desc, and, sql, lt } from "drizzle-orm";

const orchestrator = createBotOrchestrator(storage);

/**
 * Auto-reply to new forum threads using Gemini AI
 */
async function autoReplyToThreads() {
  try {
    // Check if Gemini is available
    if (isGeminiServicePaused()) {
      console.log("[BOT ENGAGEMENT] Gemini service paused, skipping auto-reply");
      return;
    }

    const settings = await storage.getBotSettings();
    if (!settings) return;

    // Get active bots with engagement purpose
    const activeBots = await storage.getAllBots({ isActive: true, purpose: 'engagement' });
    if (activeBots.length === 0) {
      console.log("[BOT ENGAGEMENT] No active engagement bots found");
      return;
    }

    // Get threads from last 30 minutes
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000);
    const recentThreads = await db
      .select()
      .from(forumThreads)
      .where(
        and(
          gte(forumThreads.createdAt, cutoffTime),
          eq(forumThreads.status, 'published')
        )
      )
      .orderBy(desc(forumThreads.createdAt))
      .limit(5); // Pick 3-5 threads

    console.log(`[BOT ENGAGEMENT] Found ${recentThreads.length} recent threads for auto-reply`);

    for (const thread of recentThreads) {
      // Pick a random bot
      const bot = activeBots[Math.floor(Math.random() * activeBots.length)];

      // Check if bot already replied to this thread
      const existingReply = await db
        .select()
        .from(forumReplies)
        .where(
          and(
            eq(forumReplies.threadId, thread.id),
            eq(forumReplies.authorId, bot.id)
          )
        )
        .limit(1);

      if (existingReply.length > 0) {
        console.log(`[BOT ENGAGEMENT] Bot ${bot.username} already replied to thread ${thread.id}`);
        continue;
      }

      // Check bot wallet balance
      const botBalance = await storage.getBotWalletBalance(bot.id);
      const canAfford = await storage.enforceBotWalletCap(bot.id, 5); // Assume 5 coins for reply

      if (!canAfford) {
        console.log(`[BOT ENGAGEMENT] Bot ${bot.username} wallet would exceed cap, skipping`);
        continue;
      }

      // Generate reply using Gemini
      const replyText = await generateBotReply(
        {
          title: thread.title,
          content: thread.bodyContent || '',
          categoryName: thread.categorySlug
        },
        180,
        bot.id
      );

      if (!replyText) {
        console.log(`[BOT ENGAGEMENT] Failed to generate reply for thread ${thread.id}`);
        continue;
      }

      // Post reply
      const reply = await storage.createForumReply({
        threadId: thread.id,
        authorId: bot.id,
        bodyContent: replyText,
        status: 'published'
      });

      // Record wallet event
      await storage.recordBotWalletEvent({
        botId: bot.id,
        eventType: 'comment',
        coinAmount: -5, // Deduct 5 coins from bot balance
        targetType: 'thread',
        targetId: thread.id,
        metadata: {
          replyId: reply.id,
          generatedByGemini: true
        }
      });

      // Record bot action
      await storage.recordBotAction({
        botId: bot.id,
        actionType: 'like', // Using 'like' as proxy for comment
        targetType: 'thread',
        targetId: thread.id,
        coinCost: 5,
        wasRefunded: false,
        metadata: {
          replyId: reply.id,
          replyLength: replyText.length
        }
      });

      console.log(`[BOT ENGAGEMENT] Bot ${bot.username} replied to thread "${thread.title}"`);

      // Small delay between replies
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error("[BOT ENGAGEMENT] Auto-reply failed:", error);
  }
}

/**
 * Auto-like replies with ≥2 helpful votes
 */
async function autoLikeHelpfulReplies() {
  try {
    const settings = await storage.getBotSettings();
    if (!settings) return;

    const activeBots = await storage.getAllBots({ isActive: true });
    if (activeBots.length === 0) return;

    // Find replies with >= 2 helpful votes from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const helpfulReplies = await db
      .select()
      .from(forumReplies)
      .where(
        and(
          gte(forumReplies.helpfulVotes, 2),
          gte(forumReplies.createdAt, oneHourAgo)
        )
      )
      .limit(10);

    console.log(`[BOT ENGAGEMENT] Found ${helpfulReplies.length} helpful replies to like`);

    for (const reply of helpfulReplies) {
      // Pick a random bot
      const bot = activeBots[Math.floor(Math.random() * activeBots.length)];

      // Check if bot already liked this reply
      // (In a real implementation, you'd track this in a bot_likes table)
      
      // Like the reply
      await storage.likeReply(reply.id, bot.id);

      // Record bot action
      await storage.recordBotAction({
        botId: bot.id,
        actionType: 'like',
        targetType: 'reply',
        targetId: reply.id,
        coinCost: 0,
        wasRefunded: false
      });

      console.log(`[BOT ENGAGEMENT] Bot ${bot.username} liked helpful reply ${reply.id}`);
    }
  } catch (error) {
    console.error("[BOT ENGAGEMENT] Auto-like failed:", error);
  }
}

// Run every 10 minutes during active hours (8 AM - 10 PM UTC)
export const startBotEngagementJob = () => {
  cron.schedule("*/10 8-22 * * *", async () => {
    try {
      const settings = await storage.getBotSettings();
      if (!settings || !settings.globalEnabled) {
        console.log("Bot engagement disabled globally");
        return;
      }

      console.log("Running bot engagement cycle...");
      
      // Run auto-reply with Gemini
      await autoReplyToThreads();
      
      // Run auto-like logic
      await autoLikeHelpfulReplies();
      
      // Run existing bot actions (content scanning, EA purchases)
      await orchestrator.scanForNewContent();
      await orchestrator.scanForNewEAs();
      
      console.log("Bot engagement cycle complete");
    } catch (error) {
      console.error("Bot engagement job failed:", error);
    }
  });

  console.log("Bot engagement job scheduled (every 10 minutes, 8 AM - 10 PM UTC)");
};
