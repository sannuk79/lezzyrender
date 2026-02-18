/**
 * Backend Pagination Helper for lazy-render
 * Solves the 1 million cards performance issue
 */

export interface PaginationParams {
  page: number;
  limit: number;
  cursor?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePagination<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;
  
  return {
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore,
      nextCursor: hasMore ? String(page + 1) : undefined,
      prevCursor: page > 1 ? String(page - 1) : undefined
    }
  };
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: PaginationParams): {
  page: number;
  limit: number;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validate page
  const page = parseInt(String(params.page)) || 1;
  if (page < 1) {
    errors.push('Page must be greater than 0');
  }
  
  // Validate limit
  const limit = parseInt(String(params.limit)) || 50;
  if (limit < 1) {
    errors.push('Limit must be greater than 0');
  }
  if (limit > 1000) {
    errors.push('Limit cannot exceed 1000 items per page');
  }
  
  return {
    page: page < 1 ? 1 : page,
    limit: limit < 1 ? 50 : limit > 1000 ? 1000 : limit,
    errors
  };
}

/**
 * Express.js middleware for pagination
 */
export function paginationMiddleware(
  req: any,
  res: any,
  next: () => void
) {
  const { page, limit, cursor } = req.query;
  
  const validated = validatePaginationParams({
    page: parseInt(String(page)) || 1,
    limit: parseInt(String(limit)) || 50,
    cursor
  });
  
  if (validated.errors.length > 0) {
    return res.status(400).json({
      error: 'Invalid pagination parameters',
      details: validated.errors
    });
  }
  
  req.pagination = {
    page: validated.page,
    limit: validated.limit,
    cursor: validated.cursor
  };
  
  next();
}

/**
 * Example Express route handler
 */
export function createPaginatedRoute<T>(
  getDataFunction: (skip: number, limit: number) => Promise<{ items: T[]; total: number }>,
  options: {
    defaultLimit?: number;
    maxLimit?: number;
  } = {}
) {
  const defaultLimit = options.defaultLimit || 50;
  const maxLimit = options.maxLimit || 1000;
  
  return async (req: any, res: any) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = Math.min(
        parseInt(req.query.limit) || defaultLimit,
        maxLimit
      );
      const skip = (page - 1) * limit;
      
      // Get data with pagination
      const { items, total } = await getDataFunction(skip, limit);
      
      // Return paginated response
      const response = calculatePagination(items, page, limit, total);
      
      res.json(response);
    } catch (error) {
      console.error('Pagination error:', error);
      res.status(500).json({
        error: 'Failed to fetch data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

export default {
  calculatePagination,
  validatePaginationParams,
  paginationMiddleware,
  createPaginatedRoute
};