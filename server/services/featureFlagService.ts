import { storage } from '../storage/index.js';
import type { FeatureFlag } from '@shared/schema';

interface CacheEntry {
  data: FeatureFlag[];
  timestamp: number;
}

/**
 * Feature Flag Service with in-memory caching
 * Cache TTL: 60 seconds
 */
class FeatureFlagService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 60000; // 60 seconds
  private readonly CACHE_KEY = 'all_flags';

  /**
   * Warm the cache on server start
   */
  async warmCache(): Promise<void> {
    try {
      console.log('[FEATURE FLAGS] Warming cache...');
      const flags = await storage.listFeatureFlags();
      this.cache.set(this.CACHE_KEY, {
        data: flags,
        timestamp: Date.now(),
      });
      console.log(`[FEATURE FLAGS] Cache warmed with ${flags.length} flags`);
    } catch (error) {
      console.error('[FEATURE FLAGS] Error warming cache:', error);
    }
  }

  /**
   * Get all feature flags (from cache if available)
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    const cached = this.cache.get(this.CACHE_KEY);
    
    // Return cached data if valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    // Fetch fresh data
    const flags = await storage.listFeatureFlags();
    this.cache.set(this.CACHE_KEY, {
      data: flags,
      timestamp: Date.now(),
    });

    return flags;
  }

  /**
   * Get feature flag status by slug
   * Returns 'enabled' | 'disabled' | 'coming_soon' | null
   */
  async isFeatureEnabled(slug: string): Promise<'enabled' | 'disabled' | 'coming_soon' | null> {
    try {
      const flags = await this.getAllFlags();
      const flag = flags.find(f => f.slug === slug);
      
      if (!flag) {
        console.warn(`[FEATURE FLAGS] Flag not found: ${slug}`);
        return null;
      }

      return flag.status as 'enabled' | 'disabled' | 'coming_soon';
    } catch (error) {
      console.error(`[FEATURE FLAGS] Error checking flag ${slug}:`, error);
      return null;
    }
  }

  /**
   * Get feature flag by slug (with full details)
   */
  async getFlag(slug: string): Promise<FeatureFlag | null> {
    try {
      const flags = await this.getAllFlags();
      return flags.find(f => f.slug === slug) || null;
    } catch (error) {
      console.error(`[FEATURE FLAGS] Error getting flag ${slug}:`, error);
      return null;
    }
  }

  /**
   * Invalidate the cache (call after flag updates)
   */
  invalidateCache(): void {
    console.log('[FEATURE FLAGS] Cache invalidated');
    this.cache.clear();
  }
}

// Export singleton instance
export const featureFlagService = new FeatureFlagService();

// Warm cache on import
featureFlagService.warmCache();
