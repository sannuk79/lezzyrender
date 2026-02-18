import React from 'react';

interface EngineConfig {
    itemHeight: number;
    viewportHeight: number;
    bufferSize?: number;
    totalItems?: number;
}
interface VisibleRange {
    start: number;
    end: number;
}
interface FetchMoreCallback {
    (): Promise<any>;
}
interface EngineState {
    scrollTop: number;
    visibleRange: VisibleRange;
    loadedItems: number;
    isLoading: boolean;
}
interface ScrollAnalysis {
    velocity: number;
    direction: 'up' | 'down' | 'stationary';
    buffer: number;
    prefetchDistance: number;
    predictedPosition: number;
    isIdle: boolean;
}

declare class Engine {
    private config;
    private windowManager;
    private prefetchManager;
    private requestQueue;
    private intelligentScrollDetector;
    private networkDetector;
    private networkAwarePrefetchManager;
    private networkAwareRequestQueue;
    private adaptiveBufferCalculator;
    private performanceOptimizer;
    private memoryManager;
    private gpuAccelerator;
    private batchSizeOptimizer;
    private requestDeduplicator;
    private priorityRequestQueue;
    private state;
    private fetchMoreCallback;
    private totalItems;
    constructor(config: EngineConfig);
    /**
     * Update scroll position and recalculate visible range with intelligent detection
     */
    updateScrollPosition(scrollTop: number): Promise<void>;
    /**
     * Get the current visible range
     */
    getVisibleRange(): VisibleRange;
    /**
     * Check if more items should be fetched with intelligent and network-aware detection
     */
    shouldFetchMore(): Promise<boolean>;
    /**
     * Fetch more items with network awareness
     */
    fetchMore(): Promise<void>;
    /**
     * Set the fetchMore callback function
     */
    setFetchMoreCallback(callback: FetchMoreCallback): void;
    /**
     * Update total items count
     */
    updateTotalItems(count: number): void;
    /**
     * Get current engine state
     */
    getState(): EngineState;
    /**
     * Update viewport dimensions
     */
    updateDimensions(viewportHeight: number, itemHeight: number): void;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}

declare class WindowManager {
    private itemHeight;
    private viewportHeight;
    private bufferSize;
    constructor(itemHeight: number, viewportHeight: number, bufferSize?: number);
    /**
     * Calculate the visible range based on scroll position
     */
    calculateVisibleRange(scrollTop: number): VisibleRange;
    /**
     * Update viewport height if it changes
     */
    updateViewportHeight(height: number): void;
    /**
     * Update item height if it changes
     */
    updateItemHeight(height: number): void;
    /**
     * Update buffer size if it changes
     */
    updateBufferSize(size: number): void;
}

declare class PrefetchManager {
    /**
     * This class is kept for backward compatibility
     * Intelligent prefetching is now handled in the Engine class
     */
    constructor();
    /**
     * Legacy method - not used in intelligent mode
     */
    shouldPrefetch(visibleEnd: number, totalLoaded: number): boolean;
    /**
     * Update buffer size if it changes (for backward compatibility)
     */
    updateBufferSize(size: number): void;
}

declare class RequestQueue {
    private queue;
    private processing;
    private maxConcurrent;
    constructor(maxConcurrent?: number);
    /**
     * Add a request to the queue
     */
    add(requestFn: () => Promise<any>): Promise<any>;
    /**
     * Process the queue
     */
    private processQueue;
    /**
     * Clear the queue
     */
    clear(): void;
    /**
     * Get the current queue length
     */
    getLength(): number;
}

declare class IntelligentScrollDetector {
    private lastScrollTop;
    private lastTime;
    private velocityHistory;
    private readonly HISTORY_SIZE;
    private scrollTimeout;
    private isIdle;
    constructor();
    calculateVelocity(scrollTop: number): number;
    private getAverageVelocity;
    getDirection(velocity: number): 'up' | 'down' | 'stationary';
    calculateBuffer(velocity: number): number;
    calculatePrefetchDistance(velocity: number): number;
    predictPosition(currentPosition: number, velocity: number, msAhead?: number): number;
    getIsIdle(): boolean;
    private resetIdleTimer;
    cleanup(): void;
}

