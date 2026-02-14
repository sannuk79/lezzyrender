export declare class PrefetchManager {
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
//# sourceMappingURL=PrefetchManager.d.ts.map