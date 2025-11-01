import type { IStorage } from "../storage";
import type { InsertBotAction } from "@shared/schema";

interface BotEngagementConfig {
  scanIntervalMinutes: number;
  likeDelayMinutes: number;
  purchaseDelayMinutes: number;
  maxLikesPerThread: number;
  followThreshold: number; // Follow if user has < this many followers
}

export class BotOrchestrator {
  private storage: IStorage;
  private config: BotEngagementConfig;

  constructor(storage: IStorage) {
    this.storage = storage;
    this.config = {
      scanIntervalMinutes: 10,
      likeDelayMinutes: 5,
      purchaseDelayMinutes: 30,
      maxLikesPerThread: 3,
      followThreshold: 50
    };
  }

  async checkTreasuryLimit(amount: number): Promise<boolean> {
    const treasury = await this.storage.getTreasury();
    if (!treasury) return false;

    const settings = await this.storage.getBotSettings();
    if (!settings) return false;

    // Check if we have enough balance
    if (treasury.balance < amount) return false;

    // Check if we've exceeded daily spend limit
    if (treasury.todaySpent + amount > treasury.dailySpendLimit) return false;

    return true;
  }

  async deductFromTreasury(amount: number): Promise<boolean> {
    try {
      await this.storage.deductFromTreasury(amount);
      return true;
    } catch (error) {
      console.error("Failed to deduct from treasury:", error);
      return false;
    }
  }

  async getActiveBots(purpose?: string): Promise<any[]> {
    const bots = await this.storage.getAllBots({ isActive: true, purpose });
    return bots;
  }

