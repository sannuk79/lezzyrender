import React, { forwardRef } from 'react';
import { useLazyList } from './useLazyList';
import { EngineConfig, FetchMoreCallback } from '../../core/types';

interface LazyListProps extends EngineConfig {
  fetchMore: FetchMoreCallback;
  renderItem: (item: any, index: number) => React.ReactNode;
  items: any[];
  className?: string;
  style?: React.CSSProperties;
}

export const LazyList = forwardRef<HTMLDivElement, LazyListProps>((props, ref) => {
  const {
    fetchMore,
    renderItem,
    items,
    itemHeight,
    viewportHeight,
    bufferSize,
    className = '',
    style = {},
    ...rest
  } = props;

  const { visibleRange, setContainerRef, isLoading } = useLazyList({
    fetchMore,
    itemHeight,
    viewportHeight,
    bufferSize,
    ...rest
  });

  // Calculate container height to simulate infinite scroll
  const containerHeight = items.length * itemHeight;
  const visibleItems = items.slice(visibleRange.start, visibleRange.end);

  // Calculate top padding to maintain scroll position
  const paddingTop = visibleRange.start * itemHeight;

  return (
    <div
      ref={(el) => {
        setContainerRef(el);
        if (ref) {
          if (typeof ref === 'function') {
            ref(el);
          } else {
            ref.current = el;
          }
        }
      }}
      className={`lazy-list ${className}`}
      style={{
        height: `${viewportHeight}px`,
        overflowY: 'auto',
        ...style
      }}
      {...rest}
    >
      {/* Top padding to maintain scroll position */}
      <div style={{ height: `${paddingTop}px` }} />
      
      {/* Visible items */}
      {visibleItems.map((item, index) => (
        <div
          key={visibleRange.start + index}
          style={{ height: `${itemHeight}px` }}
          className="lazy-item"
        >
          {renderItem(item, visibleRange.start + index)}
        </div>
      ))}
      
      {/* Bottom padding */}
      <div 
        style={{ 
          height: `${Math.max(0, containerHeight - (visibleRange.end * itemHeight))}px` 
        }} 
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="lazy-loading">
          Loading more items...
        </div>
      )}
    </div>
  );
});

LazyList.displayName = 'LazyList';