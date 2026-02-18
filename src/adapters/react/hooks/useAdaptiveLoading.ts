import { useState, useEffect, useRef, useCallback } from 'react';
import { BatchSizeOptimizer } from '../../../core/BatchSizeOptimizer';
import { NetworkSpeedDetector } from '../../../core/NetworkSpeedDetector';
import { DevicePerformanceMonitor } from '../../../core/DevicePerformanceMonitor';

export interface UseAdaptiveLoadingConfig {
  initialBatchSize?: number;
  minBatchSize?: number;
  maxBatchSize?: number;
  fetchMore: () => Promise<any[]>;
  enableNetworkAdaptation?: boolean;
  enablePerformanceAdaptation?: boolean;
}

export interface AdaptiveLoadingState {
  currentBatchSize: number;
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
  performanceScore: number;
  isLoading: boolean;
  loadedItems: number;
  avgLoadTime: number;
  adaptationCount: number;
}

export const useAdaptiveLoading = (config: UseAdaptiveLoadingConfig) => {
  const {
    initialBatchSize = 50,
    minBatchSize = 20,
    maxBatchSize = 200,
    fetchMore,
    enableNetworkAdaptation = true,
    enablePerformanceAdaptation = true
  } = config;

  const batchSizeOptimizerRef = useRef<BatchSizeOptimizer | null>(null);
  const networkDetectorRef = useRef<NetworkSpeedDetector | null>(null);
  const performanceMonitorRef = useRef<DevicePerformanceMonitor | null>(null);
  
  const [state, setState] = useState<AdaptiveLoadingState>({
    currentBatchSize: initialBatchSize,
    networkQuality: 'good',
    performanceScore: 0.8,
    isLoading: false,
    loadedItems: 0,
    avgLoadTime: 0,
    adaptationCount: 0
  });

  const loadTimeHistoryRef = useRef<number[]>([]);

  // Initialize adaptive loading system
  useEffect(() => {
    if (enableNetworkAdaptation) {
      networkDetectorRef.current = new NetworkSpeedDetector();
    }

    if (enablePerformanceAdaptation) {
      performanceMonitorRef.current = new DevicePerformanceMonitor();
    }

    batchSizeOptimizerRef.current = new BatchSizeOptimizer({
      minBatchSize,
      maxBatchSize,
      baseBatchSize: initialBatchSize
    });

    return () => {
      batchSizeOptimizerRef.current = null;
      networkDetectorRef.current = null;
      performanceMonitorRef.current = null;
    };
  }, []);

  // Load data with adaptive batch size
  const loadMore = useCallback(async () => {
    if (!batchSizeOptimizerRef.current || state.isLoading) return [];

    const startTime = performance.now();
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      // Calculate optimal batch size
      let optimalBatchSize = state.currentBatchSize;

      if (enableNetworkAdaptation && networkDetectorRef.current) {
        const networkQuality = await networkDetectorRef.current.assessConnectionQuality();
        setState(prev => ({ ...prev, networkQuality }));
      }

      if (enablePerformanceAdaptation && performanceMonitorRef.current) {
        const perfScore = await performanceMonitorRef.current.assessPerformance();
        setState(prev => ({ ...prev, performanceScore: perfScore }));
      }

      // Get optimized batch size
      optimalBatchSize = await batchSizeOptimizerRef.current.calculateOptimalBatchSize(
        state.loadedItems / 1000 // Rough scroll speed estimate
      );

      // Fetch data
      const newData = await fetchMore();
      
      const loadTime = performance.now() - startTime;
      loadTimeHistoryRef.current.push(loadTime);
      
      // Keep last 10 load times
      if (loadTimeHistoryRef.current.length > 10) {
        loadTimeHistoryRef.current.shift();
      }

      const avgLoadTime = loadTimeHistoryRef.current.reduce((a, b) => a + b, 0) / loadTimeHistoryRef.current.length;

      // Record load time for future optimization
      batchSizeOptimizerRef.current.trackRenderTime(loadTime);

      setState(prev => ({
        ...prev,
        isLoading: false,
        loadedItems: prev.loadedItems + newData.length,
        avgLoadTime,
        adaptationCount: prev.adaptationCount + 1
      }));

      return newData;
    } catch (error) {
      console.error('Adaptive loading error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return [];
    }
  }, [state.isLoading, state.currentBatchSize, state.loadedItems, enableNetworkAdaptation, enablePerformanceAdaptation]);

  // Get current batch size
  const getCurrentBatchSize = useCallback(() => {
    if (batchSizeOptimizerRef.current) {
      return batchSizeOptimizerRef.current.getCurrentBatchSize();
    }
    return state.currentBatchSize;
  }, [state.currentBatchSize]);

  // Get loading statistics
  const getStats = useCallback(() => {
    return {
      currentBatchSize: state.currentBatchSize,
      networkQuality: state.networkQuality,
      performanceScore: state.performanceScore,
      avgLoadTime: state.avgLoadTime,
      adaptationCount: state.adaptationCount,
      loadedItems: state.loadedItems
    };
  }, [state]);

  // Reset adaptive loading
  const reset = useCallback(() => {
    loadTimeHistoryRef.current = [];
    setState(prev => ({
      ...prev,
      currentBatchSize: initialBatchSize,
      loadedItems: 0,
      avgLoadTime: 0,
      adaptationCount: 0
    }));
    
    if (batchSizeOptimizerRef.current) {
      batchSizeOptimizerRef.current.reset();
    }
  }, [initialBatchSize]);

  return {
    ...state,
    loadMore,
    getCurrentBatchSize,
    getStats,
    reset
  };
};

export default useAdaptiveLoading;