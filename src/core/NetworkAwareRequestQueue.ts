import { NetworkSpeedDetector } from './NetworkSpeedDetector';

export class NetworkAwareRequestQueue {
  private networkDetector: NetworkSpeedDetector;
  private queue: Array<() => Promise<any>> = [];
  private processing: boolean = false;
  private maxConcurrent: number = 1;
  private offlineQueue: Array<() => Promise<any>> = [];
  
  constructor(networkDetector: NetworkSpeedDetector) {
    this.networkDetector = networkDetector;
  }
  
  // Add request with network-aware concurrency
  async add(requestFn: () => Promise<any>): Promise<any> {
    // Adjust concurrency based on network conditions
    const connectionQuality = await this.networkDetector.assessConnectionQuality();
    
    switch(connectionQuality) {
      case 'excellent':
        this.maxConcurrent = 3; // Allow more concurrent requests
        break;
      case 'good':
        this.maxConcurrent = 2; // Moderate concurrency
        break;
      case 'poor':
        this.maxConcurrent = 1; // Sequential requests on slow networks
        break;
      case 'offline':
        // Queue for later when online
        return this.handleOfflineRequest(requestFn);
      default:
        this.maxConcurrent = 1;
    }
    
    return new Promise((resolve, reject) => {
      this.queue.push(() => requestFn().then(resolve).catch(reject));
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  // Process queue with network-aware concurrency
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
      console.error('Network-aware request queue error:', error);
    }
    
    // Process remaining items
    await this.processQueue();
  }
  
  // Handle requests when offline
  private async handleOfflineRequest(requestFn: () => Promise<any>): Promise<any> {
    // Store request for later execution
    return new Promise((resolve, reject) => {
      // Add to offline queue
      this.offlineQueue.push(() => requestFn().then(resolve).catch(reject));
      
      // Check for network restoration periodically
      const checkOnline = () => {
        if (navigator.onLine) {
          // Process offline queue
          this.processOfflineQueue();
          resolve(null); // Resolve with null since we can't return the actual result
        } else {
          setTimeout(checkOnline, 5000); // Check again in 5 seconds
        }
      };
      
      checkOnline();
    });
  }
  
  // Process offline queue when back online
  private async processOfflineQueue(): Promise<void> {
    const offlineRequests = [...this.offlineQueue];
    this.offlineQueue = [];
    
    for (const requestFn of offlineRequests) {
      try {
        await requestFn();
      } catch (error) {
        console.error('Offline request failed:', error);
        // Add back to offline queue for retry
        this.offlineQueue.push(requestFn);
      }
    }
  }
  
  // Get current queue status
  getQueueStatus(): { pending: number; offline: number; maxConcurrent: number } {
    return {
      pending: this.queue.length,
      offline: this.offlineQueue.length,
      maxConcurrent: this.maxConcurrent
    };
  }
  
  // Clear all queues
  clear(): void {
    this.queue = [];
    this.offlineQueue = [];
    this.processing = false;
  }
}