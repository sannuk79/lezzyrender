import { DevicePerformanceMonitor } from './DevicePerformanceMonitor';
import { ContentComplexityAnalyzer } from './ContentComplexityAnalyzer';

export class AdaptiveBufferCalculator {
  private scrollFactor: number = 0.3;      // Weight for scroll velocity
  private networkFactor: number = 0.3;     // Weight for network quality
  private performanceFactor: number = 0.2; // Weight for device performance
  private contentFactor: number = 0.2;     // Weight for content complexity
  
  private performanceMonitor: DevicePerformanceMonitor;
  private contentAnalyzer: ContentComplexityAnalyzer;
  
  constructor() {
    this.performanceMonitor = new DevicePerformanceMonitor();
    this.contentAnalyzer = new ContentComplexityAnalyzer();
  }
  
  // Calculate optimal buffer size based on multiple factors
  async calculateOptimalBuffer(params: {
    scrollVelocity: number;
    networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
    baseBuffer: number;
    visibleItems: any[];
  }): Promise<number> {
    // Calculate scroll-based buffer
    const scrollBuffer = this.calculateScrollBuffer(params.scrollVelocity, params.baseBuffer);
    
    // Calculate network-based adjustment
    const networkAdjustment = this.calculateNetworkAdjustment(params.networkQuality);
    
    // Calculate performance-based adjustment
    const performanceScore = await this.performanceMonitor.assessPerformance();
    const performanceAdjustment = this.calculatePerformanceAdjustment(performanceScore);
    
    // Calculate content-based adjustment
    const contentComplexity = this.contentAnalyzer.analyzeContentComplexity(params.visibleItems);
    const contentAdjustment = this.calculateContentAdjustment(contentComplexity);
    
    // Combine all factors
    const weightedBuffer = (
      scrollBuffer * this.scrollFactor +
      (params.baseBuffer * networkAdjustment) * this.networkFactor +
      (params.baseBuffer * performanceAdjustment) * this.performanceFactor +
      (params.baseBuffer * contentAdjustment) * this.contentFactor
    );
    
    // Apply reasonable bounds
    return Math.max(3, Math.min(50, Math.round(weightedBuffer)));
  }
  
  private calculateScrollBuffer(velocity: number, baseBuffer: number): number {
    const absVelocity = Math.abs(velocity);
    if (absVelocity > 2.0) return baseBuffer * 4; // Very fast scroll
    if (absVelocity > 1.0) return baseBuffer * 2.5; // Fast scroll
    if (absVelocity > 0.3) return baseBuffer * 1.5; // Medium scroll
    return baseBuffer * 0.8; // Slow scroll
  }
  
  private calculateNetworkAdjustment(quality: string): number {
    switch(quality) {
      case 'excellent': return 1.5; // More buffer on fast networks
      case 'good': return 1.2;      // Slightly more
      case 'poor': return 0.7;      // Less buffer on slow networks
      case 'offline': return 0.5;   // Minimal buffer when offline
      default: return 1.0;
    }
  }
  
  private calculatePerformanceAdjustment(performance: number): number {
    // performance is 0-1 scale (0 = poor, 1 = excellent)
    return 0.5 + (performance * 0.8); // Range from 0.5 to 1.3
  }
  
  private calculateContentAdjustment(complexity: number): number {
    // complexity is 0-1 scale (0 = simple, 1 = complex)
    return 1.5 - (complexity * 0.8); // Range from 0.7 to 1.5
  }
  
  // Get adaptive insights
  async getAdaptiveInsights(params: {
    scrollVelocity: number;
    networkQuality: 'excellent' | 'good' | 'poor' | 'offline';
    baseBuffer: number;
    visibleItems: any[];
  }): Promise<{
    currentBuffer: number;
    performance: { frameRate: number; score: number };
    network: { quality: string; adjustment: number };
    complexity: { score: number; breakdown: any };
    factors: {
      scroll: number;
      network: number;
      performance: number;
      content: number;
    };
  }> {
    const buffer = await this.calculateOptimalBuffer(params);
    const perfInsights = this.performanceMonitor.getPerformanceInsights();
    const complexityInsights = this.contentAnalyzer.getComplexityInsights(params.visibleItems);
    
    return {
      currentBuffer: buffer,
      performance: {
        frameRate: perfInsights.frameRate,
        score: perfInsights.performanceScore
      },
      network: {
        quality: params.networkQuality,
        adjustment: this.calculateNetworkAdjustment(params.networkQuality)
      },
      complexity: {
        score: this.contentAnalyzer.analyzeContentComplexity(params.visibleItems),
        breakdown: complexityInsights
      },
      factors: {
        scroll: this.calculateScrollBuffer(params.scrollVelocity, params.baseBuffer),
        network: this.calculateNetworkAdjustment(params.networkQuality),
        performance: this.calculatePerformanceAdjustment(perfInsights.performanceScore),
        content: this.calculateContentAdjustment(complexityInsights.averageComplexity)
      }
    };
  }
}