import type { IStorage } from '../storage';
import type { 
  RankTier, 
  UserRankProgress, 
  FeatureUnlock,
  Achievement
} from '@shared/schema';
import { db } from '../db';
import { achievements, userAchievements } from '@shared/schema';
import { eq, and, isNull } from 'drizzle-orm';
import { emitSweetsXpAwarded } from './dashboardWebSocket';

/**
 * Activity XP Configuration
 * Maps activity types to their XP rewards
 */
export const ACTIVITY_XP_CONFIG: Record<string, number> = {
  forum_post: 10,
  forum_reply: 5,
  marketplace_sale: 50,
  content_upload: 25,
  profile_complete: 20,
};

/**
 * Weekly XP Cap (optional - can be configured per activity or globally)
 */
const WEEKLY_XP_CAP = 1000; // Maximum XP per week per user

/**
 * User Progress Response
 */
export interface UserProgress {
  userId: string;
  currentXp: number;
  weeklyXp: number;
  currentRank: RankTier;
  nextRank: RankTier | null;
  xpToNextRank: number;
  featureUnlocks: FeatureUnlock[];
  weekStartDate: string;
}

/**
 * XP Award Result
 */
export interface XpAwardResult {
  success: boolean;
  xpAwarded: number;
  totalXp: number;
  weeklyXp: number;
  rankChanged: boolean;
  oldRank?: RankTier;
  newRank?: RankTier;
  newUnlocks?: FeatureUnlock[];
  capReached?: boolean;
}

/**
 * Sweets Service Interface
 */
export interface ISweetsService {
  /**
   * Get user's XP, rank, and feature unlocks
   */
  getUserProgress(userId: string): Promise<UserProgress>;
  
  /**
   * Award XP and handle rank transitions
   */
  awardXp(
    userId: string, 
    activity: string, 
    xpAmount: number, 
    metadata?: Record<string, any>
  ): Promise<XpAwardResult>;
  
  /**
   * Determine rank tier based on XP thresholds
   */
  calculateRank(xp: number): Promise<RankTier>;
  
  /**
   * Handle rank upgrades/downgrades
   */
  processRankTransition(
    userId: string, 
    oldRank: RankTier, 
    newRank: RankTier
  ): Promise<void>;
  
  /**
   * Reset weekly XP (for all users if userId not provided)
   */
  resetWeeklyXp(userId?: string): Promise<void>;
  
  /**
   * Get user's unlocked features based on current rank
   */
  getFeatureUnlocks(userId: string): Promise<FeatureUnlock[]>;
  
  /**
   * Check and grant achievements based on XP milestones
   */
  syncAchievements(
    userId: string, 
    totalXp: number, 
    activityKey: string
  ): Promise<string[]>;
}

/**
 * Create Sweets Service Factory
 */
