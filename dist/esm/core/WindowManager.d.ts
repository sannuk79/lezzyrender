import { VisibleRange } from './types';
export declare class WindowManager {
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
//# sourceMappingURL=WindowManager.d.ts.map