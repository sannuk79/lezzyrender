export class DevicePerformanceMonitor {
  private frameRateHistory: number[] = [];
  private memoryUsageHistory: number[] = [];
  private gcMonitoring: boolean = false;
  private readonly HISTORY_SIZE = 10;
  
  constructor() {
    this.setupPerformanceMonitoring();
  }
  
  // Monitor frame rate
  async getFrameRate(): Promise<number> {
    return new Promise(resolve => {
      const start = performance.now();
      let frames = 0;
      
      const measure = () => {
        frames++;
        if (frames >= 60) { // Measure over 60 frames
          const elapsed = performance.now() - start;
          const fps = Math.round((frames / elapsed) * 1000);
          this.frameRateHistory.push(fps);
          if (this.frameRateHistory.length > this.HISTORY_SIZE) {
            this.frameRateHistory.shift();
          }
          resolve(fps);
        } else {
          requestAnimationFrame(measure);
        }
      };
      
      requestAnimationFrame(measure);
    });
  }
  
  // Get average frame rate
  getAverageFrameRate(): number {
    if (this.frameRateHistory.length === 0) return 60;
    const sum = this.frameRateHistory.reduce((a, b) => a + b, 0);
    return sum / this.frameRateHistory.length;
  }
  
  // Monitor memory usage (where available)
  getMemoryInfo(): { used: number; total: number; } | null {
    if ('memory' in performance) {
      // @ts-ignore - memory property is non-standard
      const mem = performance.memory;
      if (mem) {
        return {
          used: mem.usedJSHeapSize,
          total: mem.jsHeapSizeLimit
        };
      }
    }
    return null;
  }
  
  // Assess overall device performance
  async assessPerformance(): Promise<number> {
    const frameRate = await this.getFrameRate();
    const memoryInfo = this.getMemoryInfo();
    
    // Normalize frame rate (60fps = excellent, 30fps = poor)
    const frameRateScore = Math.min(frameRate / 60, 1);
    
    // If we have memory info, factor it in
    if (memoryInfo) {
      const memoryScore = 1 - (memoryInfo.used / memoryInfo.total);
      return (frameRateScore * 0.7) + (memoryScore * 0.3);
    }
    
    return frameRateScore;
  }
  
  private setupPerformanceMonitoring(): void {
    // Set up performance monitoring intervals
    setInterval(() => {
      this.getFrameRate(); // Update frame rate history
    }, 5000); // Every 5 seconds
  }
  
  // Get performance insights
  getPerformanceInsights(): {
    frameRate: number;
    performanceScore: number;
    memoryUsed: number | null;
    memoryTotal: number | null;
  } {
    const frameRate = this.getAverageFrameRate();
    const memoryInfo = this.getMemoryInfo();
    
    // Calculate performance score based on frame rate
    const performanceScore = Math.min(frameRate / 60, 1);
    
    return {
      frameRate,
      performanceScore,
      memoryUsed: memoryInfo?.used || null,
      memoryTotal: memoryInfo?.total || null
    };
  }
}