import { EngineConfig, VisibleRange, FetchMoreCallback, ScrollAnalysis } from '../../core/types';
interface LazyListConfig extends EngineConfig {
    fetchMore: FetchMoreCallback;
}
export declare const useLazyList: (config: LazyListConfig) => {
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
export {};
//# sourceMappingURL=useLazyList.d.ts.map