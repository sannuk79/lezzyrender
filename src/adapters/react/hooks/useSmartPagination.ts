import { useState, useEffect, useRef, useCallback } from 'react';
import { IntelligentPagination } from '../../../core/IntelligentPagination';

export interface UseSmartPaginationConfig {
  initialPage?: number;
  initialPageSize?: number;
  minPageSize?: number;
  maxPageSize?: number;
  enableAdaptation?: boolean;
}

export interface SmartPaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
  cursor?: string;
  nextCursor?: string;
  prevCursor?: string;
  avgLoadTime: number;
  isAdapting: boolean;
}

export const useSmartPagination = (config: UseSmartPaginationConfig = {}) => {
  const {
    initialPage = 1,
    initialPageSize = 50,
    minPageSize = 20,
    maxPageSize = 200,
    enableAdaptation = true
  } = config;

  const paginationRef = useRef<IntelligentPagination | null>(null);
  const [state, setState] = useState<SmartPaginationState>({
    currentPage: initialPage,
    pageSize: initialPageSize,
    totalItems: 0,
    totalPages: 0,
    hasMore: false,
    cursor: undefined,
    nextCursor: undefined,
    prevCursor: undefined,
    avgLoadTime: 0,
    isAdapting: false
  });

  const loadTimeHistoryRef = useRef<{ page: number; time: number }[]>([]);

  // Initialize pagination
  useEffect(() => {
    paginationRef.current = new IntelligentPagination();
    
    if (initialPageSize) {
      paginationRef.current.setBasePageSize(initialPageSize);
    }

    return () => {
      paginationRef.current = null;
    };
  }, []);

  // Update pagination state
  const updateState = useCallback(() => {
    if (!paginationRef.current) return;

    const paginationState = paginationRef.current.getState();
    
    setState(prev => ({
      ...prev,
      currentPage: paginationState.currentPage,
      pageSize: paginationState.pageSize,
      totalItems: paginationState.totalItems,
      totalPages: paginationState.totalPages,
      hasMore: paginationState.hasMore,
      cursor: paginationState.cursor,
      nextCursor: paginationState.nextCursor,
      prevCursor: paginationState.prevCursor
    }));
  }, []);

  // Set total items
  const setTotalItems = useCallback((total: number) => {
    if (paginationRef.current) {
      paginationRef.current.setTotalItems(total);
      updateState();
    }
  }, [updateState]);

  // Go to next page
  const nextPage = useCallback(async (loadDataFn?: () => Promise<void>) => {
    if (!paginationRef.current || !state.hasMore) return;

    const startTime = performance.now();
    setState(prev => ({ ...prev, isAdapting: true }));

    try {
      paginationRef.current.nextPage();
      
      if (loadDataFn) {
        await loadDataFn();
      }

      const loadTime = performance.now() - startTime;
      
      // Record load time for adaptation
      if (enableAdaptation && paginationRef.current) {
        paginationRef.current.recordLoadTime(state.currentPage, loadTime);
        
        loadTimeHistoryRef.current.push({ page: state.currentPage, time: loadTime });
        
        // Keep last 10 load times
        if (loadTimeHistoryRef.current.length > 10) {
          loadTimeHistoryRef.current.shift();
        }

        const avgLoadTime = loadTimeHistoryRef.current.reduce((a, b) => a + b.time, 0) / loadTimeHistoryRef.current.length;
        
        setState(prev => ({
          ...prev,
          avgLoadTime,
          isAdapting: false
        }));
      }

      updateState();
    } catch (error) {
      console.error('Next page error:', error);
      setState(prev => ({ ...prev, isAdapting: false }));
    }
  }, [state.hasMore, state.currentPage, enableAdaptation, updateState]);

  // Go to previous page
  const prevPage = useCallback(() => {
    if (!paginationRef.current) return;
    
    paginationRef.current.prevPage();
    updateState();
  }, [updateState]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (!paginationRef.current) return;
    
    paginationRef.current.goToPage(page);
    updateState();
  }, [updateState]);

  // Go to cursor
  const goToCursor = useCallback((cursor: string) => {
    if (!paginationRef.current) return;
    
    paginationRef.current.goToCursor(cursor);
    updateState();
  }, [updateState]);

  // Get fetch range
  const getFetchRange = useCallback(() => {
    if (!paginationRef.current) return { skip: 0, limit: state.pageSize };
    
    return paginationRef.current.getFetchRange();
  }, [state.pageSize]);

  // Get current cursor
  const getCurrentCursor = useCallback(() => {
    if (!paginationRef.current) return state.cursor;
    
    return paginationRef.current.getState().cursor;
  }, [state.cursor]);

  // Get pagination statistics
  const getStats = useCallback(() => {
    if (!paginationRef.current) return null;
    
    return {
      currentPage: state.currentPage,
      pageSize: state.pageSize,
      totalItems: state.totalItems,
      totalPages: state.totalPages,
      hasMore: state.hasMore,
      avgLoadTime: state.avgLoadTime,
      currentCursor: state.cursor,
      loadHistory: loadTimeHistoryRef.current
    };
  }, [state]);

  // Reset pagination
  const reset = useCallback(() => {
    if (paginationRef.current) {
      paginationRef.current.reset();
      loadTimeHistoryRef.current = [];
      updateState();
    }
  }, [updateState]);

  return {
    ...state,
    nextPage,
    prevPage,
    goToPage,
    goToCursor,
    setTotalItems,
    getFetchRange,
    getCurrentCursor,
    getStats,
    reset
  };
};

export default useSmartPagination;