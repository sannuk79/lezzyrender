/**
 * Priority-based Request Queue
 * Processes high-priority requests first
 */

export enum Priority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

interface QueuedRequest {
  priority: Priority;
  requestFn: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timestamp: number;
}

export class PriorityRequestQueue {
  private queues: Map<Priority, QueuedRequest[]> = new Map();
  private processing: boolean = false;
  private maxConcurrent: number = 2;
  private activeRequests: number = 0;

  constructor(maxConcurrent: number = 2) {
    this.maxConcurrent = maxConcurrent;
    
    // Initialize priority queues
    Object.values(Priority).forEach(priority => {
      if (typeof priority === 'number') {
        this.queues.set(priority, []);
      }
    });
  }

  /**
   * Add request with priority
   */
  add<T>(
    requestFn: () => Promise<T>,
    priority: Priority = Priority.NORMAL
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const request: QueuedRequest = {
        priority,
        requestFn: () => requestFn() as Promise<any>,
        resolve,
        reject,
        timestamp: Date.now()
      };

      // Add to appropriate priority queue
      const queue = this.queues.get(priority) || [];
      queue.push(request);
      this.queues.set(priority, queue);

      // Start processing if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process queue by priority
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;

    while (this.hasPendingRequests() && this.activeRequests < this.maxConcurrent) {
      // Get highest priority request
      const request = this.getNextRequest();
      
      if (!request) break;

      this.activeRequests++;

      // Execute request
      request.requestFn()
        .then(request.resolve)
        .catch(request.reject)
        .finally(() => {
          this.activeRequests--;
          this.processQueue();
        });
    }

    this.processing = false;
  }

  /**
   * Get next request by priority
   */
  private getNextRequest(): QueuedRequest | null {
    // Process from highest priority to lowest
    for (let priority = Priority.CRITICAL; priority >= Priority.LOW; priority--) {
      const queue = this.queues.get(priority);
      if (queue && queue.length > 0) {
        return queue.shift() || null;
      }
    }
    return null;
  }

  /**
   * Check if there are pending requests
   */
  private hasPendingRequests(): boolean {
    for (const queue of this.queues.values()) {
      if (queue.length > 0) return true;
    }
    return false;
  }

  /**
   * Get queue statistics
   */
  getStats(): {
    totalPending: number;
    byPriority: {
      critical: number;
      high: number;
      normal: number;
      low: number;
    };
    activeRequests: number;
  } {
    const byPriority = {
      critical: this.queues.get(Priority.CRITICAL)?.length || 0,
      high: this.queues.get(Priority.HIGH)?.length || 0,
      normal: this.queues.get(Priority.NORMAL)?.length || 0,
      low: this.queues.get(Priority.LOW)?.length || 0
    };

    return {
      totalPending: Object.values(byPriority).reduce((a, b) => a + b, 0),
      byPriority,
      activeRequests: this.activeRequests
    };
  }

  /**
   * Clear all queues
   */
  clear(): void {
    this.queues.forEach(queue => queue.length = 0);
    this.processing = false;
    this.activeRequests = 0;
  }

  /**
   * Clear specific priority queue
   */
  clearPriority(priority: Priority): void {
    const queue = this.queues.get(priority);
    if (queue) {
      queue.length = 0;
    }
  }
}

export default PriorityRequestQueue;