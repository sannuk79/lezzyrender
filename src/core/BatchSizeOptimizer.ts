/**
 * Batch Size Optimizer
 * Dynamically adjusts batch size based on scroll speed, network, and performance
 */

import { NetworkSpeedDetector } from './NetworkSpeedDetector';
import { DevicePerformanceMonitor } from './DevicePerformanceMonitor';

export interface BatchConfig {
  minBatchSize: number;
  maxBatchSize: number;
  baseBatchSize: number;
  scrollSpeedThreshold: number;
}

export interface BatchMetrics {
  currentBatchSize: number;
  scrollSpeed: number;
  networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
  performanceScore: number;
  avgRenderTime: number;
}

export class BatchSizeOptimizer {
  private config: BatchConfig;
  private networkDetector: NetworkSpeedDetector;
  private performanceMonitor: DevicePerformanceMonitor;
  
  private currentBatchSize: number;
  private scrollSpeedHistory: number[] = [];
  private renderTimeHistory: number[] = [];
  private readonly HISTORY_SIZE = 10;

  constructor(
    config?: Partial<BatchConfig>,
    networkDetector?: NetworkSpeedDetector,
    performanceMonitor?: DevicePerformanceMonitor
  ) {
    this.config = {
      minBatchSize: config?.minBatchSize || 10,
      maxBatchSize: config?.maxBatchSize || 100,
      baseBatchSize: config?.baseBatchSize || 50,
      scrollSpeedThreshold: config?.scrollSpeedThreshold || 1.0
    };
    
    this.currentBatchSize = this.config.baseBatchSize;
    this.networkDetector = networkDetector || new NetworkSpeedDetector();
    this.performanceMonitor = performanceMonitor || new DevicePerformanceMonitor();
  }

  /**
   * Calculate optimal batch size based on all factors
   */
  async calculateOptimalBatchSize(scrollSpeed: number): Promise<number> {
    // Track scroll speed history
    this.trackScrollSpeed(scrollSpeed);
    
    // Get network quality
    const networkQuality = await this.networkDetector.assessConnectionQuality();
    
    // Get performance score
    const performanceScore = await this.performanceMonitor.assessPerformance();
    
    // Calculate batch size based on scroll speed
    const speedMultiplier = this.calculateSpeedMultiplier(scrollSpeed);
    
    // Calculate batch size based on network
    const networkMultiplier = this.calculateNetworkMultiplier(networkQuality);
    
    // Calculate batch size based on performance
    const performanceMultiplier = this.calculatePerformanceMultiplier(performanceScore);
    
    // Calculate final batch size
    const optimalBatchSize = Math.round(
      this.config.baseBatchSize * speedMultiplier * networkMultiplier * performanceMultiplier
    );
    
    // Apply min/max bounds
    this.currentBatchSize = Math.max(
      this.config.minBatchSize,
      Math.min(this.config.maxBatchSize, optimalBatchSize)
    );
    
    return this.currentBatchSize;
  }

  /**
   * Calculate multiplier based on scroll speed
   */
  private calculateSpeedMultiplier(scrollSpeed: number): number {
    const avgScrollSpeed = this.getAverageScrollSpeed();
    
    // Fast scrolling = larger batches (preload more)
    if (Math.abs(avgScrollSpeed) > this.config.scrollSpeedThreshold * 2) {
      return 1.5; // 50% more items
    } else if (Math.abs(avgScrollSpeed) > this.config.scrollSpeedThreshold) {
      return 1.2; // 20% more items
    } else if (Math.abs(avgScrollSpeed) < 0.3) {
      return 0.8; // 20% fewer items (user reading carefully)
    }
    
    return 1.0; // Normal batch size
  }

  /**
   * Calculate multiplier based on network quality
   */
  private calculateNetworkMultiplier(quality: 'excellent' | 'good' | 'poor' | 'offline'): number {
    switch (quality) {
      case 'excellent':
        return 1.3; // Load more on fast network
      case 'good':
        return 1.1; // Slightly more
      case 'poor':
        return 0.6; // Load less on slow network
      case 'offline':
        return 0.3; // Minimal loading when offline
      default:
        return 1.0;
    }
  }

  /**
   * Calculate multiplier based on device performance
   */
  private calculatePerformanceMultiplier(score: number): number {
    // score is 0-1 (0 = poor, 1 = excellent)
    if (score > 0.8) {
      return 1.2; // High-performance device
    } else if (score > 0.5) {
      return 1.0; // Average device
    } else {
      return 0.7; // Low-performance device
    }
  }

  /**
   * Track scroll speed for averaging
   */
  private trackScrollSpeed(speed: number): void {
    this.scrollSpeedHistory.push(speed);
    if (this.scrollSpeedHistory.length > this.HISTORY_SIZE) {
      this.scrollSpeedHistory.shift();
    }
  }

  /**
   * Get average scroll speed
   */
  private getAverageScrollSpeed(): number {
    if (this.scrollSpeedHistory.length === 0) return 0;
    const sum = this.scrollSpeedHistory.reduce((a, b) => a + b, 0);
    return sum / this.scrollSpeedHistory.length;
  }

  /**
   * Track render time for performance monitoring
   */
  trackRenderTime(renderTime: number): void {
    this.renderTimeHistory.push(renderTime);
    if (this.renderTimeHistory.length > this.HISTORY_SIZE) {
      this.renderTimeHistory.shift();
    }
  }

  /**
   * Get average render time
   */
  getAverageRenderTime(): number {
    if (this.renderTimeHistory.length === 0) return 0;
    const sum = this.renderTimeHistory.reduce((a, b) => a + b, 0);
    return sum / this.renderTimeHistory.length;
  }

  /**
   * Get current batch metrics
   */
  getMetrics(): BatchMetrics {
    return {
      currentBatchSize: this.currentBatchSize,
      scrollSpeed: this.getAverageScrollSpeed(),
      networkQuality: 'good', // Would need to cache this
      performanceScore: 0.8, // Would need to cache this
      avgRenderTime: this.getAverageRenderTime()
    };
  }

  /**
   * Get current batch size
   */
  getCurrentBatchSize(): number {
    return this.currentBatchSize;
  }

  /**
   * Reset optimizer
   */
  reset(): void {
    this.scrollSpeedHistory = [];
    this.renderTimeHistory = [];
    this.currentBatchSize = this.config.baseBatchSize;
  }

  /**
   * Get optimization statistics
   */
  getStats(): {
    avgScrollSpeed: number;
    avgRenderTime: number;
    currentBatchSize: number;
    totalAdjustments: number;
  } {
    return {
      avgScrollSpeed: this.getAverageScrollSpeed(),
      avgRenderTime: this.getAverageRenderTime(),
      currentBatchSize: this.currentBatchSize,
      totalAdjustments: this.scrollSpeedHistory.length
    };
  }
}

export default BatchSizeOptimizer;