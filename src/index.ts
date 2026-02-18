// Core exports
export { Engine } from './core/Engine';
export { WindowManager } from './core/WindowManager';
export { PrefetchManager } from './core/PrefetchManager';
export { RequestQueue } from './core/RequestQueue';
export { IntelligentScrollDetector } from './core/IntelligentScrollDetector';
export { NetworkSpeedDetector } from './core/NetworkSpeedDetector';
export { NetworkAwarePrefetchManager } from './core/NetworkAwarePrefetchManager';
export { NetworkAwareRequestQueue } from './core/NetworkAwareRequestQueue';
export { AdaptiveBufferCalculator } from './core/AdaptiveBufferCalculator';
export { DevicePerformanceMonitor } from './core/DevicePerformanceMonitor';
export { ContentComplexityAnalyzer } from './core/ContentComplexityAnalyzer';
export { PerformanceOptimizer } from './core/PerformanceOptimizer';
export { MemoryManager } from './core/MemoryManager';
export { GPUAccelerator } from './core/GPUAccelerator';
export { BatchSizeOptimizer } from './core/BatchSizeOptimizer';
export { RequestDeduplicator } from './core/RequestDeduplicator';
export { PriorityRequestQueue, Priority } from './core/PriorityRequestQueue';
export { HeightMeasurementCache } from './core/HeightMeasurementCache';
export { VariableHeightManager } from './core/VariableHeightManager';
export { DynamicHeightEngine } from './core/DynamicHeightEngine';
export { SmartPrefetchAlgorithm } from './core/SmartPrefetchAlgorithm';
export { PreemptiveCache } from './core/PreemptiveCache';
export { IntelligentPagination } from './core/IntelligentPagination';
export type { EngineConfig, VisibleRange, FetchMoreCallback, EngineState, ScrollAnalysis } from './core/types';

// Platform exports
export { ScrollObserver } from './platform/browser/ScrollObserver';

// React adapter exports
export { useLazyList } from './adapters/react/useLazyList';
export { LazyList } from './adapters/react/LazyList';

// Vanilla JS adapter exports
export { LazyScroll, createLazyScroll } from './adapters/vanilla/lazyScroll';

// SSR-safe element export
declare const window: any;

class LazyScrollElementClass {
  constructor() {}
  setItems(items: any[]) {}
  refresh() {}
  getVisibleRange() { return { start: 0, end: 0 }; }
  static registerElement() {}
}

// Use dynamic import for browser-specific functionality
const LazyScrollElement = typeof window !== 'undefined' && typeof HTMLElement !== 'undefined' 
  ? LazyScrollElementClass // Will be replaced with actual element in browser
  : LazyScrollElementClass; // SSR-safe fallback

export { LazyScrollElement };

// Utility exports
export { debounce } from './utils/debounce';
export { throttle } from './utils/throttle';