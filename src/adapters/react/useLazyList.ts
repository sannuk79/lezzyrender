import { useState, useEffect, useRef, useCallback } from 'react';
import { Engine } from '../../core/Engine';
import { EngineConfig, VisibleRange, FetchMoreCallback, ScrollAnalysis } from '../../core/types';

interface LazyListConfig extends EngineConfig {
  fetchMore: FetchMoreCallback;
}

export const useLazyList = (config: LazyListConfig) => {
  const { fetchMore, ...engineConfig } = config;
  const engineRef = useRef<Engine | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  
  const [visibleRange, setVisibleRange] = useState<VisibleRange>({ start: 0, end: 0 });
  const [loadedItems, setLoadedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollAnalysis, setScrollAnalysis] = useState<ScrollAnalysis>({
    velocity: 0,
    direction: 'stationary',
    buffer: 5,
    prefetchDistance: 400,
    predictedPosition: 0,
    isIdle: true
  });

  // Initialize engine
  useEffect(() => {
    engineRef.current = new Engine(engineConfig);
    engineRef.current.setFetchMoreCallback(fetchMore);

    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
      }
    };
  }, []);

  // Update engine when config changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateDimensions(
        engineConfig.viewportHeight,
        engineConfig.itemHeight
      );
    }
  }, [engineConfig.viewportHeight, engineConfig.itemHeight]);

  // Handle scroll events
  const handleScroll = useCallback((scrollTop: number) => {
    if (engineRef.current) {
      engineRef.current.updateScrollPosition(scrollTop);

      // Update state based on engine
      const state = engineRef.current.getState();
      setVisibleRange(state.visibleRange);
      setIsLoading(state.isLoading);
    }
  }, []);

  // Set container reference
  const setContainerRef = (element: HTMLElement | null) => {
    if (element) {
      containerRef.current = element;
      
      // Initialize scroll observer when container is available
      if (typeof window !== 'undefined' && element) {
        // In a real implementation, we would use ScrollObserver here
        // For now, we'll just attach a basic scroll listener
        const handleScrollEvent = () => {
          handleScroll(element.scrollTop);
        };
        
        element.addEventListener('scroll', handleScrollEvent, { passive: true });
        
        // Cleanup
        return () => {
          element.removeEventListener('scroll', handleScrollEvent);
        };
      }
    }
  };

  return {
    visibleRange,
    loadedItems,
    isLoading,
    scrollAnalysis,
    setContainerRef,
    // Helper function to trigger manual refresh
    refresh: () => {
      if (engineRef.current) {
        engineRef.current.updateScrollPosition(containerRef.current?.scrollTop || 0);
      }
    },
    // Function to get current scroll analysis
    getScrollAnalysis: () => {
      if (engineRef.current) {
        // In a real implementation, we would get the analysis from the engine
        // For now, we'll return the current state
        return scrollAnalysis;
      }
      return {
        velocity: 0,
        direction: 'stationary',
        buffer: 5,
        prefetchDistance: 400,
        predictedPosition: 0,
        isIdle: true
      };
    }
  };
};