declare class NetworkSpeedDetector {
    private bandwidthHistory;
    private latencyHistory;
    private readonly HISTORY_SIZE;
    estimateBandwidth(): Promise<number>;
    measureLatency(): Promise<number>;
    assessConnectionQuality(): Promise<'excellent' | 'good' | 'poor' | 'offline'>;
    private getAverageBandwidth;
    private getAverageLatency;
    getNetworkStats(): {
        bandwidth: number;
        latency: number;
        history: number[];
    };
}

declare class NetworkAwarePrefetchManager {
    private networkDetector;
    private basePrefetchDistance;
    constructor(networkDetector: NetworkSpeedDetector);
    calculateNetworkAdjustedPrefetch(velocity: number): Promise<number>;
    calculateNetworkAdjustedBatchSize(velocity: number): Promise<number>;
    shouldDelayPrefetch(): Promise<boolean>;
}

declare class NetworkAwareRequestQueue {
    private networkDetector;
    private queue;
    private processing;
    private maxConcurrent;
    private offlineQueue;
    constructor(networkDetector: NetworkSpeedDetector);
    add(requestFn: () => Promise<any>): Promise<any>;
    private processQueue;
    private handleOfflineRequest;
    private processOfflineQueue;
    getQueueStatus(): {
        pending: number;
        offline: number;
        maxConcurrent: number;
    };
    clear(): void;
}

declare class AdaptiveBufferCalculator {
    private scrollFactor;
    private networkFactor;
    private performanceFactor;
    private contentFactor;
    private performanceMonitor;
    private contentAnalyzer;
    constructor();
    calculateOptimalBuffer(params: {
        scrollVelocity: number;
        networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
        baseBuffer: number;
        visibleItems: any[];
    }): Promise<number>;
    private calculateScrollBuffer;
    private calculateNetworkAdjustment;
    private calculatePerformanceAdjustment;
    private calculateContentAdjustment;
    getAdaptiveInsights(params: {
        scrollVelocity: number;
        networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
        baseBuffer: number;
        visibleItems: any[];
    }): Promise<{
        currentBuffer: number;
        performance: {
            frameRate: number;
            score: number;
        };
        network: {
            quality: string;
            adjustment: number;
        };
        complexity: {
            score: number;
            breakdown: any;
        };
        factors: {
            scroll: number;
            network: number;
            performance: number;
            content: number;
        };
    }>;
}

declare class DevicePerformanceMonitor {
    private frameRateHistory;
    private memoryUsageHistory;
    private gcMonitoring;
    private readonly HISTORY_SIZE;
    constructor();
    getFrameRate(): Promise<number>;
    getAverageFrameRate(): number;
    getMemoryInfo(): {
        used: number;
        total: number;
    } | null;
    assessPerformance(): Promise<number>;
    private setupPerformanceMonitoring;
    getPerformanceInsights(): {
        frameRate: number;
        performanceScore: number;
        memoryUsed: number | null;
        memoryTotal: number | null;
    };
}

declare class ContentComplexityAnalyzer {
    analyzeContentComplexity(items: any[]): number;
    private analyzeTextComplexity;
    private analyzeMediaComplexity;
    private analyzeComponentComplexity;
    getComplexityInsights(items: any[]): {
        averageComplexity: number;
        textComplexity: number;
        mediaComplexity: number;
        componentComplexity: number;
    };
}

