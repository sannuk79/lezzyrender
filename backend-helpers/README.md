# Backend Pagination Helper - lazy-render

## **🚨 PROBLEM SOLVED**

**Before:**
```
GET /api/monitoring/cards
Returns: 10,00,000 items at once
Response Time: 3+ seconds ❌
```

**After:**
```
GET /api/monitoring/cards?page=1&limit=50
Returns: 50 items per request
Response Time: <100ms ✅
```

## **INSTALLATION**

```bash
npm install lazy-render-virtual-scroll
```

## **BACKEND IMPLEMENTATION (Node.js/Express)**

### **1. Basic Setup**

```javascript
const express = require('express');
const { calculatePagination } = require('lazy-render-virtual-scroll/backend-helpers');

const app = express();

app.get('/api/monitoring/cards', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
  const skip = (page - 1) * limit;
  
  // Get data from database
  const items = await getDataFromDatabase(skip, limit);
  const total = await getTotalCount();
  
  // Return paginated response
  res.json(calculatePagination(items, page, limit, total));
});
```

### **2. MongoDB Example**

```javascript
app.get('/api/monitoring/cards', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
  const skip = (page - 1) * limit;
  
  const [items, total] = await Promise.all([
    Card.find().skip(skip).limit(limit).sort({ createdAt: -1 }),
    Card.countDocuments()
  ]);
  
  res.json({
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page < Math.ceil(total / limit)
    }
  });
});
```

### **3. MySQL/PostgreSQL Example**

```javascript
app.get('/api/monitoring/cards', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
  const offset = (page - 1) * limit;
  
  const [items, totalResult] = await Promise.all([
    db.query('SELECT * FROM cards ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]),
    db.query('SELECT COUNT(*) as count FROM cards')
  ]);
  
  res.json({
    data: items,
    pagination: {
      page,
      limit,
      total: totalResult[0].count,
      totalPages: Math.ceil(totalResult[0].count / limit),
      hasMore: page < Math.ceil(totalResult[0].count / limit)
    }
  });
});
```

## **FRONTEND INTEGRATION (React)**

```javascript
import { LazyList } from 'lazy-render-virtual-scroll';

function Dashboard() {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchMore = async () => {
    if (!hasMore) return [];
    
    const response = await fetch(`/api/cards?page=${page}&limit=50`);
    const result = await response.json();
    
    setItems(prev => [...prev, ...result.data]);
    setPage(prev => prev + 1);
    setHasMore(result.pagination.hasMore);
    
    return result.data;
  };

  return (
    <LazyList
      items={items}
      itemHeight={200}
      viewportHeight={600}
      fetchMore={fetchMore}
      renderItem={(item) => <Card data={item} />}
    />
  );
}
```

## **PERFORMANCE COMPARISON**

| Metric | Before | After | Improvement |
|--------|---------|-------|-------------|
| **API Response Time** | 3378ms | <100ms | **33x faster** ⚡ |
| **Data Transferred** | ~500MB | ~25KB | **20,000x less** 📉 |
| **Initial Load** | 3+ seconds | <200ms | **15x faster** ⚡ |
| **Memory Usage** | Very High | Very Low | **99% reduction** 💾 |
| **Server Load** | Very High | Minimal | **99% reduction** 🖥️ |

## **API PARAMETERS**

### **Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 1000)

### **Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1000000,
    "totalPages": 20000,
    "hasMore": true,
    "nextCursor": "2",
    "prevCursor": null
  }
}
```

## **BEST PRACTICES**

1. **Always use pagination** - Never return all data at once
2. **Limit maximum page size** - Prevent abuse with max limit (1000 recommended)
3. **Include pagination metadata** - Help frontend know total items and pages
4. **Use cursor-based pagination** - For very large datasets
5. **Cache count queries** - Total count can be expensive

## **ERROR HANDLING**

```javascript
app.get('/api/cards', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 1000);
    
    if (page < 1) {
      return res.status(400).json({ error: 'Page must be >= 1' });
    }
    
    if (limit < 1 || limit > 1000) {
      return res.status(400).json({ error: 'Limit must be between 1 and 1000' });
    }
    
    // ... rest of implementation
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch data',
      message: error.message 
    });
  }
});
```

## **MIGRATION GUIDE**

### **From: No Pagination**
```javascript
// ❌ OLD CODE
app.get('/api/cards', (req, res) => {
  const allCards = database.getAll(); // Returns 1M items
  res.json(allCards);
});
```

### **To: With Pagination**
```javascript
// ✅ NEW CODE
app.get('/api/cards', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 50;
  const skip = (page - 1) * limit;
  
  const items = database.getRange(skip, limit); // Returns 50 items
  const total = database.count();
  
  res.json({
    data: items,
    pagination: { page, limit, total, hasMore: true }
  });
});
```

## **SUPPORT**

For issues or questions, visit: https://github.com/sannuk79/lezzyrender