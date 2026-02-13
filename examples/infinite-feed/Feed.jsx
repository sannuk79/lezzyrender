import React, { useState } from 'react';
import { LazyList } from 'lazy-render';

const InfiniteFeed = () => {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const fetchMorePosts = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay
      
      // Generate new posts
      const newPosts = Array.from({ length: 10 }, (_, i) => ({
        id: (page * 10) + i,
        title: `Post Title ${page * 10 + i}`,
        content: `This is the content for post number ${page * 10 + i}. It contains some interesting information.`,
        author: `Author ${(page * 10) + i % 5}`,
        timestamp: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        likes: Math.floor(Math.random() * 100),
        comments: Math.floor(Math.random() * 50)
      }));
      
      setPosts(prev => [...prev, ...newPosts]);
      setPage(prev => prev + 1);
      
      // Stop after 100 posts for demo purposes
      if (page >= 10) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
    
    return newPosts;
  };

  const renderPost = (post, index) => (
    <div 
      key={post.id}
      style={{ 
        height: '120px', 
        borderBottom: '1px solid #eee',
        padding: '16px',
        backgroundColor: '#fafafa'
      }}
    >
      <h3>{post.title}</h3>
      <p style={{ fontSize: '14px', color: '#666', margin: '4px 0' }}>
        by {post.author} • {post.timestamp.substring(0, 10)}
      </p>
      <p style={{ margin: '8px 0' }}>{post.content}</p>
      <div style={{ fontSize: '12px', color: '#888' }}>
        {post.likes} likes • {post.comments} comments
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Infinite Feed Example</h1>
      <p>{posts.length} posts loaded</p>
      
      <LazyList
        items={posts}
        itemHeight={120}
        viewportHeight={500}
        fetchMore={fetchMorePosts}
        renderItem={renderPost}
        bufferSize={3}
        overscan={2}
      />
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          Loading more posts...
        </div>
      )}
      
      {!hasMore && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          You've reached the end!
        </div>
      )}
    </div>
  );
};

export default InfiniteFeed;