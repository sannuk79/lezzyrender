import { EngineConfig, VisibleRange, FetchMoreCallback } from '../../core/types';
interface LazyListConfig extends EngineConfig {
    fetchMore: FetchMoreCallback;
}
export declare const useLazyList: (config: LazyListConfig) => {
    visibleRange: VisibleRange;
    loadedItems: any[];
    isLoading: boolean;
    setContainerRef: (element: HTMLElement | null) => (() => void) | undefined;
    refresh: () => void;
};
export {};
//# sourceMappingURL=useLazyList.d.ts.map