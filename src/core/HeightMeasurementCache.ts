/**
 * Height Measurement Cache
 * Dynamically measures and caches item heights for variable height support
 */

export interface HeightCacheEntry {
  height: number;
  measured: boolean;
  timestamp: number;
}

export interface HeightCacheStats {
  totalItems: number;
  measuredItems: number;
  estimatedItems: number;
  cacheSize: number;
  hitRate: number;
}

export class HeightMeasurementCache {
  private heightMap: Map<number, HeightCacheEntry> = new Map();
  private offsetMap: Map<number, number> = new Map();
  private estimatedHeight: number;
  private totalHeight: number = 0;
  private accessCount: number = 0;
  private hitCount: number = 0;
  private readonly DEFAULT_TTL: number = 60000; // 1 minute

  constructor(estimatedHeight: number = 100) {
    this.estimatedHeight = estimatedHeight;
  }

  /**
   * Measure and cache height for an item
   */
  measureHeight(index: number, element: HTMLElement): number {
    const height = element.offsetHeight;
    
    this.heightMap.set(index, {
      height,
      measured: true,
      timestamp: Date.now()
    });
    
    // Recalculate offsets
    this.recalculateOffsets();
    
    return height;
  }

  /**
   * Get height for an item (measured or estimated)
   */
  getHeight(index: number): number {
    this.accessCount++;
    
    const entry = this.heightMap.get(index);
    
    if (entry) {
      this.hitCount++;
      return entry.height;
    }
    
    // Return estimated height for unmeasured items
    return this.estimatedHeight;
  }

  /**
   * Get offset (cumulative height) for an item
   */
  getOffset(index: number): number {
    const offset = this.offsetMap.get(index);
    return offset !== undefined ? offset : index * this.estimatedHeight;
  }

  /**
   * Check if item height is measured
   */
  isMeasured(index: number): boolean {
    return this.heightMap.has(index);
  }

  /**
   * Mark item as needing remeasurement
   */
  invalidate(index: number): void {
    const entry = this.heightMap.get(index);
    if (entry) {
      entry.measured = false;
    }
  }

  /**
   * Clear specific item from cache
   */
  clear(index: number): void {
    this.heightMap.delete(index);
    this.recalculateOffsets();
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.heightMap.clear();
    this.offsetMap.clear();
    this.totalHeight = 0;
    this.accessCount = 0;
    this.hitCount = 0;
  }

  /**
   * Recalculate all offsets
   */
  private recalculateOffsets(): void {
    this.offsetMap.clear();
    let currentOffset = 0;
    
    // We need to calculate offsets for all items
    // This is called when heights change
    const indices = Array.from(this.heightMap.keys()).sort((a, b) => a - b);
    
    for (const index of indices) {
      this.offsetMap.set(index, currentOffset);
      const entry = this.heightMap.get(index);
      if (entry) {
        currentOffset += entry.height;
      } else {
        currentOffset += this.estimatedHeight;
      }
    }
    
    this.totalHeight = currentOffset;
  }

  /**
   * Get total height of all items
   */
  getTotalHeight(totalItems: number): number {
    if (this.heightMap.size === 0) {
      return totalItems * this.estimatedHeight;
    }
    
    // Calculate based on measured + estimated
    let total = 0;
    for (let i = 0; i < totalItems; i++) {
      total += this.getHeight(i);
    }
    
    return total;
  }

  /**
   * Find item index at a specific scroll position
   */
  findIndexAtPosition(position: number, totalItems: number): number {
    let low = 0;
    let high = totalItems - 1;
    
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const offset = this.getOffset(mid);
      
      if (offset < position) {
        low = mid + 1;
      } else if (offset > position) {
        high = mid - 1;
      } else {
        return mid;
      }
    }
    
    return low;
  }

  /**
   * Get cache statistics
   */
  getStats(totalItems: number): HeightCacheStats {
    const measuredItems = this.heightMap.size;
    const estimatedItems = totalItems - measuredItems;
    
    return {
      totalItems,
      measuredItems,
      estimatedItems,
      cacheSize: this.heightMap.size,
      hitRate: this.accessCount > 0 ? this.hitCount / this.accessCount : 0
    };
  }

  /**
   * Update estimated height
   */
  updateEstimatedHeight(height: number): void {
    this.estimatedHeight = height;
  }

  /**
   * Get estimated height
   */
  getEstimatedHeight(): number {
    return this.estimatedHeight;
  }

  /**
   * Cleanup old entries (older than TTL)
   */
  cleanup(ttl: number = this.DEFAULT_TTL): void {
    const now = Date.now();
    const toDelete: number[] = [];
    
    this.heightMap.forEach((entry, index) => {
      if (now - entry.timestamp > ttl) {
        toDelete.push(index);
      }
    });
    
    toDelete.forEach(index => this.clear(index));
  }

  /**
   * Get all measured heights
   */
  getAllHeights(): Map<number, number> {
    const heights = new Map<number, number>();
    this.heightMap.forEach((entry, index) => {
      heights.set(index, entry.height);
    });
    return heights;
  }

  /**
   * Set heights in bulk (for initial data load)
   */
  setHeightsBulk(heights: Map<number, number>): void {
    heights.forEach((height, index) => {
      this.heightMap.set(index, {
        height,
        measured: true,
        timestamp: Date.now()
      });
    });
    this.recalculateOffsets();
  }
}

export default HeightMeasurementCache;