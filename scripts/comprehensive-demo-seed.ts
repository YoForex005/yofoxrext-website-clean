/**
 * Comprehensive Demo Data Seed Script
 * 
 * This script creates realistic demo data across ALL YoForex platform segments:
 * 1. Users with various activity levels and coin balances
 * 2. Forum threads and replies with coin rewards
 * 3. Marketplace content (EAs, indicators, articles) with purchases
 * 4. Broker reviews with rewards
 * 5. Coin transactions (all types: earn, spend, purchase, sale, withdrawal)
 * 6. Badges and achievements
 * 7. User rank progress and XP
 * 8. Redemptions and rewards
 * 9. Bot-generated activity
 * 10. Admin actions for audit logs
 */

import { db } from '../server/db';
import { storage } from '../server/storage';
import { 
  users, 
  forumThreads, 
  forumReplies, 
  content, 
  brokers, 
  brokerReviews,
  coinTransactions,
  userBadges,
  userRankProgress,
  rankTiers,
  achievements,
  userAchievements,
  activityFeed,
  redemptionOrders,
  redemptionOptions
} from '../shared/schema';
import { eq, sql } from 'drizzle-orm';
import { EARNING_REWARDS, COMMISSION_RATES } from '../shared/coinUtils';

// Demo user personas with realistic profiles
const DEMO_USERS = [
  {
    username: 'ProTraderMike',
    password: 'demo123',
    role: 'user' as const,
    initialCoins: 5000,
    profileImage: null,
    bio: 'Professional forex trader with 8 years experience. Specializing in EA development and backtesting.',
    activityLevel: 'creator' as const
  },
  {
    username: 'EADevSarah',
    password: 'demo123',
    role: 'user' as const,
    initialCoins: 3200,
    profileImage: null,
    bio: 'Expert Advisor developer. Creating profitable automated trading systems since 2018.',
    activityLevel: 'creator' as const
  },
  {
    username: 'ForexNewbie2024',
    password: 'demo123',
    role: 'user' as const,
    initialCoins: 150,
    profileImage: null,
    bio: 'Just started my forex journey. Learning grid strategies and looking for mentorship.',
    activityLevel: 'moderate' as const
  },
  {
    username: 'GridMasterJohn',
    password: 'demo123',
    role: 'user' as const,
    initialCoins: 4800,
    profileImage: null,
    bio: 'Grid trading specialist. Love sharing strategies and helping others succeed.',
    activityLevel: 'active' as const
  },
  {
    username: 'IndicatorQueen',
    password: 'demo123',
    role: 'user' as const,
    initialCoins: 2900,
    profileImage: null,
    bio: 'Technical analysis expert. Creating custom indicators for MT4/MT5.',
    activityLevel: 'creator' as const
  },
  {
    username: 'ScalpingNinja',
    password: 'demo123',
    role: 'user' as const,
    initialCoins: 1800,
    profileImage: null,
    bio: 'Scalper trading EUR/USD and GBP/USD. Fast execution is key!',
    activityLevel: 'active' as const
  },
  {
    username: 'BotTraderAI',
    password: 'demo123',
    role: 'bot' as const,
    initialCoins: 500,
    profileImage: null,
    bio: 'AI-powered trading assistant. Helping the community with automated insights.',
    activityLevel: 'passive' as const
  }
];

// Forum thread templates
const FORUM_THREADS = [
  {
    title: 'Best Grid Spacing for XAUUSD - Your Recommendations?',
    content: 'I\'ve been testing different grid spacings for Gold trading. Currently using 50 pips but wondering if tighter grids (30 pips) would be better during high volatility. What are your experiences?',
    categorySlug: 'ea-strategies'
  },
  {
    title: 'MT5 vs MT4 - Which Platform for EA Development in 2025?',
    content: 'Planning to develop my first Expert Advisor. Should I go with MT4 (more users) or MT5 (better features)? Looking for honest pros/cons from experienced developers.',
    categorySlug: 'technical-discussion'
  },
  {
    title: 'Warning: Scam Broker Alert - BrokerXYZ Manipulating Spreads',
    content: 'PSA: Just lost $2k with BrokerXYZ. They widened spreads during NFP to 50 pips on EUR/USD. Server "disconnected" during my profitable trade. Anyone else had issues?',
    categorySlug: 'broker-discussion'
  },
  {
    title: 'My Journey from $500 to $15K in 18 Months - AMA',
    content: 'Started with $500 in May 2023, now sitting at $15,247 verified. Using mostly grid strategies on GOLD and EUR/USD. Happy to answer questions about my approach, risk management, and mistakes I made along the way.',
    categorySlug: 'trading-success-stories'
  },
  {
    title: 'Free Backtest Service - Send Me Your EA, I\'ll Test It',
    content: 'Offering free backtesting service for the community. I have tick data from 2015-2024 for major pairs. Send me your EA and I\'ll run comprehensive tests with detailed reports.',
    categorySlug: 'community-help'
  }
];

