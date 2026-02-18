import { EngineConfig, VisibleRange, FetchMoreCallback, EngineState } from './types';
import { WindowManager } from './WindowManager';
import { PrefetchManager } from './PrefetchManager';
import { RequestQueue } from './RequestQueue';
import { IntelligentScrollDetector } from './IntelligentScrollDetector';
import { NetworkSpeedDetector } from './NetworkSpeedDetector';
import { NetworkAwarePrefetchManager } from './NetworkAwarePrefetchManager';
import { NetworkAwareRequestQueue } from './NetworkAwareRequestQueue';
import { AdaptiveBufferCalculator } from './AdaptiveBufferCalculator';
import { PerformanceOptimizer } from './PerformanceOptimizer';
import { MemoryManager } from './MemoryManager';
import { GPUAccelerator } from './GPUAccelerator';
import { BatchSizeOptimizer } from './BatchSizeOptimizer';
import { RequestDeduplicator } from './RequestDeduplicator';
import { PriorityRequestQueue, Priority } from './PriorityRequestQueue';

export class Engine {
  private config: EngineConfig;
  private windowManager: WindowManager;
  private prefetchManager: PrefetchManager;
  private requestQueue: RequestQueue;
  private intelligentScrollDetector: IntelligentScrollDetector;
  private networkDetector: NetworkSpeedDetector;
  private networkAwarePrefetchManager: NetworkAwarePrefetchManager;
  private networkAwareRequestQueue: NetworkAwareRequestQueue;
  private adaptiveBufferCalculator: AdaptiveBufferCalculator;
  private performanceOptimizer: PerformanceOptimizer;
  private memoryManager: MemoryManager;
  private gpuAccelerator: GPUAccelerator;
  private batchSizeOptimizer: BatchSizeOptimizer;
  private requestDeduplicator: RequestDeduplicator;
  private priorityRequestQueue: PriorityRequestQueue;
  
  private state: EngineState;
  private fetchMoreCallback: FetchMoreCallback | null = null;
  private totalItems: number;

  constructor(config: EngineConfig) {
    this.config = {
      ...config,
      bufferSize: config.bufferSize || 5
    };
    
    this.windowManager = new WindowManager(
      this.config.itemHeight,
      this.config.viewportHeight,
      this.config.bufferSize
    );
    
    this.prefetchManager = new PrefetchManager(this.config.bufferSize);
    this.requestQueue = new RequestQueue(1); // Single request at a time
    this.intelligentScrollDetector = new IntelligentScrollDetector();
    this.networkDetector = new NetworkSpeedDetector();
    this.networkAwarePrefetchManager = new NetworkAwarePrefetchManager(this.networkDetector);
    this.networkAwareRequestQueue = new NetworkAwareRequestQueue(this.networkDetector);
    this.adaptiveBufferCalculator = new AdaptiveBufferCalculator();
    this.performanceOptimizer = new PerformanceOptimizer();
    this.memoryManager = new MemoryManager(1000); // Cache up to 1000 items
    this.gpuAccelerator = new GPUAccelerator();
    this.batchSizeOptimizer = new BatchSizeOptimizer();
    this.requestDeduplicator = new RequestDeduplicator();
    this.priorityRequestQueue = new PriorityRequestQueue(2);
    
    this.totalItems = this.config.totalItems || Number.MAX_SAFE_INTEGER;
    
    this.state = {
      scrollTop: 0,
      visibleRange: { start: 0, end: 0 },
      loadedItems: 0,
      isLoading: false
    };
  }