export function createSweetsService(storage: IStorage): ISweetsService {
  // Cache rank tiers for performance
  let rankTiersCache: RankTier[] | null = null;
  
  /**
   * Load and cache rank tiers
   */
  async function loadRankTiers(): Promise<RankTier[]> {
    if (!rankTiersCache) {
      rankTiersCache = await storage.getAllRankTiers();
    }
    return rankTiersCache;
  }
  
  /**
   * Calculate current week start date
   */
  function getCurrentWeekStart(): string {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split('T')[0];
  }
  
  /**
   * Calculate week end date from start date
   */
  function getWeekEnd(weekStart: string): string {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end.toISOString().split('T')[0];
  }
  
  /**
   * Initialize user rank progress if not exists
   */
  async function ensureUserProgress(userId: string): Promise<UserRankProgress> {
    let progress = await storage.getRankProgress(userId);
    
    if (!progress) {
      // ISSUE 1 FIX: Dynamically get the first rank ID from rank tiers
      const tiers = await loadRankTiers();
      const firstRank = tiers.sort((a, b) => a.sortOrder - b.sortOrder)[0];
      
      // Create initial progress with dynamically determined first rank
      progress = await storage.upsertRankProgress({
        userId,
        currentRankId: firstRank.id,
        currentXp: 0,
        weeklyXp: 0,
        weekStartDate: getCurrentWeekStart(),
      });
    }
    
    // Check if we need to reset weekly XP (new week)
    const currentWeekStart = getCurrentWeekStart();
    if (progress.weekStartDate !== currentWeekStart) {
      progress = await storage.upsertRankProgress({
        userId,
        currentRankId: progress.currentRankId,
        currentXp: progress.currentXp,
        weeklyXp: 0,
        weekStartDate: currentWeekStart,
      });
    }
    
    return progress;
  }
  
  return {
    /**
     * Get user's progress with rank and unlocks
     */
    async getUserProgress(userId: string): Promise<UserProgress> {
      const progress = await ensureUserProgress(userId);
      const tiers = await loadRankTiers();
      
      const currentRank = tiers.find(t => t.id === progress.currentRankId) || tiers[0];
      const nextRank = tiers.find(t => t.minXp > progress.currentXp) || null;
      
      const xpToNextRank = nextRank 
        ? nextRank.minXp - progress.currentXp 
        : 0;
      
      // ISSUE 2 FIX: Get cumulative feature unlocks from all earned ranks
      const featureUnlocks = await this.getFeatureUnlocks(userId);
      
      return {
        userId,
        currentXp: progress.currentXp,
        weeklyXp: progress.weeklyXp,
        currentRank,
        nextRank,
        xpToNextRank,
        featureUnlocks,
        weekStartDate: progress.weekStartDate,
      };
    },
    
    /**
     * Award XP with full pipeline
     */
    async awardXp(
      userId: string, 
      activity: string, 
      xpAmount: number, 
      metadata?: Record<string, any>
    ): Promise<XpAwardResult> {
      // Ensure user progress exists
      let progress = await ensureUserProgress(userId);
      
      // Get configured XP amount if not provided
      const finalXpAmount = xpAmount || ACTIVITY_XP_CONFIG[activity] || 0;
      
      if (finalXpAmount <= 0) {
        return {
          success: false,
          xpAwarded: 0,
          totalXp: progress.currentXp,
          weeklyXp: progress.weeklyXp,
          rankChanged: false,
        };
      }
      
      // Check weekly XP cap
      const newWeeklyXp = progress.weeklyXp + finalXpAmount;
      let cappedXpAmount = finalXpAmount;
      let capReached = false;
      
      if (newWeeklyXp > WEEKLY_XP_CAP) {
        cappedXpAmount = Math.max(0, WEEKLY_XP_CAP - progress.weeklyXp);
        capReached = true;
      }
      
      if (cappedXpAmount === 0) {
        return {
          success: false,
          xpAwarded: 0,
          totalXp: progress.currentXp,
          weeklyXp: progress.weeklyXp,
          rankChanged: false,
          capReached: true,
        };
      }
      
      // Calculate new XP totals
      const newTotalXp = progress.currentXp + cappedXpAmount;
      const newWeeklyTotal = progress.weeklyXp + cappedXpAmount;
      
      // Determine rank before and after
      const tiers = await loadRankTiers();
      const oldRank = tiers.find(t => t.id === progress.currentRankId) || tiers[0];
      const newRank = await this.calculateRank(newTotalXp);
      
      const rankChanged = oldRank.id !== newRank.id;
      
      // Update progress
      progress = await storage.upsertRankProgress({
        userId,
        currentRankId: newRank.id,
        currentXp: newTotalXp,
        weeklyXp: newWeeklyTotal,
        weekStartDate: progress.weekStartDate,
      });
      
      // Log XP event in weekly earnings
      await storage.logXpEvent(userId, activity, cappedXpAmount, metadata);
      
      // Handle rank transition if changed
      let newUnlocks: FeatureUnlock[] | undefined;
      if (rankChanged) {
        await this.processRankTransition(userId, oldRank, newRank);
        // ISSUE 2 FIX: Get cumulative feature unlocks from all earned ranks
        newUnlocks = await this.getFeatureUnlocks(userId);
      }
      
      // Sync achievements
      await this.syncAchievements(userId, newTotalXp, activity);
      
      // Emit WebSocket event for real-time UI updates
      emitSweetsXpAwarded(userId, {
        xpAwarded: cappedXpAmount,
        newTotalXp: newTotalXp,
        rankChanged,
        newRank: rankChanged ? newRank : undefined,
        newlyUnlockedFeatures: rankChanged ? newUnlocks : undefined,
      });
      
      return {
        success: true,
        xpAwarded: cappedXpAmount,
        totalXp: newTotalXp,
        weeklyXp: newWeeklyTotal,
        rankChanged,
        oldRank: rankChanged ? oldRank : undefined,
        newRank: rankChanged ? newRank : undefined,
        newUnlocks,
        capReached,
      };
    },
    
    /**
     * Calculate rank based on XP thresholds
     */
    async calculateRank(xp: number): Promise<RankTier> {
      const tiers = await loadRankTiers();
      
      // Find the highest rank where xp >= minXp and (maxXp is null or xp < maxXp)
      let appropriateRank = tiers[0]; // Default to first rank
      
      for (const tier of tiers) {
        const meetsMinimum = xp >= tier.minXp;
        const belowMaximum = tier.maxXp === null || xp <= tier.maxXp;
        
        if (meetsMinimum && belowMaximum) {
          appropriateRank = tier;
          // Don't break - continue to find the highest qualifying tier
        }
      }
      
      return appropriateRank;
    },
    
    /**
     * Process rank transition (upgrade or downgrade)
     */
    async processRankTransition(
      userId: string, 
      oldRank: RankTier, 
      newRank: RankTier
    ): Promise<void> {
      const isUpgrade = newRank.minXp > oldRank.minXp;
      
      // Create notification for rank change
      await storage.createNotification({
        userId,
        type: 'system',
        title: isUpgrade ? '🎉 Rank Up!' : 'Rank Changed',
        message: `You ${isUpgrade ? 'advanced' : 'changed'} to ${newRank.name}!`,
        actionUrl: `/dashboard`,
      });
      
      // Log activity for rank change
      await storage.createActivity({
        userId,
        activityType: 'badge_earned',
        entityType: 'badge',
        entityId: `rank_${newRank.id}`,
        title: `${isUpgrade ? 'Advanced' : 'Changed'} to ${newRank.name}`,
        description: `${isUpgrade ? 'Advanced' : 'Changed'} to ${newRank.name}`,
      });
      
      // Award badge for rank achievement if upgrade
      if (isUpgrade) {
        const badgeType = `rank_${newRank.name.toLowerCase().replace(/\s+/g, '_')}`;
        const hasBadge = await storage.hasUserBadge(userId, badgeType);
        
        if (!hasBadge) {
          await storage.createUserBadge(userId, badgeType);
        }
      }
    },
    
    /**
     * Reset weekly XP
     */
    async resetWeeklyXp(userId?: string): Promise<void> {
      const currentWeekStart = getCurrentWeekStart();
      
      if (userId) {
        // Reset for specific user
        const progress = await storage.getRankProgress(userId);
        if (progress) {
          await storage.upsertRankProgress({
            userId,
            currentRankId: progress.currentRankId,
            currentXp: progress.currentXp,
            weeklyXp: 0,
            weekStartDate: currentWeekStart,
          });
        }
      } else {
        // Reset for all users - this would typically be a scheduled job
        // For now, we'll just log a warning as this should be done via a cron job
        console.warn('resetWeeklyXp called for all users - this should be handled by a scheduled job');
        // Implementation would query all users and reset their weekly XP
      }
    },
    
    /**
     * Get user's feature unlocks
     */
    async getFeatureUnlocks(userId: string): Promise<FeatureUnlock[]> {
      const progress = await ensureUserProgress(userId);
      const unlocks = await storage.getFeatureUnlocksByRank(progress.currentRankId);
      
      // Also get unlocks from all previous ranks (cumulative)
      const tiers = await loadRankTiers();
      const currentTierIndex = tiers.findIndex(t => t.id === progress.currentRankId);
      
      const allUnlocks: FeatureUnlock[] = [];
      for (let i = 0; i <= currentTierIndex; i++) {
        const tierUnlocks = await storage.getFeatureUnlocksByRank(tiers[i].id);
        allUnlocks.push(...tierUnlocks);
      }
      
      // Remove duplicates by featureKey
      const uniqueUnlocks = allUnlocks.reduce((acc, unlock) => {
        if (!acc.find(u => u.featureKey === unlock.featureKey)) {
          acc.push(unlock);
        }
        return acc;
      }, [] as FeatureUnlock[]);
      
      return uniqueUnlocks;
    },
    
    /**
     * Sync achievements based on XP milestones
     * ISSUE 3 FIX: Properly persist to achievements/userAchievements tables
     */
    async syncAchievements(
      userId: string, 
      totalXp: number, 
      activityKey: string
    ): Promise<string[]> {
      const awardedAchievements: string[] = [];
      
      try {
        // a. Get all XP-based achievements from achievements table
        const allAchievements = await db
          .select()
          .from(achievements)
          .where(eq(achievements.category, 'xp_milestone'));
        
        // b. Get existing user achievements from userAchievements table
        const existingAchievements = await db
          .select()
          .from(userAchievements)
          .where(eq(userAchievements.userId, userId));
        
        const existingAchievementIds = new Set(
          existingAchievements.map(ua => ua.achievementId)
        );
        
        // c. Check which achievements the user now qualifies for
        for (const achievement of allAchievements) {
          // Skip if user already has this achievement
          if (existingAchievementIds.has(achievement.id)) {
            continue;
          }
          
          // Check if user meets the requirement (XP threshold)
          if (totalXp >= achievement.requirement) {
            // Insert into userAchievements table
            await db.insert(userAchievements).values({
              userId,
              achievementId: achievement.id,
              progress: achievement.requirement,
              unlockedAt: new Date(),
            });
            
            // d. Create badge for backward compatibility
            const badgeType = achievement.slug;
            const hasBadge = await storage.hasUserBadge(userId, badgeType);
            if (!hasBadge) {
              await storage.createUserBadge(userId, badgeType);
            }
            
            // Track newly awarded achievement
            awardedAchievements.push(achievement.slug);
            
            // Create notification for achievement
            await storage.createNotification({
              userId,
              type: 'system',
              title: '🏆 Achievement Unlocked!',
              message: `You earned: ${achievement.name}`,
              actionUrl: `/dashboard`,
            });
          }
        }
      } catch (error) {
        console.error('Error syncing achievements:', error);
        // Don't throw - achievement sync should not block XP awards
      }
      
      return awardedAchievements;
    },
  };
}

/**
 * Export singleton instance creator
 */
let sweetsServiceInstance: ISweetsService | null = null;

export function getSweetsService(storage: IStorage): ISweetsService {
  if (!sweetsServiceInstance) {
    sweetsServiceInstance = createSweetsService(storage);
  }
  return sweetsServiceInstance;
}
