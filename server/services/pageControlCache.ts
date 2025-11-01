import { storage } from '../storage/index.js';
import type { PageControl } from '../../shared/schema.js';

interface CacheEntry {
  controls: PageControl[];
  timestamp: number;
}

class PageControlCache {
  private cache: CacheEntry | null = null;
  private readonly TTL = 60 * 1000; // 60 seconds

  async getControls(): Promise<PageControl[]> {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.cache && (now - this.cache.timestamp < this.TTL)) {
      return this.cache.controls;
    }

    // Fetch fresh data
    try {
      const controls = await storage.listPageControls();
      this.cache = { controls, timestamp: now };
      return controls;
    } catch (error) {
      console.error('[PageControlCache] Failed to fetch controls:', error);
      // Return stale cache if available, otherwise empty array
      return this.cache?.controls || [];
    }
  }

  invalidate() {
    this.cache = null;
    console.log('[PageControlCache] Cache invalidated');
  }

  matchRoute(pathname: string): PageControl | null {
    if (!this.cache) return null;

    for (const control of this.cache.controls) {
      // Skip live pages (no restriction)
      if (control.status === 'live') continue;

      const pattern = control.routePattern;

      // Exact match: /rewards === /rewards
      if (pattern === pathname) {
        console.log(`[PageControlCache] Exact match: ${pattern} === ${pathname}`);
        return control;
      }

      // Wildcard match: /admin/* matches /admin/users
      if (pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -2); // Remove /*
        if (pathname.startsWith(prefix + '/')) {
          console.log(`[PageControlCache] Wildcard match: ${pattern} matches ${pathname}`);
          return control;
        }
      }

      // Prefix match: /discussions* matches /discussions, /discussions/new
      if (pattern.endsWith('*') && !pattern.endsWith('/*')) {
        const prefix = pattern.slice(0, -1);
        if (pathname.startsWith(prefix)) {
          console.log(`[PageControlCache] Prefix match: ${pattern} matches ${pathname}`);
          return control;
        }
      }
    }

    return null;
  }
}

export const pageControlCache = new PageControlCache();

// Invalidate cache when page controls are modified
export function invalidatePageControlCache() {
  pageControlCache.invalidate();
}