declare class PerformanceOptimizer {
    private frameBudget;
    private lastFrameTime;
    private animationFrameId;
    private isOptimizing;
    private lastUpdate;
    private minUpdateInterval;
    private updateQueue;
    private isProcessingQueue;
    private cleanupThreshold;
    private gcInterval;
    constructor();
    scheduleOptimizedUpdate(updateFn: () => void): void;
    private processUpdateQueue;
    private getTimeRemaining;
    optimizeMemory(cleanupFn: (startIndex: number, endIndex: number) => void, visibleRange: {
        start: number;
        end: number;
    }): void;
    enableGPUCssAcceleration(element: HTMLElement): void;
    disableGPUCssAcceleration(element: HTMLElement): void;
    getOptimizationProfile(): {
        frameRate: number;
        batchSize: number;
        bufferMultiplier: number;
        updateInterval: number;
    };
    private isLowEndDevice;
    private setupPerformanceMonitoring;
    getPerformanceInsights(): {
        frameRate: number;
        memoryUsage: number | null;
        updateFrequency: number;
        optimizationActive: boolean;
    };
    private getMemoryUsage;
    cleanup(): void;
}

declare class MemoryManager {
    private itemCache;
    private maxCacheSize;
    private cleanupThreshold;
    private visibleRange;
    private totalItems;
    constructor(maxCacheSize?: number);
    setVisibleRange(range: {
        start: number;
        end: number;
    }): void;
    setTotalItems(total: number): void;
    get(key: number): any | null;
    set(key: number, value: any): void;
    has(key: number): boolean;
    delete(key: number): boolean;
    clear(): void;
    cleanupCache(): void;
    private getDistanceFromVisible;
    getStats(): {
        size: number;
        maxCacheSize: number;
        visibleItems: number;
        offScreenItems: number;
        memoryEstimate: number;
    };
    private estimateObjectSize;
    pruneEssential(): void;
    private isEssential;
    getSize(): number;
    getKeys(): number[];
}

declare class GPUAccelerator {
    private gpuAccelerationEnabled;
    private gpuElements;
    private animationFrameId;
    constructor();
    private isGPUSupported;
    enableForElement(element: HTMLElement): void;
    disableForElement(element: HTMLElement): void;
    enableForElements(elements: HTMLElement[]): void;
    batchUpdate(elements: HTMLElement[], enable: boolean): void;
    optimizeScrollContainer(container: HTMLElement): void;
    optimizeItem(item: HTMLElement): void;
    getStatus(): {
        enabled: boolean;
        supported: boolean;
        elementCount: number;
    };
    optimizeForScenario(scenario: 'scrolling' | 'animation' | 'static'): void;
    cleanup(): void;
    isAccelerated(element: HTMLElement): boolean;
    getRecommendations(): string[];
}

/**
 * Batch Size Optimizer
 * Dynamically adjusts batch size based on scroll speed, network, and performance
 */

interface BatchConfig {
    minBatchSize: number;
    maxBatchSize: number;
    baseBatchSize: number;
    scrollSpeedThreshold: number;
}
interface BatchMetrics {
    currentBatchSize: number;
    scrollSpeed: number;
    networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
    performanceScore: number;
    avgRenderTime: number;
}
declare class BatchSizeOptimizer {
    private config;
    private networkDetector;
    private performanceMonitor;
    private currentBatchSize;
    private scrollSpeedHistory;
    private renderTimeHistory;
    private readonly HISTORY_SIZE;
    constructor(config?: Partial<BatchConfig>, networkDetector?: NetworkSpeedDetector, performanceMonitor?: DevicePerformanceMonitor);
    /**
     * Calculate optimal batch size based on all factors
     */
    calculateOptimalBatchSize(scrollSpeed: number): Promise<number>;
    /**
     * Calculate multiplier based on scroll speed
     */
    private calculateSpeedMultiplier;
    /**
     * Calculate multiplier based on network quality
     */
    private calculateNetworkMultiplier;
    /**
     * Calculate multiplier based on device performance
     */
    private calculatePerformanceMultiplier;
    /**
     * Track scroll speed for averaging
     */
    private trackScrollSpeed;
    /**
     * Get average scroll speed
     */
    private getAverageScrollSpeed;
    /**
     * Track render time for performance monitoring
     */
    trackRenderTime(renderTime: number): void;
    /**
     * Get average render time
     */
    getAverageRenderTime(): number;
    /**
     * Get current batch metrics
     */
    getMetrics(): BatchMetrics;
    /**
     * Get current batch size
     */
    getCurrentBatchSize(): number;
    /**
     * Reset optimizer
     */
    reset(): void;
    /**
     * Get optimization statistics
     */
    getStats(): {
        avgScrollSpeed: number;
        avgRenderTime: number;
        currentBatchSize: number;
        totalAdjustments: number;
    };
}

