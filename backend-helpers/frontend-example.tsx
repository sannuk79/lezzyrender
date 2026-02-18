/**
 * FRONTEND EXAMPLE - Integration with lazy-render
 * Solves the 1 million cards performance issue
 */

import React, { useState } from 'react';
import { LazyList, useLazyList } from 'lazy-render-virtual-scroll';

interface Card {
  id: number;
  title: string;
  category: string;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * ✅ CORRECT FRONTEND IMPLEMENTATION
 * Uses lazy-render with paginated API
 */
export const ColorfulDashboard: React.FC = () => {
  const [items, setItems] = useState<Card[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Fetch more data when user scrolls
  const fetchMore = async () => {
    if (!hasMore) return [];
    
    try {
      // Fetch only 50 items at a time
      const response = await fetch(
        `/api/monitoring/cards?page=${page}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }
      
      const result = await response.json();
      
      // Update state with new items
      setItems(prev => [...prev, ...result.data]);
      setPagination(result.pagination);
      setPage(prev => prev + 1);
      setHasMore(result.pagination.hasMore);
      
      return result.data;
    } catch (error) {
      console.error('Error fetching more cards:', error);
      return [];
    }
  };

  // Use lazy-render hook
  const { visibleRange, isLoading } = useLazyList({
    itemHeight: 200,
    viewportHeight: 600,
    bufferSize: 5,
    fetchMore
  });

  // Render individual card
  const renderCard = (card: Card, index: number) => (
    <div
      key={card.id}
      style={{
        height: '200px',
        borderBottom: '1px solid #eee',
        padding: '16px'
      }}
    >
      <h3>{card.title}</h3>
      <p>Category: {card.category}</p>
      <p>Created: {new Date(card.createdAt).toLocaleDateString()}</p>
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <h1>Colorful Dashboard</h1>
      
      {/* Pagination Info */}
      {pagination && (
        <div style={{ marginBottom: '16px' }}>
          <p>
            Showing {items.length} of {pagination.total} cards
            {isLoading && ' • Loading...'}
          </p>
        </div>
      )}
      
      {/* LazyList with virtual scrolling */}
      <LazyList
        items={items}
        itemHeight={200}
        viewportHeight={600}
        fetchMore={fetchMore}
        renderItem={renderCard}
        bufferSize={5}
        overscan={2}
      />
      
      {/* Load More Button (optional fallback) */}
      {!hasMore && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>No more cards to load</p>
        </div>
      )}
    </div>
  );
};

export default ColorfulDashboard;