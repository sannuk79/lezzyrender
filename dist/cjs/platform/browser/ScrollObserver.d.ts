export declare class ScrollObserver {
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
//# sourceMappingURL=ScrollObserver.d.ts.map