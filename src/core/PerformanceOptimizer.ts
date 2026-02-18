export class PerformanceOptimizer {
  private frameBudget: number = 16; // Target for 60fps (16.67ms per frame)
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  private isOptimizing: boolean = false;
  
  // Frame rate limiter to prevent excessive updates
  private lastUpdate: number = 0;
  private minUpdateInterval: number = 16; // Minimum 16ms between updates (60fps)
  
  // Batch updates to reduce DOM manipulations
  private updateQueue: Array<() => void> = [];
  private isProcessingQueue: boolean = false;
  
  // Memory optimization
  private cleanupThreshold: number = 1000; // Clean up items beyond this threshold
  private gcInterval: number | null = null;
  
  constructor() {
    this.setupPerformanceMonitoring();
  }
  
  // Optimize rendering by limiting updates to frame budget
  scheduleOptimizedUpdate(updateFn: () => void): void {
    const now = performance.now();
    
    // Throttle updates based on frame rate
    if (now - this.lastUpdate < this.minUpdateInterval) {
      // Queue the update for later
      this.updateQueue.push(updateFn);
      
      if (!this.isProcessingQueue) {
        this.processUpdateQueue();
      }
      return;
    }
    
    // Check if we have enough time in the current frame
    if (this.getTimeRemaining() > 4) { // Leave 4ms buffer
      updateFn();
      this.lastUpdate = now;
    } else {
      // Schedule for next frame
      this.updateQueue.push(updateFn);
      if (!this.isProcessingQueue) {
        this.processUpdateQueue();
      }
    }
  }
  
  // Process queued updates efficiently
  private async processUpdateQueue(): Promise<void> {
    if (this.updateQueue.length === 0) {
      this.isProcessingQueue = false;
      return;
    }
    
    this.isProcessingQueue = true;
    const currentTime = performance.now();
    
    // Process as many updates as possible within frame budget
    while (this.updateQueue.length > 0 && this.getTimeRemaining() > 2) {
      const updateFn = this.updateQueue.shift();
      if (updateFn) {
        updateFn();
      }
    }
    
    this.lastUpdate = currentTime;
    
    if (this.updateQueue.length > 0) {
      // Schedule remaining updates for next frame (only in browser environment)
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(() => this.processUpdateQueue());
      } else {
        // In Node.js environment, use setTimeout as fallback
        setTimeout(() => this.processUpdateQueue(), 0);
      }
    } else {
      this.isProcessingQueue = false;
    }
  }
  
  // Get remaining time in current frame
  private getTimeRemaining(): number {
    if (typeof performance === 'undefined' || !performance.now) {
      return 16; // Fallback to 60fps
    }
    
    const currentTime = performance.now();
    // Typically browsers target 10ms remaining time for smoothness
    return Math.max(0, this.frameBudget - (currentTime - this.lastFrameTime));
  }
  
  // Memory optimization: cleanup off-screen items
  optimizeMemory(cleanupFn: (startIndex: number, endIndex: number) => void, visibleRange: { start: number, end: number }): void {
    // Determine cleanup range (items far from visible range)
    const cleanupStart = Math.max(0, visibleRange.end + this.cleanupThreshold);
    const cleanupEnd = Math.max(0, visibleRange.start - this.cleanupThreshold);
    
    if (cleanupStart > visibleRange.end) {
      cleanupFn(visibleRange.end, cleanupStart);
    }
    
    if (cleanupEnd < visibleRange.start) {
      cleanupFn(cleanupEnd, visibleRange.start);
    }
  }
  
  // Enable GPU acceleration for smoother scrolling
  enableGPUCssAcceleration(element: HTMLElement): void {
    // Force hardware acceleration
    element.style.willChange = 'transform';
    element.style.transform = 'translateZ(0)';
    element.style.backfaceVisibility = 'hidden';
  }
  
  // Disable GPU acceleration when not needed
  disableGPUCssAcceleration(element: HTMLElement): void {
    element.style.willChange = 'auto';
    element.style.transform = '';
    element.style.backfaceVisibility = '';
  }
  
  // Optimize for different device capabilities
  getOptimizationProfile(): {
    frameRate: number;
    batchSize: number;
    bufferMultiplier: number;
    updateInterval: number;
  } {
    // Simple profile detection based on common device characteristics
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    
    // Detect low-end devices
    if (this.isLowEndDevice(userAgent)) {
      return {
        frameRate: 30, // Lower target for low-end devices
        batchSize: 5, // Smaller batches
        bufferMultiplier: 0.5, // Smaller buffer
        updateInterval: 32 // 30fps interval
      };
    }
    
    // Default profile for capable devices
    return {
      frameRate: 60,
      batchSize: 10,
      bufferMultiplier: 1.0,
      updateInterval: 16 // 60fps interval
    };
  }
  
  private isLowEndDevice(userAgent: string): boolean {
    // Simple heuristic for low-end devices
    const lowEndPatterns = [
      /Android.*Mobile/,
      /iPhone.*OS [0-9]+_[0-9]+/,
      /Opera Mini/,
      /IEMobile/
    ];
    
    return lowEndPatterns.some(pattern => pattern.test(userAgent));
  }
  
  // Setup performance monitoring
  private setupPerformanceMonitoring(): void {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      // In Node.js environment, skip browser-specific monitoring
      return;
    }
    
    // Monitor frame rate
    let frameCount = 0;
    let lastTime = performance.now();
    
    const monitorFrameRate = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) { // Every second
        const fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        
        // Adjust optimization based on actual FPS
        if (fps < 30) {
          this.frameBudget = 32; // Target 30fps
        } else if (fps < 50) {
          this.frameBudget = 20; // Target 50fps
        } else {
          this.frameBudget = 16; // Target 60fps
        }
      }
      
      this.animationFrameId = requestAnimationFrame(monitorFrameRate);
    };
    
    this.animationFrameId = requestAnimationFrame(monitorFrameRate);
    
    // Setup garbage collection monitoring
    this.gcInterval = window.setInterval(() => {
      if ('gc' in window) {
        // @ts-ignore - gc is non-standard
        window.gc();
      }
    }, 30000); // GC every 30 seconds
  }
  
  // Get performance insights
  getPerformanceInsights(): {
    frameRate: number;
    memoryUsage: number | null;
    updateFrequency: number;
    optimizationActive: boolean;
  } {
    return {
      frameRate: 60, // Would be calculated from monitoring
      memoryUsage: this.getMemoryUsage(),
      updateFrequency: 1000 / this.minUpdateInterval,
      optimizationActive: this.isOptimizing
    };
  }
  
  private getMemoryUsage(): number | null {
    if ('memory' in performance) {
      // @ts-ignore - memory property is non-standard
      return performance.memory?.usedJSHeapSize || null;
    }
    return null;
  }
  
  // Cleanup resources
  cleanup(): void {
    if (this.animationFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    if (this.gcInterval && typeof clearInterval !== 'undefined') {
      clearInterval(this.gcInterval);
    }
    
    this.updateQueue = [];
    this.isProcessingQueue = false;
  }
}