/**
 * Request Deduplication
 * Prevents duplicate requests from being sent
 */
declare class RequestDeduplicator {
    private pendingRequests;
    private requestCount;
    /**
     * Execute request with deduplication
     * If same request is already pending, return existing promise
     */
    request<T>(key: string, requestFn: () => Promise<T>, ttl?: number): Promise<T>;
    /**
     * Clear specific request
     */
    clear(key: string): void;
    /**
     * Clear all requests
     */
    clearAll(): void;
    /**
     * Get pending request count
     */
    getPendingCount(): number;
    /**
     * Get request statistics
     */
    getStats(): {
        pending: number;
        totalRequests: number;
        deduplicationRate: number;
    };
}

/**
 * Priority-based Request Queue
 * Processes high-priority requests first
 */
declare enum Priority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    CRITICAL = 3
}
declare class PriorityRequestQueue {
    private queues;
    private processing;
    private maxConcurrent;
    private activeRequests;
    constructor(maxConcurrent?: number);
    /**
     * Add request with priority
     */
    add<T>(requestFn: () => Promise<T>, priority?: Priority): Promise<T>;
    /**
     * Process queue by priority
     */
    private processQueue;
    /**
     * Get next request by priority
     */
    private getNextRequest;
    /**
     * Check if there are pending requests
     */
    private hasPendingRequests;
    /**
     * Get queue statistics
     */
    getStats(): {
        totalPending: number;
        byPriority: {
            critical: number;
            high: number;
            normal: number;
            low: number;
        };
        activeRequests: number;
    };
    /**
     * Clear all queues
     */
    clear(): void;
    /**
     * Clear specific priority queue
     */
    clearPriority(priority: Priority): void;
}

interface HeightCacheStats {
    totalItems: number;
    measuredItems: number;
    estimatedItems: number;
    cacheSize: number;
    hitRate: number;
}
declare class HeightMeasurementCache {
    private heightMap;
    private offsetMap;
    private estimatedHeight;
    private totalHeight;
    private accessCount;
    private hitCount;
    private readonly DEFAULT_TTL;
    constructor(estimatedHeight?: number);
    /**
     * Measure and cache height for an item
     */
    measureHeight(index: number, element: HTMLElement): number;
    /**
     * Get height for an item (measured or estimated)
     */
    getHeight(index: number): number;
    /**
     * Get offset (cumulative height) for an item
     */
    getOffset(index: number): number;
    /**
     * Check if item height is measured
     */
    isMeasured(index: number): boolean;
    /**
     * Mark item as needing remeasurement
     */
    invalidate(index: number): void;
    /**
     * Clear specific item from cache
     */
    clear(index: number): void;
    /**
     * Clear entire cache
     */
    clearAll(): void;
    /**
     * Recalculate all offsets
     */
    private recalculateOffsets;
    /**
     * Get total height of all items
     */
    getTotalHeight(totalItems: number): number;
    /**
     * Find item index at a specific scroll position
     */
    findIndexAtPosition(position: number, totalItems: number): number;
    /**
     * Get cache statistics
     */
    getStats(totalItems: number): HeightCacheStats;
    /**
     * Update estimated height
     */
    updateEstimatedHeight(height: number): void;
    /**
     * Get estimated height
     */
    getEstimatedHeight(): number;
    /**
     * Cleanup old entries (older than TTL)
     */
    cleanup(ttl?: number): void;
    /**
     * Get all measured heights
     */
    getAllHeights(): Map<number, number>;
    /**
     * Set heights in bulk (for initial data load)
     */
    setHeightsBulk(heights: Map<number, number>): void;
}

