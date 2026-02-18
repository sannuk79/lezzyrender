/**
 * BACKEND EXAMPLE - Fix for 1 Million Cards Performance Issue
 * 
 * BEFORE (WRONG):
 * GET /api/monitoring/cards
 * Returns: 10,00,000 items at once
 * Response time: 3+ seconds ❌
 * 
 * AFTER (CORRECT):
 * GET /api/monitoring/cards?page=1&limit=50
 * Returns: 50 items per request
 * Response time: <100ms ✅
 */

import express from 'express';
import { calculatePagination, validatePaginationParams } from './pagination';

const router = express.Router();

// Mock database - replace with your actual database
const mockCards = Array.from({ length: 1000000 }, (_, i) => ({
  id: i,
  title: `Card ${i}`,
  category: `Category ${i % 100000}`,
  createdAt: new Date().toISOString()
}));

/**
 * ✅ CORRECT IMPLEMENTATION - With Pagination
 */
router.get('/monitoring/cards', async (req, res) => {
  try {
    // Get pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(
      parseInt(req.query.limit as string) || 50,
      1000 // Maximum 1000 items per page
    );
    
    // Calculate skip for database query
    const skip = (page - 1) * limit;
    
    // Get total count (for pagination metadata)
    const total = mockCards.length;
    
    // Get only the requested page of data
    const items = mockCards.slice(skip, skip + limit);
    
    // Return paginated response
    const response = calculatePagination(items, page, limit, total);
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({
      error: 'Failed to fetch cards',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * Alternative: MongoDB Implementation
 */
/*
router.get('/monitoring/cards', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const skip = (page - 1) * limit;
    
    // MongoDB query with pagination
    const [items, total] = await Promise.all([
      Card.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
      Card.countDocuments()
    ]);
    
    const response = calculatePagination(items, page, limit, total);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});
*/

/**
 * Alternative: MySQL/PostgreSQL Implementation
 */
/*
router.get('/monitoring/cards', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);
    const offset = (page - 1) * limit;
    
    // SQL query with LIMIT and OFFSET
    const [items, totalResult] = await Promise.all([
      db.query('SELECT * FROM cards ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset]),
      db.query('SELECT COUNT(*) as count FROM cards')
    ]);
    
    const total = totalResult[0].count;
    const response = calculatePagination(items, page, limit, total);
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cards' });
  }
});
*/

export default router;