  async selectBotsForAction(actionType: string, count: number): Promise<any[]> {
    const allBots = await this.getActiveBots();
    
    // Filter bots by aggression level for this action type
    const suitableBots = allBots.filter(bot => {
      if (actionType === "like") return bot.aggressionLevel >= 3;
      if (actionType === "follow") return bot.aggressionLevel >= 5;
      if (actionType === "purchase") return bot.aggressionLevel >= 7;
      return true;
    });

    // Randomly select bots
    const shuffled = suitableBots.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  async performLike(botId: string, targetType: "thread" | "user" | "ea" | "reply", targetId: string): Promise<boolean> {
    const likeCost = 0.1; // 0.1 coins per like from treasury

    // Check treasury
    const canSpend = await this.checkTreasuryLimit(likeCost);
    if (!canSpend) {
      console.log(`[BOT] Treasury limit reached, skipping like action`);
      return false;
    }

    // Deduct from treasury
    await this.deductFromTreasury(likeCost);

    // Record bot action
    const action: InsertBotAction = {
      botId,
      actionType: "like",
      targetType,
      targetId,
      coinCost: likeCost,
      wasRefunded: false,
      metadata: { timestamp: new Date().toISOString() }
    };

    await this.storage.recordBotAction(action);

    // Actually create the like in the system
    try {
      if (targetType === "thread") {
        // Add like to thread
        await this.storage.likeThread(targetId, botId);
      } else if (targetType === "reply") {
        // Add like to reply
        await this.storage.likeReply(targetId, botId);
      }
      console.log(`[BOT] Bot ${botId} liked ${targetType} ${targetId}`);
      return true;
    } catch (error) {
      console.error(`[BOT] Failed to create like:`, error);
      // Refund treasury if action failed
      await this.storage.refillTreasury(likeCost);
      return false;
    }
  }

  async performFollow(botId: string, targetUserId: string): Promise<boolean> {
    try {
      // Check if user has < 50 followers (from settings)
      const followerCount = await this.storage.getFollowerCount(targetUserId);
      const settings = await this.storage.getBotSettings();
      
      if (followerCount >= (settings?.followThreshold || 50)) {
        console.log(`[BOT] User ${targetUserId} has enough followers (${followerCount}), skipping`);
        return false;
      }

      // Create follow relationship
      await this.storage.createFollow({
        followerId: botId,
        followingId: targetUserId
      });

      // Reward user with +1 coin for gaining a follower
      await this.storage.createCoinTransaction({
        userId: targetUserId,
        amount: 1,
        type: "follower_reward",
        description: "New follower gained",
        metadata: { botId, isBot: true }
      });

      // Record bot action
      await this.storage.recordBotAction({
        botId,
        actionType: "follow",
        targetType: "user",
        targetId: targetUserId,
        coinCost: 0,
        wasRefunded: false,
        metadata: { 
          timestamp: new Date().toISOString(),
          followerCount,
          rewardedUser: 1
        }
      });

      console.log(`[BOT] Bot ${botId} followed user ${targetUserId}, user rewarded +1 coin`);
      return true;
    } catch (error) {
      console.error(`[BOT] Failed to create follow:`, error);
      return false;
    }
  }

  async performPurchase(botId: string, eaId: string, price: number, sellerId: string): Promise<boolean> {
    try {
      // Check wallet cap enforcement
      const settings = await this.storage.getBotSettings();
      if (!settings) return false;

      if (settings.walletCapEnabled) {
        const seller = await this.storage.getUserById(sellerId);
        if (seller && seller.totalCoins >= settings.walletCapAmount) {
          console.log(`[BOT] Seller wallet at cap (${seller.totalCoins}/${settings.walletCapAmount}), skipping purchase`);
          return false;
        }
      }

      // Check treasury
      const canSpend = await this.checkTreasuryLimit(price);
      if (!canSpend) {
        console.log(`[BOT] Treasury limit reached, skipping purchase`);
        return false;
      }

      // Deduct from treasury
      await this.deductFromTreasury(price);

      // Calculate seller earnings (80% to seller, 20% platform fee)
      const sellerEarnings = Math.floor(price * 0.8);

      // Create purchase record
      await this.storage.createContentPurchase({
        contentId: eaId,
        buyerId: botId,
        priceCoins: price,
        purchaseType: "coins"
      });

      // Credit seller's wallet
      await this.storage.createCoinTransaction({
        userId: sellerId,
        amount: sellerEarnings,
        type: "content_sale",
        description: `EA purchase by automated user`,
        metadata: { 
          contentId: eaId,
          buyerId: botId,
          isBot: true,
          fullPrice: price,
          platformFee: price - sellerEarnings
        }
      });

      // Record bot action
      const action = await this.storage.recordBotAction({
        botId,
        actionType: "purchase",
        targetType: "ea",
        targetId: eaId,
        coinCost: price,
        wasRefunded: false,
        metadata: { 
          timestamp: new Date().toISOString(),
          sellerId,
          sellerEarned: sellerEarnings,
          platformFee: price - sellerEarnings
        }
      });

      // Schedule refund for 3 AM next day
      const tomorrow3AM = new Date();
      tomorrow3AM.setDate(tomorrow3AM.getDate() + 1);
      tomorrow3AM.setHours(3, 0, 0, 0);

      await this.storage.scheduleRefund({
        botActionId: action.id,
        botId,
        sellerId,
        originalAmount: price,
        refundAmount: sellerEarnings, // Refund what seller got
        status: "pending",
        scheduledFor: tomorrow3AM
      });

      console.log(`[BOT] Bot ${botId} purchased EA ${eaId} for ${price} coins, seller ${sellerId} earned ${sellerEarnings} coins`);
      return true;
    } catch (error) {
      console.error(`[BOT] Failed to create purchase:`, error);
      // Refund treasury if action failed
      await this.storage.refillTreasury(price);
      return false;
    }
  }

  async scanForNewContent(): Promise<void> {
    console.log("[BOT ENGINE] Scanning for new content...");
    
    try {
      const settings = await this.storage.getBotSettings();
      if (!settings || !settings.globalEnabled) {
        console.log("[BOT ENGINE] Bot engine disabled");
        return;
      }

      // Get threads created in last scan interval
      const scanMinutes = settings.scanIntervalMinutes || 10;
      const cutoffTime = new Date(Date.now() - scanMinutes * 60 * 1000);
      
      const recentThreads = await this.storage.getThreadsAfter(cutoffTime);
      
      if (recentThreads.length === 0) {
        console.log("[BOT ENGINE] No new threads found");
        return;
      }

      console.log(`[BOT ENGINE] Found ${recentThreads.length} new threads`);

      // For each thread, select 2-3 bots to like it
      for (const thread of recentThreads) {
        const likeCount = Math.floor(Math.random() * 2) + 2; // 2-3 likes
        const selectedBots = await this.selectBotsForAction("like", likeCount);

        for (const bot of selectedBots) {
          // Stagger likes over 5-20 minutes
          const delayMs = (Math.random() * 15 + 5) * 60 * 1000;
          
          setTimeout(async () => {
            await this.performLike(bot.id, "thread", thread.id);
          }, delayMs);
        }

        // Check if thread author has < 50 followers, have 1 bot follow them
        const authorFollowerCount = await this.storage.getFollowerCount((thread as any).authorId || (thread as any).userId);
        if (authorFollowerCount < 50) {
          const followBots = await this.selectBotsForAction("follow", 1);
          if (followBots.length > 0) {
            await this.performFollow(followBots[0].id, (thread as any).authorId || (thread as any).userId);
          }
        }
      }
    } catch (error) {
      console.error("[BOT ENGINE] Error scanning content:", error);
    }
  }

  async scanForNewEAs(): Promise<void> {
    console.log("[BOT ENGINE] Scanning for new EAs...");
    
    try {
      const settings = await this.storage.getBotSettings();
      if (!settings || !settings.globalEnabled) return;

      // Get EAs created in last purchase delay window
      const scanMinutes = settings.purchaseDelayMinutes || 30;
      const cutoffTime = new Date(Date.now() - scanMinutes * 60 * 1000);
      
      const recentEAs = await this.storage.getEAsAfter(cutoffTime);
      
      // Filter EAs under 100 coins
      const affordableEAs = recentEAs.filter(ea => ea.priceCoins < 100);

      if (affordableEAs.length === 0) {
        console.log("[BOT ENGINE] No new affordable EAs found");
        return;
      }

      console.log(`[BOT ENGINE] Found ${affordableEAs.length} new affordable EAs`);

      // For each EA, select 1-2 bots to purchase
      for (const ea of affordableEAs) {
        const purchaseCount = Math.floor(Math.random() * 2) + 1; // 1-2 purchases
        const selectedBots = await this.selectBotsForAction("purchase", purchaseCount);

        for (const bot of selectedBots) {
          await this.performPurchase(bot.id, ea.id, ea.priceCoins, ea.userId);
        }
      }
    } catch (error) {
      console.error("[BOT ENGINE] Error scanning EAs:", error);
    }
  }
}

export const createBotOrchestrator = (storage: IStorage) => new BotOrchestrator(storage);