interface VariableHeightConfig {
    estimatedHeight: number;
    minHeight: number;
    maxHeight: number;
    bufferSize: number;
}
interface ItemPosition {
    index: number;
    offset: number;
    height: number;
}
declare class VariableHeightManager {
    private heightCache;
    private config;
    private totalItems;
    private lastMeasuredIndex;
    constructor(config?: Partial<VariableHeightConfig>);
    /**
     * Set total number of items
     */
    setTotalItems(total: number): void;
    /**
     * Measure item height from DOM element
     */
    measureElement(index: number, element: HTMLElement | null): number;
    /**
     * Get item position (offset and height)
     */
    getItemPosition(index: number): ItemPosition;
    /**
     * Calculate visible range for variable heights
     */
    calculateVisibleRange(scrollTop: number, viewportHeight: number): VisibleRange;
    /**
     * Get total height of all items
     */
    getTotalHeight(): number;
    /**
     * Scroll to specific item index
     */
    scrollToIndex(index: number): number;
    /**
     * Get items to render for current viewport
     */
    getItemsToRender(scrollTop: number, viewportHeight: number): {
        items: ItemPosition[];
        totalHeight: number;
    };
    /**
     * Handle height change (when item height changes dynamically)
     */
    onHeightChange(index: number, newHeight: number): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): HeightCacheStats;
    /**
     * Clear cache for specific range
     */
    clearRange(startIndex: number, endIndex: number): void;
    /**
     * Clear entire cache
     */
    clearCache(): void;
    /**
     * Get last measured index
     */
    getLastMeasuredIndex(): number;
    /**
     * Check if item is measured
     */
    isItemMeasured(index: number): boolean;
    /**
     * Get measured items count
     */
    getMeasuredCount(): number;
}

interface DynamicHeightConfig extends EngineConfig {
    estimatedItemHeight: number;
    minItemHeight: number;
    maxItemHeight: number;
    heightBufferSize: number;
}
interface DynamicHeightState extends EngineState {
    totalContentHeight: number;
    measuredItems: number;
    estimatedItems: number;
}
declare class DynamicHeightEngine {
    private config;
    private variableHeightManager;
    private heightCache;
    private state;
    private containerElement;
    private itemElements;
    constructor(config?: Partial<DynamicHeightConfig>);
    /**
     * Initialize with container element
     */
    init(container: HTMLElement): void;
    /**
     * Setup scroll listener
     */
    private setupScrollListener;
    /**
     * Handle scroll event
     */
    private onScroll;
    /**
     * Update visible range based on scroll position
     */
    private updateVisibleRange;
    /**
     * Measure item height from DOM element
     */
    measureItem(index: number, element: HTMLElement): number;
    /**
     * Called when item height is measured
     */
    private onHeightMeasured;
    /**
     * Get items to render for current viewport
     */
    getItemsToRender(): {
        items: Array<{
            index: number;
            offset: number;
            height: number;
        }>;
        totalHeight: number;
        visibleRange: VisibleRange;
    };
    /**
     * Scroll to specific item index
     */
    scrollToIndex(index: number): void;
    /**
     * Set total number of items
     */
    setTotalItems(total: number): void;
    /**
     * Get current state
     */
    getState(): DynamicHeightState;
    /**
     * Get cache statistics
     */
    getCacheStats(): HeightCacheStats;
    /**
     * Clear cache for range
     */
    clearCacheRange(startIndex: number, endIndex: number): void;
    /**
     * Clear entire cache
     */
    clearCache(): void;
    /**
     * Cleanup
     */
    cleanup(): void;
    /**
     * Update viewport height
     */
    updateViewportHeight(height: number): void;
    /**
     * Get item offset for styling
     */
    getItemOffset(index: number): number;
    /**
     * Get item height
     */
    getItemHeight(index: number): number;
    /**
     * Check if item is measured
     */
    isItemMeasured(index: number): boolean;
}

