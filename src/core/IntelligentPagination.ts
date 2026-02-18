/**
 * Intelligent Pagination
 * Adaptive page size with cursor-based pagination
 */

export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasMore: boolean;
  cursor?: string;
  nextCursor?: string;
  prevCursor?: string;
}

export interface CursorData {
  page: number;
  limit: number;
  timestamp: number;
  checksum?: string;
}

export class IntelligentPagination {
  private currentPage: number = 1;
  private basePageSize: number = 50;
  private adaptivePageSize: number = 50;
  private totalItems: number = 0;
  private loadHistory: { page: number; loadTime: number }[] = [];
  private readonly MIN_PAGE_SIZE = 20;
  private readonly MAX_PAGE_SIZE = 200;

  /**
   * Get current pagination state
   */
  getState(): PaginationState {
    const totalPages = Math.ceil(this.totalItems / this.adaptivePageSize);
    const hasMore = this.currentPage < totalPages;

    return {
      currentPage: this.currentPage,
      pageSize: this.adaptivePageSize,
      totalItems: this.totalItems,
      totalPages,
      hasMore,
      cursor: this.createCursor(this.currentPage),
      nextCursor: hasMore ? this.createCursor(this.currentPage + 1) : undefined,
      prevCursor: this.currentPage > 1 ? this.createCursor(this.currentPage - 1) : undefined
    };
  }

  /**
   * Set total items
   */
  setTotalItems(total: number): void {
    this.totalItems = total;
  }

  /**
   * Go to next page
   */
  nextPage(): PaginationState {
    const state = this.getState();
    if (state.hasMore) {
      this.currentPage++;
    }
    return this.getState();
  }

  /**
   * Go to previous page
   */
  prevPage(): PaginationState {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
    return this.getState();
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): PaginationState {
    const totalPages = Math.ceil(this.totalItems / this.adaptivePageSize);
    this.currentPage = Math.max(1, Math.min(page, totalPages));
    return this.getState();
  }

  /**
   * Record load time for adaptive sizing
   */
  recordLoadTime(page: number, loadTimeMs: number): void {
    this.loadHistory.push({ page, loadTime: loadTimeMs });
    
    // Keep last 10 load times
    if (this.loadHistory.length > 10) {
      this.loadHistory.shift();
    }

    // Adjust page size based on load time
    this.adaptPageSize();
  }

  /**
   * Adapt page size based on performance
   */
  private adaptPageSize(): void {
    if (this.loadHistory.length < 3) return;

    const avgLoadTime = this.loadHistory.reduce((a, b) => a.loadTime + b.loadTime, 0) / this.loadHistory.length;

    // Target: 100-300ms load time
    if (avgLoadTime < 100) {
      // Fast loads - increase page size
      this.adaptivePageSize = Math.min(
        this.MAX_PAGE_SIZE,
        Math.round(this.adaptivePageSize * 1.2)
      );
    } else if (avgLoadTime > 300) {
      // Slow loads - decrease page size
      this.adaptivePageSize = Math.max(
        this.MIN_PAGE_SIZE,
        Math.round(this.adaptivePageSize * 0.8)
      );
    }
    // Optimal load time - keep current size
  }

  /**
   * Create cursor for page
   */
  createCursor(page: number): string {
    const cursorData: CursorData = {
      page,
      limit: this.adaptivePageSize,
      timestamp: Date.now()
    };

    // Add checksum for validation
    cursorData.checksum = this.calculateChecksum(cursorData);

    return Buffer.from(JSON.stringify(cursorData)).toString('base64');
  }

  /**
   * Decode cursor
   */
  decodeCursor(cursor: string): CursorData | null {
    try {
      const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8')) as CursorData;
      
      // Validate checksum
      if (decoded.checksum && !this.validateChecksum(decoded)) {
        return null;
      }

      return decoded;
    } catch {
      return null;
    }
  }

  /**
   * Go to page from cursor
   */
  goToCursor(cursor: string): PaginationState {
    const decoded = this.decodeCursor(cursor);
    
    if (decoded) {
      this.currentPage = decoded.page;
      this.adaptivePageSize = decoded.limit;
    }

    return this.getState();
  }

  /**
   * Calculate checksum for cursor validation
   */
  private calculateChecksum(data: CursorData): string {
    const str = `${data.page}-${data.limit}-${data.timestamp}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Validate cursor checksum
   */
  private validateChecksum(data: CursorData): boolean {
    if (!data.checksum) return false;
    const { checksum, ...rest } = data;
    return this.calculateChecksum(rest as CursorData) === checksum;
  }

  /**
   * Get items to fetch for current page
   */
  getFetchRange(): { skip: number; limit: number } {
    return {
      skip: (this.currentPage - 1) * this.adaptivePageSize,
      limit: this.adaptivePageSize
    };
  }

  /**
   * Reset pagination
   */
  reset(): void {
    this.currentPage = 1;
    this.adaptivePageSize = this.basePageSize;
    this.loadHistory = [];
  }

  /**
   * Get load history for analytics
   */
  getLoadHistory(): { page: number; loadTime: number }[] {
    return [...this.loadHistory];
  }

  /**
   * Get average load time
   */
  getAverageLoadTime(): number {
    if (this.loadHistory.length === 0) return 0;
    return this.loadHistory.reduce((a, b) => a + b.loadTime, 0) / this.loadHistory.length;
  }

  /**
   * Set base page size
   */
  setBasePageSize(size: number): void {
    this.basePageSize = Math.max(this.MIN_PAGE_SIZE, Math.min(this.MAX_PAGE_SIZE, size));
    this.adaptivePageSize = this.basePageSize;
  }

  /**
   * Get current page size
   */
  getPageSize(): number {
    return this.adaptivePageSize;
  }

  /**
   * Get current page number
   */
  getCurrentPage(): number {
    return this.currentPage;
  }
}

export default IntelligentPagination;