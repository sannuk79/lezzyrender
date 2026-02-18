/**
 * Request Deduplication
 * Prevents duplicate requests from being sent
 */

export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private requestCount: Map<string, number> = new Map();

  /**
   * Execute request with deduplication
   * If same request is already pending, return existing promise
   */
  async request<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number = 5000 // Time to live in ms
  ): Promise<T> {
    // Check if same request is already pending
    if (this.pendingRequests.has(key)) {
      console.log(`[RequestDeduplicator] Deduplicating request: ${key}`);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create new request
    const promise = requestFn()
      .then(result => {
        this.pendingRequests.delete(key);
        this.requestCount.delete(key);
        return result;
      })
      .catch(error => {
        this.pendingRequests.delete(key);
        this.requestCount.delete(key);
        throw error;
      });

    // Store pending request
    this.pendingRequests.set(key, promise);
    
    // Track request count for analytics
    const count = this.requestCount.get(key) || 0;
    this.requestCount.set(key, count + 1);

    // Auto cleanup after TTL
    setTimeout(() => {
      if (this.pendingRequests.has(key)) {
        this.pendingRequests.delete(key);
      }
    }, ttl);

    return promise;
  }

  /**
   * Clear specific request
   */
  clear(key: string): void {
    this.pendingRequests.delete(key);
    this.requestCount.delete(key);
  }

  /**
   * Clear all requests
   */
  clearAll(): void {
    this.pendingRequests.clear();
    this.requestCount.clear();
  }

  /**
   * Get pending request count
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Get request statistics
   */
  getStats(): {
    pending: number;
    totalRequests: number;
    deduplicationRate: number;
  } {
    const totalRequests = Array.from(this.requestCount.values()).reduce((a, b) => a + b, 0);
    const deduplicated = totalRequests - this.pendingRequests.size;
    
    return {
      pending: this.pendingRequests.size,
      totalRequests,
      deduplicationRate: totalRequests > 0 ? deduplicated / totalRequests : 0
    };
  }
}

export default RequestDeduplicator;