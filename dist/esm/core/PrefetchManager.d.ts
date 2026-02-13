export declare class PrefetchManager {
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
//# sourceMappingURL=PrefetchManager.d.ts.map