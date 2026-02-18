import React, { useRef, useEffect } from 'react';
import { useIntelligentScroll } from '../hooks/useIntelligentScroll';

export interface IntelligentLazyListProps {
  items: any[];
  itemHeight: number;
  viewportHeight: number;
  fetchMore: () => Promise<any[]>;
  renderItem: (item: any, index: number) => React.ReactNode;
  bufferSize?: number;
  enablePrefetch?: boolean;
  enableCache?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const IntelligentLazyList: React.FC<IntelligentLazyListProps> = ({
  items,
  itemHeight,
  viewportHeight,
  fetchMore,
  renderItem,
  bufferSize = 5,
  enablePrefetch = true,
  enableCache = true,
  className = '',
  style = {}
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const {
    visibleRange,
    isLoading,
    scrollVelocity,
    scrollDirection,
    scrollPattern,
    prefetchConfidence,
    cacheHitRate,
    setContainerRef,
    getCachedData,
    cacheData
  } = useIntelligentScroll({
    itemHeight,
    viewportHeight,
    bufferSize,
    fetchMore,
    enablePrefetch,
    enableCache
  });

  // Cache items as they load
  useEffect(() => {
    if (enableCache) {
      items.forEach((item, index) => {
        if (index >= visibleRange.start && index <= visibleRange.end) {
          cacheData(index, item, 'high');
        }
      });
    }
  }, [items, visibleRange, enableCache, cacheData]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;
  const topPadding = visibleRange.start * itemHeight;
  const bottomPadding = Math.max(0, totalHeight - ((visibleRange.end + 1) * itemHeight));

  // Get visible items
  const visibleItems = items.slice(visibleRange.start, visibleRange.end + 1);

  return (
    <div
      ref={(el) => {
        containerRef.current = el;
        setContainerRef(el);
      }}
      className={`intelligent-lazy-list ${className}`}
      style={{
        height: `${viewportHeight}px`,
        overflowY: 'auto',
        position: 'relative',
        ...style
      }}
    >
      {/* Top padding */}
      <div style={{ height: `${topPadding}px` }} />

      {/* Visible items */}
      {visibleItems.map((item, index) => {
        const cachedData = getCachedData(visibleRange.start + index);
        return (
          <div
            key={visibleRange.start + index}
            style={{
              height: `${itemHeight}px`,
              position: 'relative'
            }}
            className="intelligent-lazy-item"
          >
            {renderItem(cachedData || item, visibleRange.start + index)}
          </div>
        );
      })}

      {/* Bottom padding */}
      <div style={{ height: `${bottomPadding}px` }} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="intelligent-lazy-loading" style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Loading... (Pattern: {scrollPattern}, Confidence: {(prefetchConfidence * 100).toFixed(0)}%)
        </div>
      )}

      {/* Debug info (optional) */}
      <div className="intelligent-lazy-debug" style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '11px',
        pointerEvents: 'none'
      }}>
        <div>Velocity: {scrollVelocity.toFixed(2)}</div>
        <div>Direction: {scrollDirection}</div>
        <div>Pattern: {scrollPattern}</div>
        <div>Cache Hit: {(cacheHitRate * 100).toFixed(0)}%</div>
        <div>Visible: {visibleRange.start}-{visibleRange.end}</div>
      </div>
    </div>
  );
};

export default IntelligentLazyList;