  /**
   * Update scroll position and recalculate visible range with intelligent detection
   */
  async updateScrollPosition(scrollTop: number): Promise<void> {
    // Use performance optimizer to schedule updates efficiently
    this.performanceOptimizer.scheduleOptimizedUpdate(async () => {
      // Calculate velocity and other intelligent metrics
      const velocity = this.intelligentScrollDetector.calculateVelocity(scrollTop);
      const direction = this.intelligentScrollDetector.getDirection(velocity);
      
      // Get network quality for adaptive buffering
      const networkQuality = await this.networkDetector.assessConnectionQuality();
      
      // Calculate adaptive buffer considering all factors
      const adaptiveBuffer = await this.adaptiveBufferCalculator.calculateOptimalBuffer({
        scrollVelocity: velocity,
        networkQuality,
        baseBuffer: this.intelligentScrollDetector.calculateBuffer(velocity),
        visibleItems: [] // In a real implementation, this would be the actual visible items
      });
      
      // Update window manager with adaptive buffer
      this.windowManager.updateBufferSize(adaptiveBuffer);
      
      // Update memory manager with visible range
      this.memoryManager.setVisibleRange({
        start: Math.max(0, this.state.visibleRange.start - adaptiveBuffer),
        end: this.state.visibleRange.end + adaptiveBuffer
      });
      
      this.state.scrollTop = scrollTop;
      this.state.visibleRange = this.windowManager.calculateVisibleRange(scrollTop);
      
      // Check if we need to fetch more items
      if (await this.shouldFetchMore()) {
        await this.fetchMore();
      }
    });
  }

  /**
   * Get the current visible range
   */
  getVisibleRange(): VisibleRange {
    return this.state.visibleRange;
  }

  /**
   * Check if more items should be fetched with intelligent and network-aware detection
   */
  async shouldFetchMore(): Promise<boolean> {
    if (!this.fetchMoreCallback) return false;
    if (this.state.isLoading) return false;
    if (this.state.loadedItems >= this.totalItems) return false;
    
    // Get current velocity for intelligent prefetching
    const velocity = this.intelligentScrollDetector.calculateVelocity(this.state.scrollTop);
    
    // Get network quality for adaptive prefetching
    const networkQuality = await this.networkDetector.assessConnectionQuality();
    
    // Calculate network-adjusted prefetch distance
    const prefetchDistance = await this.networkAwarePrefetchManager.calculateNetworkAdjustedPrefetch(velocity);
    
    // Use intelligent prefetch logic
    const visibleEnd = this.state.visibleRange.end;
    const totalLoaded = this.state.loadedItems;
    
    // Intelligent prefetch: if visible end is approaching the loaded boundary
    return visibleEnd >= totalLoaded - prefetchDistance;
  }

  /**
   * Fetch more items with network awareness
   */
  async fetchMore(): Promise<void> {
    if (!this.fetchMoreCallback || this.state.isLoading) return;
    
    this.state.isLoading = true;
    
    try {
      // Use network-aware request queue
      const result = await this.networkAwareRequestQueue.add(this.fetchMoreCallback);
      // Assuming the result contains new items
      // In a real implementation, this would update the loaded items count
      this.state.loadedItems += Array.isArray(result) ? result.length : 1;
    } catch (error) {
      console.error('Error fetching more items:', error);
    } finally {
      this.state.isLoading = false;
    }
  }

  /**
   * Set the fetchMore callback function
   */
  setFetchMoreCallback(callback: FetchMoreCallback): void {
    this.fetchMoreCallback = callback;
  }

  /**
   * Update total items count
   */
  updateTotalItems(count: number): void {
    this.totalItems = count;
  }

  /**
   * Get current engine state
   */
  getState(): EngineState {
    return { ...this.state };
  }

  /**
   * Update viewport dimensions
   */
  updateDimensions(viewportHeight: number, itemHeight: number): void {
    this.windowManager.updateViewportHeight(viewportHeight);
    this.windowManager.updateItemHeight(itemHeight);
    
    // Recalculate visible range with new dimensions
    this.state.visibleRange = this.windowManager.calculateVisibleRange(this.state.scrollTop);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.requestQueue.clear();
    this.networkAwareRequestQueue.clear();
    this.fetchMoreCallback = null;
    this.intelligentScrollDetector.cleanup();
    this.performanceOptimizer.cleanup();
    this.memoryManager.clear();
  }
}