export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private processing: boolean = false;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 1) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add a request to the queue
   */
  add(requestFn: () => Promise<any>): Promise<any> {
    return new Promise((resolve, reject) => {
      this.queue.push(() => requestFn().then(resolve).catch(reject));
      
      // Start processing if not already processing
      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  /**
   * Process the queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    // Process up to maxConcurrent requests
    const concurrentRequests = [];
    const count = Math.min(this.maxConcurrent, this.queue.length);

    for (let i = 0; i < count; i++) {
      const requestFn = this.queue.shift();
      if (requestFn) {
        concurrentRequests.push(requestFn());
      }
    }

    try {
      await Promise.all(concurrentRequests);
    } catch (error) {
      console.error('Request queue error:', error);
    }

    // Process remaining items
    await this.processQueue();
  }

  /**
   * Clear the queue
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get the current queue length
   */
  getLength(): number {
    return this.queue.length;
  }
}