/**
 * Smart Prefetch Algorithm
 * Recognizes scroll patterns and predicts data loading needs
 */
interface ScrollPattern {
    type: 'fast-scroll' | 'slow-scroll' | 'paused' | 'oscillating' | 'steady';
    velocity: number;
    acceleration: number;
    direction: 'up' | 'down' | 'stationary';
    confidence: number;
}
interface PrefetchPrediction {
    shouldPrefetch: boolean;
    prefetchDistance: number;
    batchSize: number;
    priority: 'low' | 'normal' | 'high' | 'critical';
    confidence: number;
}
declare class SmartPrefetchAlgorithm {
    private velocityHistory;
    private directionHistory;
    private readonly HISTORY_SIZE;
    private lastPrefetchTime;
    private prefetchCooldown;
    /**
     * Analyze scroll pattern
     */
    analyzeScrollPattern(velocity: number, acceleration: number, direction: 'up' | 'down' | 'stationary'): ScrollPattern;
    /**
     * Predict prefetch needs based on scroll pattern
     */
    predictPrefetchNeeds(pattern: ScrollPattern, visibleEnd: number, totalLoaded: number): PrefetchPrediction;
    /**
     * Track velocity history
     */
    private trackVelocity;
    /**
     * Track direction history
     */
    private trackDirection;
    /**
     * Get average velocity
     */
    private getAverageVelocity;
    /**
     * Get velocity variance
     */
    private getVelocityVariance;
    /**
     * Count direction changes
     */
    private countDirectionChanges;
    /**
     * Reset history
     */
    reset(): void;
    /**
     * Get prediction confidence
     */
    getConfidence(): number;
}

interface CacheConfig {
    maxSize: number;
    defaultTTL: number;
    cleanupThreshold: number;
}
declare class PreemptiveCache<T> {
    private cache;
    private config;
    private accessHistory;
    constructor(config?: Partial<CacheConfig>);
    /**
     * Preemptively cache data with priority
     */
    preemptiveCache(index: number, data: T, priority?: 'low' | 'normal' | 'high' | 'critical'): void;
    /**
     * Get cached data
     */
    get(index: number): T | null;
    /**
     * Check if data is cached
     */
    has(index: number): boolean;
    /**
     * Get cached data for range
     */
    getRange(startIndex: number, endIndex: number): T[];
    /**
     * Delete cached data
     */
    delete(index: number): boolean;
    /**
     * Clear cache
     */
    clear(): void;
    /**
     * Cleanup old/low-priority entries
     */
    cleanup(): void;
    /**
     * Track access for analytics
     */
    private trackAccess;
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
    };
    /**
     * Get all cached indices
     */
    getCachedIndices(): number[];
    /**
     * Preemptively cache range
     */
    cacheRange(startIndex: number, endIndex: number, dataFetcher: (index: number) => T, priority?: 'low' | 'normal' | 'high' | 'critical'): void;
    /**
     * Get memory usage estimate
     */
    getMemoryUsage(): number;
}

/**
 * Intelligent Pagination
 * Adaptive page size with cursor-based pagination
 */
