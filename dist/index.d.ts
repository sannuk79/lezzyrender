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

/**
 * Debounce function to limit the rate at which a function is called
 */
declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;

/**
 * Throttle function to limit the rate at which a function is called
 */
declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;

export { AdaptiveBufferCalculator, ContentComplexityAnalyzer, DevicePerformanceMonitor, Engine, IntelligentScrollDetector, LazyList, NetworkAwarePrefetchManager, NetworkAwareRequestQueue, NetworkSpeedDetector, PrefetchManager, RequestQueue, ScrollObserver, WindowManager, debounce, throttle, useLazyList };
export type { EngineConfig, EngineState, FetchMoreCallback, ScrollAnalysis, VisibleRange };
