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

declare class Engine {
    private config;
    private windowManager;
    private prefetchManager;
    private requestQueue;
    private state;
    private fetchMoreCallback;
    private totalItems;
    constructor(config: EngineConfig);
    /**
     * Update scroll position and recalculate visible range
     */
    updateScrollPosition(scrollTop: number): void;
    /**
     * Get the current visible range
     */
    getVisibleRange(): VisibleRange;
    /**
     * Check if more items should be fetched
     */
    shouldFetchMore(): boolean;
    /**
     * Fetch more items
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
}

declare class PrefetchManager {
    private bufferSize;
    constructor(bufferSize?: number);
    /**
     * Determine if more items should be fetched based on visible range and loaded items
     */
    shouldPrefetch(visibleEnd: number, totalLoaded: number): boolean;
    /**
     * Update buffer size if it changes
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
    setContainerRef: (element: HTMLElement | null) => (() => void) | undefined;
    refresh: () => void;
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

export { Engine, LazyList, PrefetchManager, RequestQueue, ScrollObserver, WindowManager, debounce, throttle, useLazyList };
export type { EngineConfig, EngineState, FetchMoreCallback, VisibleRange };