interface PaginationState {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasMore: boolean;
    cursor?: string;
    nextCursor?: string;
    prevCursor?: string;
}
interface CursorData {
    page: number;
    limit: number;
    timestamp: number;
    checksum?: string;
}
declare class IntelligentPagination {
    private currentPage;
    private basePageSize;
    private adaptivePageSize;
    private totalItems;
    private loadHistory;
    private readonly MIN_PAGE_SIZE;
    private readonly MAX_PAGE_SIZE;
    /**
     * Get current pagination state
     */
    getState(): PaginationState;
    /**
     * Set total items
     */
    setTotalItems(total: number): void;
    /**
     * Go to next page
     */
    nextPage(): PaginationState;
    /**
     * Go to previous page
     */
    prevPage(): PaginationState;
    /**
     * Go to specific page
     */
    goToPage(page: number): PaginationState;
    /**
     * Record load time for adaptive sizing
     */
    recordLoadTime(page: number, loadTimeMs: number): void;
    /**
     * Adapt page size based on performance
     */
    private adaptPageSize;
    /**
     * Create cursor for page
     */
    createCursor(page: number): string;
    /**
     * Decode cursor
     */
    decodeCursor(cursor: string): CursorData | null;
    /**
     * Go to page from cursor
     */
    goToCursor(cursor: string): PaginationState;
    /**
     * Calculate checksum for cursor validation
     */
    private calculateChecksum;
    /**
     * Validate cursor checksum
     */
    private validateChecksum;
    /**
     * Get items to fetch for current page
     */
    getFetchRange(): {
        skip: number;
        limit: number;
    };
    /**
     * Reset pagination
     */
    reset(): void;
    /**
     * Get load history for analytics
     */
    getLoadHistory(): {
        page: number;
        loadTime: number;
    }[];
    /**
     * Get average load time
     */
    getAverageLoadTime(): number;
    /**
     * Set base page size
     */
    setBasePageSize(size: number): void;
    /**
     * Get current page size
     */
    getPageSize(): number;
    /**
     * Get current page number
     */
    getCurrentPage(): number;
}

declare class ScrollObserver {
    private container;
    private callback;
    private options;
    private observer;
    private sentinelElement;
    constructor(container: HTMLElement, callback: (scrollTop: number) => void, options?: Partial<IntersectionObserverInit>);
    /**
     * Start observing scroll events
     */
    observe(): void;
    /**
     * Handle scroll events
     */
    private onScroll;
    /**
     * Debounce function for scroll events
     */
    private debounce;
    /**
     * Disconnect observer and clean up
     */
    disconnect(): void;
}

interface LazyListConfig extends EngineConfig {
    fetchMore: FetchMoreCallback;
}
declare const useLazyList: (config: LazyListConfig) => {
    visibleRange: VisibleRange;
    loadedItems: any[];
    isLoading: boolean;
    scrollAnalysis: ScrollAnalysis;
    setContainerRef: (element: HTMLElement | null) => (() => void) | undefined;
    refresh: () => void;
    getScrollAnalysis: () => {
        velocity: number;
        direction: string;
        buffer: number;
        prefetchDistance: number;
        predictedPosition: number;
        isIdle: boolean;
    };
};

interface LazyListProps extends EngineConfig {
    fetchMore: FetchMoreCallback;
    renderItem: (item: any, index: number) => React.ReactNode;
    items: any[];
    className?: string;
    style?: React.CSSProperties;
}
declare const LazyList: React.ForwardRefExoticComponent<LazyListProps & React.RefAttributes<HTMLDivElement>>;

