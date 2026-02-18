/**
 * Variable Height Manager
 * Manages variable height items with efficient position calculations
 */

import { HeightMeasurementCache } from './HeightMeasurementCache';
import { VisibleRange } from './types';

export interface VariableHeightConfig {
  estimatedHeight: number;
  minHeight: number;
  maxHeight: number;
  bufferSize: number;
}

export interface ItemPosition {
  index: number;
  offset: number;
  height: number;
}

export class VariableHeightManager {
  private heightCache: HeightMeasurementCache;
  private config: VariableHeightConfig;
  private totalItems: number = 0;
  private lastMeasuredIndex: number = -1;

  constructor(config?: Partial<VariableHeightConfig>) {
    this.config = {
      estimatedHeight: config?.estimatedHeight || 100,
      minHeight: config?.minHeight || 50,
      maxHeight: config?.maxHeight || 500,
      bufferSize: config?.bufferSize || 5
    };
    
    this.heightCache = new HeightMeasurementCache(this.config.estimatedHeight);
  }

  /**
   * Set total number of items
   */
  setTotalItems(total: number): void {
    this.totalItems = total;
  }

  /**
   * Measure item height from DOM element
   */
  measureElement(index: number, element: HTMLElement | null): number {
    if (!element) {
      return this.config.estimatedHeight;
    }
    
    const height = element.offsetHeight;
    
    // Clamp height between min and max
    const clampedHeight = Math.max(
      this.config.minHeight,
      Math.min(this.config.maxHeight, height)
    );
    
    this.heightCache.measureHeight(index, { offsetHeight: clampedHeight } as HTMLElement);
    this.lastMeasuredIndex = Math.max(this.lastMeasuredIndex, index);
    
    return clampedHeight;
  }

  /**
   * Get item position (offset and height)
   */
  getItemPosition(index: number): ItemPosition {
    const offset = this.heightCache.getOffset(index);
    const height = this.heightCache.getHeight(index);
    
    return {
      index,
      offset,
      height
    };
  }

  /**
   * Calculate visible range for variable heights
   */
  calculateVisibleRange(scrollTop: number, viewportHeight: number): VisibleRange {
    // Find start index based on scroll position
    const startIndex = this.heightCache.findIndexAtPosition(scrollTop, this.totalItems);
    
    // Calculate how many items fit in viewport
    let endIndex = startIndex;
    let currentOffset = this.heightCache.getOffset(startIndex);
    
    while (endIndex < this.totalItems && currentOffset < scrollTop + viewportHeight) {
      const height = this.heightCache.getHeight(endIndex);
      currentOffset += height;
      endIndex++;
    }
    
    // Add buffer
    const bufferedStart = Math.max(0, startIndex - this.config.bufferSize);
    const bufferedEnd = Math.min(this.totalItems - 1, endIndex + this.config.bufferSize);
    
    return {
      start: bufferedStart,
      end: bufferedEnd
    };
  }

  /**
   * Get total height of all items
   */
  getTotalHeight(): number {
    return this.heightCache.getTotalHeight(this.totalItems);
  }

  /**
   * Scroll to specific item index
   */
  scrollToIndex(index: number): number {
    const offset = this.heightCache.getOffset(index);
    return offset;
  }

  /**
   * Get items to render for current viewport
   */
  getItemsToRender(
    scrollTop: number,
    viewportHeight: number
  ): { items: ItemPosition[]; totalHeight: number } {
    const visibleRange = this.calculateVisibleRange(scrollTop, viewportHeight);
    const items: ItemPosition[] = [];
    
    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      items.push(this.getItemPosition(i));
    }
    
    return {
      items,
      totalHeight: this.getTotalHeight()
    };
  }

  /**
   * Handle height change (when item height changes dynamically)
   */
  onHeightChange(index: number, newHeight: number): void {
    const oldHeight = this.heightCache.getHeight(index);
    const heightDiff = newHeight - oldHeight;
    
    // Update cache
    this.heightCache.measureHeight(index, { offsetHeight: newHeight } as HTMLElement);
    
    // If height changed significantly, may need to adjust scroll position
    if (Math.abs(heightDiff) > 50) {
      // Large height change - may need to recalculate
      this.heightCache.invalidate(index);
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.heightCache.getStats(this.totalItems);
  }

  /**
   * Clear cache for specific range
   */
  clearRange(startIndex: number, endIndex: number): void {
    for (let i = startIndex; i <= endIndex; i++) {
      this.heightCache.clear(i);
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.heightCache.clearAll();
    this.lastMeasuredIndex = -1;
  }

  /**
   * Get last measured index
   */
  getLastMeasuredIndex(): number {
    return this.lastMeasuredIndex;
  }

  /**
   * Check if item is measured
   */
  isItemMeasured(index: number): boolean {
    return this.heightCache.isMeasured(index);
  }

  /**
   * Get measured items count
   */
  getMeasuredCount(): number {
    return this.heightCache.getStats(this.totalItems).measuredItems;
  }
}

export default VariableHeightManager;