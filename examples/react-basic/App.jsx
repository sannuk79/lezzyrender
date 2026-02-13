import React, { useState } from 'react';
import { LazyList } from 'lazy-render';

const App = () => {
  // Generate 10000 sample items
  const [items] = useState(() => 
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      text: `Item ${i}`,
      timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString()
    }))
  );
  
  const [loadedItems, setLoadedItems] = useState(items.slice(0, 100)); // Initially load 100 items
  const [hasMore, setHasMore] = useState(true);

  const fetchMore = async () => {
    if (loadedItems.length >= items.length) {
      setHasMore(false);
      return [];
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const nextBatch = items.slice(loadedItems.length, loadedItems.length + 50);
    setLoadedItems(prev => [...prev, ...nextBatch]);
    return nextBatch;
  };

  const renderItem = (item, index) => (
    <div 
      key={item.id}
      style={{ 
        height: '60px', 
        borderBottom: '1px solid #eee',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '16px'
      }}
    >
      {item.text} - {item.timestamp.substring(0, 10)}
    </div>
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <h1>Basic Lazy Render Example</h1>
      <p>Loading {loadedItems.length} of {items.length} items</p>
      
      <LazyList
        items={loadedItems}
        itemHeight={60}
        viewportHeight={400}
        fetchMore={fetchMore}
        renderItem={renderItem}
        bufferSize={5}
        overscan={2}
      />
    </div>
  );
};

export default App;