class LazyScroll {
  constructor(container, config) {
    this.container = container;
    this.config = {
      itemHeight: config.itemHeight || 50,
      viewportHeight: config.viewportHeight || 400,
      bufferSize: config.bufferSize || 5,
      fetchMore: config.fetchMore || (() => Promise.resolve([]))
    };

    this.engine = new Engine(this.config);
    this.engine.setFetchMoreCallback(this.config.fetchMore);

    this.visibleRange = { start: 0, end: 0 };
    this.isLoading = false;
    this.items = [];
    this.visibleItems = [];

    this.scrollHandler = this.onScroll.bind(this);
    this.container.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  onScroll() {
    const scrollTop = this.container.scrollTop;
    this.engine.updateScrollPosition(scrollTop);

    const state = this.engine.getState();
    this.visibleRange = state.visibleRange;
    this.isLoading = state.isLoading;

    this.render();
  }

  setItems(items) {
    this.items = items;
    this.render();
  }

  render() {
    // Calculate paddings
    const topPadding = this.visibleRange.start * this.config.itemHeight;
    const bottomPadding = Math.max(0, (this.items.length - this.visibleRange.end) * this.config.itemHeight);

    // Get visible items
    this.visibleItems = this.items.slice(this.visibleRange.start, this.visibleRange.end);

    // Clear container except for paddings and content
    const existingContent = this.container.querySelector('.lazy-scroll-content');
    if (existingContent) {
      existingContent.remove();
    }

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'lazy-scroll-content';

    // Add top padding
    const topPaddingDiv = document.createElement('div');
    topPaddingDiv.style.height = `${topPadding}px`;
    contentWrapper.appendChild(topPaddingDiv);

    // Add visible items
    this.visibleItems.forEach((item, index) => {
      const itemElement = this.createItemElement(item, this.visibleRange.start + index);
      contentWrapper.appendChild(itemElement);
    });

    // Add bottom padding
    const bottomPaddingDiv = document.createElement('div');
    bottomPaddingDiv.style.height = `${bottomPadding}px`;
    contentWrapper.appendChild(bottomPaddingDiv);

    // Add loading indicator if needed
    if (this.isLoading) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'lazy-loading';
      loadingElement.textContent = 'Loading more items...';
      contentWrapper.appendChild(loadingElement);
    }

    this.container.appendChild(contentWrapper);
  }

  createItemElement(item, index) {
    const itemElement = document.createElement('div');
    itemElement.style.height = `${this.config.itemHeight}px`;
    itemElement.className = 'lazy-item';

    // Default content - can be customized
    itemElement.textContent = `Item ${index}: ${item.text || item.id || 'Content'}`;

    return itemElement;
  }

  updateConfig(newConfig) {
    if (newConfig.itemHeight !== undefined) this.config.itemHeight = newConfig.itemHeight;
    if (newConfig.viewportHeight !== undefined) this.config.viewportHeight = newConfig.viewportHeight;
    if (newConfig.bufferSize !== undefined) this.config.bufferSize = newConfig.bufferSize;
    if (newConfig.fetchMore !== undefined) {
      this.config.fetchMore = newConfig.fetchMore;
      this.engine.setFetchMoreCallback(newConfig.fetchMore);
    }

    // Re-render with new config
    this.render();
  }

  destroy() {
    this.container.removeEventListener('scroll', this.scrollHandler);
    this.engine.cleanup();
  }

  // Public methods
  getVisibleRange() {
    return { ...this.visibleRange };
  }

  refresh() {
    this.onScroll();
  }
}

// Factory function for easier usage
function createLazyScroll(container, config) {
  return new LazyScroll(container, config);
}

/**
 * Debounce function to limit the rate at which a function is called
 */
declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;

/**
 * Throttle function to limit the rate at which a function is called
 */
declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;

declare class LazyScrollElementClass {
    constructor();
    setItems(items: any[]): void;
    refresh(): void;
    getVisibleRange(): {
        start: number;
        end: number;
    };
    static registerElement(): void;
}
declare const LazyScrollElement: typeof LazyScrollElementClass;

export { AdaptiveBufferCalculator, BatchSizeOptimizer, ContentComplexityAnalyzer, DevicePerformanceMonitor, DynamicHeightEngine, Engine, GPUAccelerator, HeightMeasurementCache, IntelligentPagination, IntelligentScrollDetector, LazyList, LazyScroll, LazyScrollElement, MemoryManager, NetworkAwarePrefetchManager, NetworkAwareRequestQueue, NetworkSpeedDetector, PerformanceOptimizer, PreemptiveCache, PrefetchManager, Priority, PriorityRequestQueue, RequestDeduplicator, RequestQueue, ScrollObserver, SmartPrefetchAlgorithm, VariableHeightManager, WindowManager, createLazyScroll, debounce, throttle, useLazyList };
export type { EngineConfig, EngineState, FetchMoreCallback, ScrollAnalysis, VisibleRange };
