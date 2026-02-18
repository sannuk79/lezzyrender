/**
 * Dynamic Height Engine
 * Core engine for variable height virtual scrolling
 */

import { HeightMeasurementCache } from './HeightMeasurementCache';
import { VariableHeightManager } from './VariableHeightManager';
import { VisibleRange, EngineState, EngineConfig } from './types';

export interface DynamicHeightConfig extends EngineConfig {
  estimatedItemHeight: number;
  minItemHeight: number;
  maxItemHeight: number;
  heightBufferSize: number;
}

export interface DynamicHeightState extends EngineState {
  totalContentHeight: number;
  measuredItems: number;
  estimatedItems: number;
}

export class DynamicHeightEngine {
  private config: DynamicHeightConfig;
  private variableHeightManager: VariableHeightManager;
  private heightCache: HeightMeasurementCache;
  
  private state: DynamicHeightState;
  private containerElement: HTMLElement | null = null;
  private itemElements: Map<number, HTMLElement> = new Map();

  constructor(config: Partial<DynamicHeightConfig> = {}) {
    this.config = {
      itemHeight: config.estimatedItemHeight || 100,
      viewportHeight: config.viewportHeight || 400,
      bufferSize: config.heightBufferSize || 5,
      estimatedItemHeight: config.estimatedItemHeight || 100,
      minItemHeight: config.minItemHeight || 50,
      maxItemHeight: config.maxItemHeight || 500,
      heightBufferSize: config.heightBufferSize || 5
    };
    
    this.variableHeightManager = new VariableHeightManager({
      estimatedHeight: this.config.estimatedItemHeight,
      minHeight: this.config.minItemHeight,
      maxHeight: this.config.maxItemHeight,
      bufferSize: this.config.heightBufferSize
    });
    
    this.heightCache = new HeightMeasurementCache(this.config.estimatedItemHeight);
    
    this.state = {
      scrollTop: 0,
      visibleRange: { start: 0, end: 0 },
      loadedItems: 0,
      isLoading: false,
      totalContentHeight: 0,
      measuredItems: 0,
      estimatedItems: 0
    };
  }

  /**
   * Initialize with container element
   */
  init(container: HTMLElement): void {
    this.containerElement = container;
    this.setupScrollListener();
  }

  /**
   * Setup scroll listener
   */
  private setupScrollListener(): void {
    if (!this.containerElement) return;
    
    this.containerElement.addEventListener('scroll', () => {
      this.onScroll();
    }, { passive: true });
  }

  /**
   * Handle scroll event
   */
  private onScroll(): void {
    if (!this.containerElement) return;
    
    const scrollTop = this.containerElement.scrollTop;
    this.state.scrollTop = scrollTop;
    
    // Recalculate visible range
    this.updateVisibleRange();
  }

  /**
   * Update visible range based on scroll position
   */
  private updateVisibleRange(): void {
    if (!this.containerElement) return;
    
    const viewportHeight = this.containerElement.clientHeight;
    const visibleRange = this.variableHeightManager.calculateVisibleRange(
      this.state.scrollTop,
      viewportHeight
    );
    
    this.state.visibleRange = visibleRange;
    
    // Update state with measured/estimated counts
    const stats = this.variableHeightManager.getCacheStats();
    this.state.measuredItems = stats.measuredItems;
    this.state.estimatedItems = stats.estimatedItems;
    this.state.totalContentHeight = this.variableHeightManager.getTotalHeight();
  }

  /**
   * Measure item height from DOM element
   */
  measureItem(index: number, element: HTMLElement): number {
    const height = this.variableHeightManager.measureElement(index, element);
    
    // Store element reference
    this.itemElements.set(index, element);
    
    // Update state
    const stats = this.variableHeightManager.getCacheStats();
    this.state.measuredItems = stats.measuredItems;
    this.state.estimatedItems = stats.estimatedItems;
    this.state.totalContentHeight = this.variableHeightManager.getTotalHeight();
    
    // Trigger re-render if needed
    this.onHeightMeasured(index, height);
    
    return height;
  }

  /**
   * Called when item height is measured
   */
  private onHeightMeasured(index: number, height: number): void {
    // Can be overridden to trigger UI updates
    // For example, update styles or trigger re-render
  }

  /**
   * Get items to render for current viewport
   */
  getItemsToRender(): {
    items: Array<{ index: number; offset: number; height: number }>;
    totalHeight: number;
    visibleRange: VisibleRange;
  } {
    if (!this.containerElement) {
      return {
        items: [],
        totalHeight: 0,
        visibleRange: { start: 0, end: 0 }
      };
    }
    
    const { items, totalHeight } = this.variableHeightManager.getItemsToRender(
      this.state.scrollTop,
      this.containerElement.clientHeight
    );
    
    return {
      items,
      totalHeight,
      visibleRange: this.state.visibleRange
    };
  }

  /**
   * Scroll to specific item index
   */
  scrollToIndex(index: number): void {
    if (!this.containerElement) return;
    
    const offset = this.variableHeightManager.scrollToIndex(index);
    this.containerElement.scrollTop = offset;
    
    // Update state
    this.state.scrollTop = offset;
    this.updateVisibleRange();
  }

  /**
   * Set total number of items
   */
  setTotalItems(total: number): void {
    this.variableHeightManager.setTotalItems(total);
    this.state.loadedItems = total;
    this.state.totalContentHeight = this.variableHeightManager.getTotalHeight();
  }

  /**
   * Get current state
   */
  getState(): DynamicHeightState {
    return { ...this.state };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.variableHeightManager.getCacheStats();
  }

  /**
   * Clear cache for range
   */
  clearCacheRange(startIndex: number, endIndex: number): void {
    this.variableHeightManager.clearRange(startIndex, endIndex);
    
    // Clear element references
    for (let i = startIndex; i <= endIndex; i++) {
      this.itemElements.delete(i);
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.variableHeightManager.clearCache();
    this.itemElements.clear();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.containerElement) {
      this.containerElement.removeEventListener('scroll', this.onScroll.bind(this));
    }
    this.clearCache();
  }

  /**
   * Update viewport height
   */
  updateViewportHeight(height: number): void {
    this.config.viewportHeight = height;
    this.updateVisibleRange();
  }

  /**
   * Get item offset for styling
   */
  getItemOffset(index: number): number {
    return this.variableHeightManager.getItemPosition(index).offset;
  }

  /**
   * Get item height
   */
  getItemHeight(index: number): number {
    return this.variableHeightManager.getItemPosition(index).height;
  }

  /**
   * Check if item is measured
   */
  isItemMeasured(index: number): boolean {
    return this.variableHeightManager.isItemMeasured(index);
  }
}

export default DynamicHeightEngine;