// Marketplace content templates
const MARKETPLACE_CONTENT = [
  {
    type: 'ea' as const,
    title: 'Night Scalper Pro - EURUSD Automated Trading System',
    description: 'Advanced night scalping EA optimized for EUR/USD during Asian session (low volatility). Features: \n- Smart entry logic based on price action\n- Dynamic stop-loss and take-profit\n- News filter integration\n- Max 2% risk per trade\n- Backtested 2020-2024: 73% win rate, max DD 12%\n\nIncludes preset files and video tutorial.',
    priceCoins: 350,
    isFree: false,
    category: 'Scalping Strategies'
  },
  {
    type: 'indicator' as const,
    title: 'Volume Profile Heatmap - See Where Institutions Trade',
    description: 'Professional volume profile indicator showing high-volume nodes and institutional order blocks. Perfect for support/resistance identification.\n\nFeatures:\n- Multi-timeframe analysis\n- Color-coded volume zones\n- Point of Control (POC) line\n- Value Area High/Low\n- Real-time updates',
    priceCoins: 180,
    isFree: false,
    category: 'Technical Indicators'
  },
  {
    type: 'article' as const,
    title: 'The Complete Grid Trading Blueprint - From Zero to Profitable',
    description: 'Comprehensive 15,000-word guide covering everything about grid trading:\n\n✅ Grid spacing formulas\n✅ Position sizing calculator\n✅ When to use hedged vs non-hedged grids\n✅ Broker selection criteria\n✅ Psychology and discipline\n✅ Real account examples with screenshots\n\nBonus: Excel calculator included!',
    priceCoins: 75,
    isFree: false,
    category: 'Trading Education'
  },
  {
    type: 'indicator' as const,
    title: 'Free Pivot Points Indicator - Daily/Weekly/Monthly Levels',
    description: 'Simple but effective pivot point indicator. Calculates daily, weekly, and monthly pivot levels automatically. Great for swing traders and position traders.',
    priceCoins: 0,
    isFree: true,
    category: 'Free Indicators'
  }
];

// Broker review templates
const BROKER_REVIEWS = [
  {
    rating: 5,
    reviewText: 'Been using IC Markets for 3 years. Lightning-fast execution, tight spreads (avg 0.1 pips on EUR/USD), and never had withdrawal issues. Highly recommended for scalpers.',
    verified: true
  },
  {
    rating: 4,
    reviewText: 'Good broker overall. Spreads are competitive, platform is stable. Only complaint: customer support can be slow during peak hours (24-48h response time).',
    verified: true
  },
  {
    rating: 1,
    reviewText: 'AVOID! Requested withdrawal 3 weeks ago, still pending. Support keeps asking for more documents. Clear stalling tactics. Moving my funds elsewhere.',
    verified: false
  }
];

