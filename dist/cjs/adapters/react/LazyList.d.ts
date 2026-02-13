import React from 'react';
import { EngineConfig, FetchMoreCallback } from '../../core/types';
interface LazyListProps extends EngineConfig {
    fetchMore: FetchMoreCallback;
    renderItem: (item: any, index: number) => React.ReactNode;
    items: any[];
    className?: string;
    style?: React.CSSProperties;
}
export declare const LazyList: React.ForwardRefExoticComponent<LazyListProps & React.RefAttributes<HTMLDivElement>>;
export {};
//# sourceMappingURL=LazyList.d.ts.map