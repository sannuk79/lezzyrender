/**
 * Preemptive Caching
 * Caches data before it's needed based on predictions
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  accessCount: number;
  expiry: number;
}

export interface CacheConfig {
  maxSize: number;
  defaultTTL: number;
  cleanupThreshold: number;
}

export class PreemptiveCache<T> {
  private cache: Map<number, CacheEntry<T>> = new Map();
  private config: CacheConfig;
  private accessHistory: number[] = [];

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: config?.maxSize || 1000,
      defaultTTL: config?.defaultTTL || 300000, // 5 minutes
      cleanupThreshold: config?.cleanupThreshold || 800
    };
  }

  /**
   * Preemptively cache data with priority
   */
  preemptiveCache(index: number, data: T, priority: 'low' | 'normal' | 'high' | 'critical' = 'normal'): void {
    // Check if we need to cleanup
    if (this.cache.size >= this.config.cleanupThreshold) {
      this.cleanup();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      priority,
      accessCount: 0,
      expiry: Date.now() + this.config.defaultTTL
    };

    this.cache.set(index, entry);
  }

  /**
   * Get cached data
   */
  get(index: number): T | null {
    const entry = this.cache.get(index);
    
    if (!entry) {
      return null;
    }

    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(index);
      return null;
    }

    // Update access count
    entry.accessCount++;
    this.trackAccess(index);

    return entry.data;
  }

  /**
   * Check if data is cached
   */
  has(index: number): boolean {
    const entry = this.cache.get(index);
    if (!entry) return false;
    
    // Check expiry
    if (Date.now() > entry.expiry) {
      this.cache.delete(index);
      return false;
    }
    
    return true;
  }

  /**
   * Get cached data for range
   */
  getRange(startIndex: number, endIndex: number): T[] {
    const results: T[] = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      const data = this.get(i);
      if (data !== null) {
        results.push(data);
      }
    }
    
    return results;
  }

  /**
   * Delete cached data
   */
  delete(index: number): boolean {
    return this.cache.delete(index);
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.accessHistory = [];
  }

  /**
   * Cleanup old/low-priority entries
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: number[] = [];

    // First pass: remove expired entries
    this.cache.forEach((entry, index) => {
      if (now > entry.expiry) {
        toDelete.push(index);
      }
    });

    // Second pass: remove low-priority entries if still over limit
    if (this.cache.size - toDelete.length > this.config.maxSize) {
      const sortedByPriority = Array.from(this.cache.entries())
        .filter(([index]) => !toDelete.includes(index))
        .sort((a, b) => {
          const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
          return priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
        });

      // Remove lowest priority entries
      const toRemove = Math.ceil(sortedByPriority.length * 0.2); // Remove 20%
      for (let i = 0; i < toRemove; i++) {
        toDelete.push(sortedByPriority[i][0]);
      }
    }

    // Delete marked entries
    toDelete.forEach(index => this.cache.delete(index));
  }

  /**
   * Track access for analytics
   */
  private trackAccess(index: number): void {
    this.accessHistory.push(index);
    if (this.accessHistory.length > 100) {
      this.accessHistory.shift();
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    avgAccessCount: number;
    byPriority: {
      critical: number;
      high: number;
      normal: number;
      low: number;
    };
  } {
    const byPriority = {
      critical: 0,
      high: 0,
      normal: 0,
      low: 0
    };

    let totalAccessCount = 0;

    this.cache.forEach(entry => {
      byPriority[entry.priority]++;
      totalAccessCount += entry.accessCount;
    });

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      hitRate: this.accessHistory.length > 0 ? 
        this.accessHistory.filter(i => this.has(i)).length / this.accessHistory.length : 0,
      avgAccessCount: this.cache.size > 0 ? totalAccessCount / this.cache.size : 0,
      byPriority
    };
  }

  /**
   * Get all cached indices
   */
  getCachedIndices(): number[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Preemptively cache range
   */
  cacheRange(startIndex: number, endIndex: number, dataFetcher: (index: number) => T, priority?: 'low' | 'normal' | 'high' | 'critical'): void {
    for (let i = startIndex; i <= endIndex; i++) {
      if (!this.has(i)) {
        const data = dataFetcher(i);
        this.preemptiveCache(i, data, priority);
      }
    }
  }

  /**
   * Get memory usage estimate
   */
  getMemoryUsage(): number {
    // Rough estimate based on cache size
    return this.cache.size * 1024; // Assume ~1KB per entry
  }
}

export default PreemptiveCache;