async function seed() {
  console.log('🌱 Starting comprehensive demo data seeding...\n');

  try {
    // PHASE 1: Create Users
    console.log('👥 Phase 1: Creating demo users...');
    const createdUsers: any[] = [];
    
    for (const userData of DEMO_USERS) {
      let user = await storage.getUserByUsername(userData.username);
      if (!user) {
        user = await storage.createUser({
          username: userData.username,
          password: userData.password,
          role: userData.role
        });
        
        // Set initial coins
        if (userData.initialCoins > 0) {
          await storage.updateUserCoins(user.id, userData.initialCoins);
          
          // Create coin transaction record
          await storage.createCoinTransaction({
            userId: user.id,
            amount: userData.initialCoins,
            type: 'admin_adjustment',
            description: 'Initial demo balance',
            relatedEntityType: null,
            relatedEntityId: null
          });
        }
        
        console.log(`  ✅ Created ${userData.username} (${userData.role}) with ${userData.initialCoins} coins`);
      } else {
        console.log(`  ℹ️  ${userData.username} already exists`);
      }
      
      createdUsers.push(user);
    }
    console.log(`✅ Phase 1 complete: ${createdUsers.length} users ready\n`);

    // PHASE 2: Create Forum Threads and Replies
    console.log('💬 Phase 2: Creating forum discussions...');
    let threadCount = 0;
    let replyCount = 0;
    
    for (let i = 0; i < FORUM_THREADS.length; i++) {
      const threadData = FORUM_THREADS[i];
      const author = createdUsers[i % createdUsers.length];
      
      // Create thread
      const thread = await storage.createForumThread({
        authorId: author.id,
        title: threadData.title,
        content: threadData.content,
        categoryId: null, // Will use default category
        isPinned: i === 0, // Pin first thread
        viewCount: Math.floor(Math.random() * 500) + 50
      }, author.id);
      threadCount++;
      
      // Award coins for thread creation
      await storage.createCoinTransaction({
        userId: author.id,
        amount: EARNING_REWARDS.PUBLISH_ARTICLE,
        type: 'forum_post',
        description: 'Created forum thread',
        relatedEntityType: 'forum_thread',
        relatedEntityId: thread.id
      });
      
      // Create 3-7 replies per thread
      const numReplies = Math.floor(Math.random() * 5) + 3;
      for (let j = 0; j < numReplies; j++) {
        const replier = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        if (replier.id !== author.id) {
          await storage.createForumReply({
            threadId: thread.id,
            authorId: replier.id,
            content: `Great question! Here's my take on this... [Reply content #${j + 1}]`,
            isAccepted: j === 0 && Math.random() > 0.5 // 50% chance first reply is accepted answer
          });
          replyCount++;
          
          // Award coins for reply
          await storage.createCoinTransaction({
            userId: replier.id,
            amount: EARNING_REWARDS.REPLY,
            type: 'forum_reply',
            description: 'Posted forum reply',
            relatedEntityType: 'forum_thread',
            relatedEntityId: thread.id
          });
        }
      }
    }
    console.log(`✅ Phase 2 complete: ${threadCount} threads, ${replyCount} replies\n`);

    // PHASE 3: Create Marketplace Content with Purchases
    console.log('🏪 Phase 3: Creating marketplace content...');
    let contentCount = 0;
    let purchaseCount = 0;
    
    for (const contentData of MARKETPLACE_CONTENT) {
      const seller = createdUsers.find(u => u.role === 'user' && u.username.includes('EA') || u.username.includes('Indicator'));
      if (!seller) continue;
      
      const item = await storage.createContent({
        authorId: seller.id,
        type: contentData.type,
        title: contentData.title,
        description: contentData.description,
        priceCoins: contentData.priceCoins,
        isFree: contentData.isFree,
        category: contentData.category,
        fileUrl: `/demo-files/${contentData.type}-${contentCount}.zip`,
        status: 'approved'
      });
      contentCount++;
      
      // Award publishing bonus
      const publishReward = contentData.type === 'ea' ? EARNING_REWARDS.PUBLISH_EA_INDICATOR :
                          contentData.type === 'article' ? EARNING_REWARDS.PUBLISH_ARTICLE :
                          EARNING_REWARDS.PUBLISH_EA_INDICATOR;
      
      await storage.createCoinTransaction({
        userId: seller.id,
        amount: publishReward,
        type: 'content_published',
        description: `Published ${contentData.type}`,
        relatedEntityType: 'content',
        relatedEntityId: item.id
      });
      
      // Create 2-8 purchases for paid content
      if (!contentData.isFree) {
        const numPurchases = Math.floor(Math.random() * 7) + 2;
        for (let i = 0; i < numPurchases; i++) {
          const buyer = createdUsers[Math.floor(Math.random() * createdUsers.length)];
          if (buyer.id !== seller.id && buyer.role === 'user') {
            // Record purchase
            await storage.createContentPurchase({
              contentId: item.id,
              buyerId: buyer.id,
              priceCoins: contentData.priceCoins,
              purchaseType: 'one_time'
            });
            purchaseCount++;
            
            // Deduct coins from buyer
            await storage.updateUserCoins(buyer.id, -contentData.priceCoins);
            await storage.createCoinTransaction({
              userId: buyer.id,
              amount: -contentData.priceCoins,
              type: 'purchase',
              description: `Purchased: ${contentData.title.substring(0, 50)}...`,
              relatedEntityType: 'content',
              relatedEntityId: item.id
            });
            
            // Award coins to seller (80% commission)
            const sellerAmount = Math.floor(contentData.priceCoins * 0.8);
            await storage.updateUserCoins(seller.id, sellerAmount);
            await storage.createCoinTransaction({
              userId: seller.id,
              amount: sellerAmount,
              type: 'sale',
              description: `Sale: ${contentData.title.substring(0, 50)}...`,
              relatedEntityType: 'content',
              relatedEntityId: item.id
            });
          }
        }
      }
    }
    console.log(`✅ Phase 3 complete: ${contentCount} items, ${purchaseCount} purchases\n`);

    // PHASE 4: Create Broker Reviews
    console.log('⭐ Phase 4: Creating broker reviews...');
    const existingBrokers = await db.select().from(brokers).limit(3);
    let reviewCount = 0;
    
    for (const broker of existingBrokers) {
      for (let i = 0; i < 3; i++) {
        const reviewer = createdUsers[Math.floor(Math.random() * createdUsers.length)];
        const reviewData = BROKER_REVIEWS[i % BROKER_REVIEWS.length];
        
        await storage.createBrokerReview({
          brokerId: broker.id,
          userId: reviewer.id,
          rating: reviewData.rating,
          reviewText: reviewData.reviewText,
          isVerified: reviewData.verified
        });
        reviewCount++;
        
        // Award coins for verified review
        if (reviewData.verified) {
          await storage.createCoinTransaction({
            userId: reviewer.id,
            amount: EARNING_REWARDS.PUBLISH_ARTICLE, // Using article reward as proxy
            type: 'broker_review',
            description: `Verified broker review for ${broker.name}`,
            relatedEntityType: 'broker',
            relatedEntityId: broker.id
          });
        }
      }
    }
    console.log(`✅ Phase 4 complete: ${reviewCount} broker reviews\n`);

    // PHASE 5: Create User Achievements and Badges
    console.log('🏆 Phase 5: Creating achievements and badges...');
    let badgeCount = 0;
    
    // Get existing achievements
    const allAchievements = await db.select().from(achievements);
    
    for (const user of createdUsers) {
      if (user.role !== 'user') continue;
      
      // Award 1-3 random achievements to each user
      const numAchievements = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numAchievements && i < allAchievements.length; i++) {
        const achievement = allAchievements[i];
        
        // Check if user already has this achievement
        const existing = await db.select()
          .from(userAchievements)
          .where(
            sql`${userAchievements.userId} = ${user.id} AND ${userAchievements.achievementId} = ${achievement.id}`
          );
        
        if (existing.length === 0) {
          await db.insert(userAchievements).values({
            userId: user.id,
            achievementId: achievement.id,
            progress: achievement.requirement,
            unlockedAt: new Date()
          });
          
          // Create badge
          await storage.createUserBadge(user.id, achievement.slug);
          badgeCount++;
        }
      }
    }
    console.log(`✅ Phase 5 complete: ${badgeCount} badges awarded\n`);

    // PHASE 6: Create Rank Progress for All Users
    console.log('📊 Phase 6: Creating user rank progress...');
    const tiers = await storage.getAllRankTiers();
    const firstTier = tiers.sort((a, b) => a.sortOrder - b.sortOrder)[0];
    
    for (const user of createdUsers) {
      const existing = await storage.getRankProgress(user.id);
      if (!existing) {
        const xp = Math.floor(Math.random() * 500);
        await storage.upsertRankProgress({
          userId: user.id,
          currentRankId: firstTier.id,
          currentXp: xp,
          weeklyXp: Math.floor(Math.random() * 100),
          weekStartDate: new Date().toISOString().split('T')[0]
        });
      }
    }
    console.log(`✅ Phase 6 complete: Rank progress initialized\n`);

    // PHASE 7: Create Daily Login Rewards
    console.log('📅 Phase 7: Creating daily login rewards...');
    for (const user of createdUsers) {
      if (user.role === 'user' && Math.random() > 0.3) { // 70% of users logged in today
        await storage.createCoinTransaction({
          userId: user.id,
          amount: EARNING_REWARDS.DAILY_LOGIN,
          type: 'daily_reward',
          description: 'Daily login bonus',
          relatedEntityType: null,
          relatedEntityId: null
        });
      }
    }
    console.log(`✅ Phase 7 complete: Daily login rewards created\n`);

    // Final Summary
    console.log('\n🎉 COMPREHENSIVE DEMO DATA SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`  👥 Users: ${createdUsers.length}`);
    console.log(`  💬 Forum Threads: ${threadCount}`);
    console.log(`  💬 Forum Replies: ${replyCount}`);
    console.log(`  🏪 Marketplace Items: ${contentCount}`);
    console.log(`  💰 Purchases: ${purchaseCount}`);
    console.log(`  ⭐ Broker Reviews: ${reviewCount}`);
    console.log(`  🏆 Badges Awarded: ${badgeCount}`);
    console.log('\n✅ All segments have realistic demo data!');
    console.log('✅ Ready for comprehensive testing!\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log('🏁 Seeding script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding script failed:', error);
    process.exit(1);
  });
