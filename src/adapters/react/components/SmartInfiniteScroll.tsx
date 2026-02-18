import React, { useRef, useEffect } from 'react';
import { useSmartPagination } from '../hooks/useSmartPagination';
import { useAdaptiveLoading } from '../hooks/useAdaptiveLoading';

export interface SmartInfiniteScrollProps {
  fetchMore: (page: number, limit: number) => Promise<any[]>;
  renderItem: (item: any, index: number) => React.ReactNode;
  initialPageSize?: number;
  minPageSize?: number;
  maxPageSize?: number;
  enableAdaptation?: boolean;
  className?: string;
  style?: React.CSSProperties;
  emptyMessage?: string;
}

export const SmartInfiniteScroll: React.FC<SmartInfiniteScrollProps> = ({
  fetchMore,
  renderItem,
  initialPageSize = 50,
  minPageSize = 20,
  maxPageSize = 200,
  enableAdaptation = true,
  className = '',
  style = {},
  emptyMessage = 'No more items'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    hasMore,
    cursor,
    nextPage,
    setTotalItems,
    getFetchRange
  } = useSmartPagination({
    initialPage: 1,
    initialPageSize,
    minPageSize,
    maxPageSize,
    enableAdaptation
  });

  const {
    isLoading,
    loadedItems,
    avgLoadTime,
    loadMore,
    getStats
  } = useAdaptiveLoading({
    initialBatchSize: pageSize,
    minBatchSize: minPageSize,
    maxBatchSize: maxPageSize,
    fetchMore: async () => {
      const range = getFetchRange();
      const items = await fetchMore(currentPage, range.limit);
      setTotalItems(totalItems + items.length);
      return items;
    },
    enableNetworkAdaptation: enableAdaptation,
    enablePerformanceAdaptation: enableAdaptation
  });

  // Setup intersection observer
  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '200px',
      threshold: 0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !isLoading && hasMore) {
        nextPage(async () => {
          await loadMore();
        });
      }
    }, options);

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [isLoading, hasMore, nextPage, loadMore]);

  // Get pagination stats
  const stats = getStats();

  return (
    <div
      ref={containerRef}
      className={`smart-infinite-scroll ${className}`}
      style={{
        overflowY: 'auto',
        height: '100%',
        ...style
      }}
    >
      {/* Content */}
      <div className="smart-infinite-content">
        {/* Render items here - in real implementation would map over loaded items */}
        {loadedItems === 0 && (
          <div className="smart-infinite-empty" style={{
            padding: '40px',
            textAlign: 'center',
            color: '#999'
          }}>
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Load more trigger */}
      <div
        ref={loadMoreRef}
        style={{
          padding: '30px',
          textAlign: 'center'
        }}
      >
        {isLoading ? (
          <div className="smart-infinite-loading">
            <div style={{
              display: 'inline-block',
              width: '24px',
              height: '24px',
              border: '3px solid #f3f3f3',
              borderTop: '3px solid #3498db',
              borderRadius: '50%',
              animation: 'smart-spin 1s linear infinite'
            }} />
            <div style={{ marginTop: '12px', color: '#666' }}>
              Loading page {currentPage + 1} of {totalPages}...
            </div>
            <div style={{ fontSize: '11px', color: '#999', marginTop: '4px' }}>
              Batch size: {pageSize} • Avg: {avgLoadTime.toFixed(0)}ms
            </div>
          </div>
        ) : hasMore ? (
          <div className="smart-infinite-ready" style={{
            color: '#999',
            fontSize: '13px'
          }}>
            Scroll for more items
          </div>
        ) : (
          <div className="smart-infinite-end" style={{
            color: '#999',
            fontSize: '13px'
          }}>
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Stats overlay */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        fontSize: '11px',
        fontFamily: 'monospace',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000,
        minWidth: '200px'
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold', fontSize: '13px' }}>
          🚀 Smart Infinite Scroll
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '6px' }}>
          <span>Page:</span>
          <span>{currentPage} / {totalPages}</span>
          
          <span>Page Size:</span>
          <span>{pageSize} (adaptive)</span>
          
          <span>Loaded:</span>
          <span>{loadedItems} items</span>
          
          <span>Avg Load:</span>
          <span>{avgLoadTime.toFixed(0)}ms</span>
          
          <span>Cursor:</span>
          <span style={{ 
            fontSize: '9px',
            wordBreak: 'break-all',
            maxWidth: '120px',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {cursor ? cursor.substring(0, 20) + '...' : 'N/A'}
          </span>
          
          <span>Has More:</span>
          <span style={{ color: hasMore ? '#4CAF50' : '#F44336' }}>
            {hasMore ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      {/* CSS for loading animation */}
      <style>{`
        @keyframes smart-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SmartInfiniteScroll;