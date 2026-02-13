import { VisibleRange } from './types';

export class WindowManager {
  private itemHeight: number;
  private viewportHeight: number;
  private bufferSize: number;

  constructor(itemHeight: number, viewportHeight: number, bufferSize: number = 5) {
    this.itemHeight = itemHeight;
    this.viewportHeight = viewportHeight;
    this.bufferSize = bufferSize;
  }

  /**
   * Calculate the visible range based on scroll position
   */
  calculateVisibleRange(scrollTop: number): VisibleRange {
    // Calculate how many items fit in the viewport
    const itemsPerViewport = Math.ceil(this.viewportHeight / this.itemHeight);
    
    // Calculate the starting index based on scroll position
    const startIndex = Math.floor(scrollTop / this.itemHeight);
    
    // Calculate the ending index with buffer
    const endIndex = Math.min(
      startIndex + itemsPerViewport + this.bufferSize,
      Number.MAX_SAFE_INTEGER // Will be limited by total items later
    );

    return {
      start: Math.max(0, startIndex - this.bufferSize),
      end: endIndex
    };
  }

  /**
   * Update viewport height if it changes
   */
  updateViewportHeight(height: number): void {
    this.viewportHeight = height;
  }

  /**
   * Update item height if it changes
   */
  updateItemHeight(height: number): void {
    this.itemHeight = height;
  }
}