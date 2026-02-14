// Core exports
export { Engine } from './core/Engine';
export { WindowManager } from './core/WindowManager';
export { PrefetchManager } from './core/PrefetchManager';
export { RequestQueue } from './core/RequestQueue';
export { IntelligentScrollDetector } from './core/IntelligentScrollDetector';
export { NetworkSpeedDetector } from './core/NetworkSpeedDetector';
export { NetworkAwarePrefetchManager } from './core/NetworkAwarePrefetchManager';
export { NetworkAwareRequestQueue } from './core/NetworkAwareRequestQueue';
export type { EngineConfig, VisibleRange, FetchMoreCallback, EngineState, ScrollAnalysis } from './core/types';

// Platform exports
export { ScrollObserver } from './platform/browser/ScrollObserver';

// React adapter exports
export { useLazyList } from './adapters/react/useLazyList';
export { LazyList } from './adapters/react/LazyList';

// Utility exports
export { debounce } from './utils/debounce';
export { throttle } from './utils/throttle';