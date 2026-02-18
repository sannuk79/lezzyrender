export class MemoryManager {
  private itemCache: Map<number, any> = new Map();
  private maxCacheSize: number = 1000; // Maximum items to keep in cache
  private cleanupThreshold: number = 500; // Start cleanup when cache exceeds this
  private visibleRange: { start: number; end: number } = { start: 0, end: 0 };
  private totalItems: number = 0;
  
  constructor(maxCacheSize: number = 1000) {
    this.maxCacheSize = maxCacheSize;
  }
  
  // Set visible range to optimize cache
  setVisibleRange(range: { start: number; end: number }): void {
    this.visibleRange = range;
  }
  
  // Set total number of items
  setTotalItems(total: number): void {
    this.totalItems = total;
  }
  
  // Get item from cache
  get(key: number): any | null {
    return this.itemCache.get(key) || null;
  }
  
  // Set item in cache
  set(key: number, value: any): void {
    this.itemCache.set(key, value);
    
    // Clean up if cache is too large
    if (this.itemCache.size > this.maxCacheSize) {
      this.cleanupCache();
    }
  }
  
  // Check if item exists in cache
  has(key: number): boolean {
    return this.itemCache.has(key);
  }
  
  // Remove item from cache
  delete(key: number): boolean {
    return this.itemCache.delete(key);
  }
  
  // Clear entire cache
  clear(): void {
    this.itemCache.clear();
  }
  
  // Clean up cache based on visibility and distance from visible range
  cleanupCache(): void {
    if (this.itemCache.size <= this.cleanupThreshold) {
      return; // No need to clean up
    }
    
    const itemsToRemove: number[] = [];
    
    // Find items that are far from visible range
    for (const [key] of this.itemCache.entries()) {
      const distanceFromVisible = this.getDistanceFromVisible(key);
      
      // Remove items that are far from visible range
      if (distanceFromVisible > 100) { // Arbitrary threshold
        itemsToRemove.push(key);
      }
    }
    
    // If we still have too many items, remove oldest accessed items
    if (this.itemCache.size - itemsToRemove.length > this.cleanupThreshold) {
      const sortedKeys = Array.from(this.itemCache.keys())
        .sort((a, b) => a - b); // Sort by key (assuming they're indexes)
      
      // Remove items that are furthest from visible range
      for (const key of sortedKeys) {
        if (this.itemCache.size <= this.cleanupThreshold) break;
        
        const distance = this.getDistanceFromVisible(key);
        if (distance > 50) { // Remove items beyond 50 units from visible
          itemsToRemove.push(key);
        }
      }
    }
    
    // Actually remove items
    for (const key of itemsToRemove) {
      this.itemCache.delete(key);
    }
  }
  
  // Calculate distance from visible range
  private getDistanceFromVisible(index: number): number {
    if (index >= this.visibleRange.start && index <= this.visibleRange.end) {
      return 0; // Inside visible range
    }
    
    if (index < this.visibleRange.start) {
      return this.visibleRange.start - index;
    }
    
    return index - this.visibleRange.end;
  }
  
  // Get cache statistics
  getStats(): {
    size: number;
    maxCacheSize: number;
    visibleItems: number;
    offScreenItems: number;
    memoryEstimate: number;
  } {
    const visibleItems = Array.from(this.itemCache.keys())
      .filter(key => key >= this.visibleRange.start && key <= this.visibleRange.end)
      .length;
    
    const offScreenItems = this.itemCache.size - visibleItems;
    
    // Rough estimate of memory usage (in bytes)
    let memoryEstimate = 0;
    for (const [_, value] of this.itemCache.entries()) {
      memoryEstimate += this.estimateObjectSize(value);
    }
    
    return {
      size: this.itemCache.size,
      maxCacheSize: this.maxCacheSize,
      visibleItems,
      offScreenItems,
      memoryEstimate
    };
  }
  
  // Estimate object size in bytes
  private estimateObjectSize(obj: any): number {
    if (obj === null || obj === undefined) return 0;
    
    if (typeof obj === 'string') return obj.length * 2; // UTF-16 chars
    if (typeof obj === 'number') return 8; // 8 bytes for number
    if (typeof obj === 'boolean') return 4; // 4 bytes for boolean
    
    if (typeof obj === 'object') {
      let size = 0;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          size += key.length * 2; // Key size
          size += this.estimateObjectSize(obj[key]); // Value size
        }
      }
      return size;
    }
    
    return 0; // Other types
  }
  
  // Prune cache to only keep essential items
  pruneEssential(): void {
    const essentialItems: [number, any][] = [];
    
    // Keep items in visible range and nearby
    for (const [key, value] of this.itemCache.entries()) {
      if (this.isEssential(key)) {
        essentialItems.push([key, value]);
      }
    }
    
    // Clear cache and repopulate with essential items
    this.itemCache.clear();
    for (const [key, value] of essentialItems) {
      this.itemCache.set(key, value);
    }
  }
  
  // Check if item is essential (within buffer zone)
  private isEssential(index: number): boolean {
    const bufferZone = 20; // Keep items within 20 positions of visible range
    return index >= (this.visibleRange.start - bufferZone) && 
           index <= (this.visibleRange.end + bufferZone);
  }
  
  // Get cache size
  getSize(): number {
    return this.itemCache.size;
  }
  
  // Get cache keys
  getKeys(): number[] {
    return Array.from(this.itemCache.keys());
  }
}