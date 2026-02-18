import React, { useRef, useEffect } from 'react';
import { useAdaptiveLoading } from '../hooks/useAdaptiveLoading';

export interface AdaptiveScrollViewProps {
  children: React.ReactNode;
  fetchMore: () => Promise<any[]>;
  initialBatchSize?: number;
  minBatchSize?: number;
  maxBatchSize?: number;
  enableNetworkAdaptation?: boolean;
  enablePerformanceAdaptation?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onLoadMore?: (items: any[]) => void;
}

export const AdaptiveScrollView: React.FC<AdaptiveScrollViewProps> = ({
  children,
  fetchMore,
  initialBatchSize = 50,
  minBatchSize = 20,
  maxBatchSize = 200,
  enableNetworkAdaptation = true,
  enablePerformanceAdaptation = true,
  className = '',
  style = {},
  onLoadMore
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const {
    currentBatchSize,
    networkQuality,
    performanceScore,
    isLoading,
    loadedItems,
    avgLoadTime,
    adaptationCount,
    loadMore,
    getStats
  } = useAdaptiveLoading({
    initialBatchSize,
    minBatchSize,
    maxBatchSize,
    fetchMore,
    enableNetworkAdaptation,
    enablePerformanceAdaptation
  });

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: containerRef.current,
      rootMargin: '100px',
      threshold: 0
    };

    observerRef.current = new IntersectionObserver((entries) => {
      const entry = entries[0];
      if (entry.isIntersecting && !isLoading) {
        loadMore().then((items) => {
          if (onLoadMore) {
            onLoadMore(items);
          }
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
  }, [isLoading, loadMore, onLoadMore]);

  // Get network quality color
  const getNetworkQualityColor = () => {
    switch (networkQuality) {
      case 'excellent': return '#4CAF50';
      case 'good': return '#8BC34A';
      case 'poor': return '#FF9800';
      case 'offline': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  return (
    <div
      ref={containerRef}
      className={`adaptive-scroll-view ${className}`}
      style={{
        overflowY: 'auto',
        height: '100%',
        ...style
      }}
    >
      {/* Content */}
      <div className="adaptive-scroll-content">
        {children}
      </div>

      {/* Load more trigger */}
      <div
        ref={loadMoreRef}
        style={{
          padding: '20px',
          textAlign: 'center',
          opacity: isLoading ? 0.5 : 1
        }}
      >
        {isLoading ? (
          <div className="adaptive-loading">
            <div style={{
              display: 'inline-block',
              width: '20px',
              height: '20px',
              border: '2px solid #f3f3f3',
              borderTop: '2px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <span style={{ marginLeft: '8px' }}>
              Loading {currentBatchSize} items...
            </span>
          </div>
        ) : (
          <div className="adaptive-ready">
            Scroll for more
          </div>
        )}
      </div>

      {/* Stats overlay */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '12px',
        borderRadius: '8px',
        fontSize: '11px',
        fontFamily: 'monospace',
        zIndex: 1000
      }}>
        <div style={{ marginBottom: '8px', fontWeight: 'bold' }}>
          Adaptive Loading Stats
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: '4px' }}>
          <span>Batch Size:</span>
          <span>{currentBatchSize}</span>
          
          <span>Network:</span>
          <span style={{ color: getNetworkQualityColor() }}>
            {networkQuality.toUpperCase()}
          </span>
          
          <span>Performance:</span>
          <span>{(performanceScore * 100).toFixed(0)}%</span>
          
          <span>Loaded:</span>
          <span>{loadedItems} items</span>
          
          <span>Avg Load:</span>
          <span>{avgLoadTime.toFixed(0)}ms</span>
          
          <span>Adaptations:</span>
          <span>{adaptationCount}</span>
        </div>
      </div>

      {/* CSS for loading animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdaptiveScrollView;