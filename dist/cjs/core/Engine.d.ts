import { EngineConfig, VisibleRange, FetchMoreCallback, EngineState } from './types';
export declare class Engine {
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
//# sourceMappingURL=Engine.d.ts.map