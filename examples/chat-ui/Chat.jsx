import React, { useState, useRef } from 'react';
import { LazyList, useLazyList } from 'lazy-render';

const ChatUI = () => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [userId] = useState('user_' + Math.random().toString(36).substr(2, 9));
  const messagesEndRef = useRef(null);
  
  // Initialize with some messages
  React.useEffect(() => {
    const initialMessages = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      text: `Initial message ${i} - Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      sender: i % 3 === 0 ? 'other' : 'self',
      timestamp: new Date(Date.now() - (100 - i) * 60000).toLocaleTimeString(),
      avatar: `https://i.pravatar.cc/32?img=${i % 5 + 1}`
    }));
    setMessages(initialMessages);
  }, []);

  const sendMessage = () => {
    if (inputText.trim() === '') return;
    
    const newMessage = {
      id: messages.length,
      text: inputText,
      sender: 'self',
      timestamp: new Date().toLocaleTimeString(),
      avatar: `https://i.pravatar.cc/32?img=6`
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputText('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Custom hook usage for advanced control
  const { 
    visibleRange, 
    setContainerRef, 
    scrollToIndex 
  } = useLazyList({
    itemHeight: 80, // Average message height
    viewportHeight: 500,
    bufferSize: 5,
    overscan: 3,
    fetchMore: async () => {
      // In a real app, this would fetch older messages
      return [];
    }
  });

  const renderMessage = (msg, index) => (
    <div 
      key={msg.id}
      style={{ 
        minHeight: '60px', 
        borderBottom: '1px solid #eee',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        backgroundColor: msg.sender === 'self' ? '#e3f2fd' : '#fff'
      }}
    >
      <img 
        src={msg.avatar} 
        alt="Avatar" 
        style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          marginRight: '12px',
          flexShrink: 0
        }} 
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 'bold', fontSize: '12px', marginBottom: '4px' }}>
          {msg.sender === 'self' ? 'You' : 'Other User'} • {msg.timestamp}
        </div>
        <div style={{ fontSize: '14px' }}>
          {msg.text}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ textAlign: 'center', margin: '10px 0' }}>Chat UI Example</h1>
      
      {/* Messages container */}
      <div 
        ref={setContainerRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          border: '1px solid #ddd', 
          borderRadius: '8px',
          marginBottom: '10px'
        }}
      >
        <div style={{ height: `${visibleRange.start * 80}px` }} />
        
        {messages
          .slice(visibleRange.start, visibleRange.end)
          .map((msg, idx) => renderMessage(msg, visibleRange.start + idx))}
          
        <div style={{ height: `${Math.max(0, (messages.length - visibleRange.end) * 80)}px` }} />
      </div>
      
      {/* Input area */}
      <div style={{ display: 'flex', gap: '8px', padding: '8px' }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          style={{ 
            flex: 1, 
            padding: '10px', 
            border: '1px solid #ddd', 
            borderRadius: '4px',
            resize: 'none',
            minHeight: '40px',
            maxHeight: '100px'
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!inputText.trim()}
          style={{
            padding: '10px 16px',
            backgroundColor: inputText.trim() ? '#2196f3' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: inputText.trim() ? 'pointer' : 'not-allowed'
          }}
        >
          Send
        </button>
      </div>
      
      <div style={{ fontSize: '12px', textAlign: 'center', color: '#666' }}>
        Showing {visibleRange.start}-{visibleRange.end} of {messages.length} messages
      </div>
    </div>
  );
};

export default ChatUI;