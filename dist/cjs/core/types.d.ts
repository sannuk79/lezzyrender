export interface EngineConfig {
    itemHeight: number;
    viewportHeight: number;
    bufferSize?: number;
    totalItems?: number;
}
export interface VisibleRange {
    start: number;
    end: number;
}
export interface FetchMoreCallback {
    (): Promise<any>;
}
export interface EngineState {
    scrollTop: number;
    visibleRange: VisibleRange;
    loadedItems: number;
    isLoading: boolean;
}
export interface ScrollAnalysis {
    velocity: number;
    direction: 'up' | 'down' | 'stationary';
    buffer: number;
    prefetchDistance: number;
    predictedPosition: number;
    isIdle: boolean;
}
//# sourceMappingURL=types.d.ts.map