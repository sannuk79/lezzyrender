/**
 * Smart Prefetch Algorithm
 * Recognizes scroll patterns and predicts data loading needs
 */

export interface ScrollPattern {
  type: 'fast-scroll' | 'slow-scroll' | 'paused' | 'oscillating' | 'steady';
  velocity: number;
  acceleration: number;
  direction: 'up' | 'down' | 'stationary';
  confidence: number;
}

export interface PrefetchPrediction {
  shouldPrefetch: boolean;
  prefetchDistance: number;
  batchSize: number;
  priority: 'low' | 'normal' | 'high' | 'critical';
  confidence: number;
}

export class SmartPrefetchAlgorithm {
  private velocityHistory: number[] = [];
  private directionHistory: ('up' | 'down' | 'stationary')[] = [];
  private readonly HISTORY_SIZE = 20;
  private lastPrefetchTime: number = 0;
  private prefetchCooldown: number = 500; // ms

  /**
   * Analyze scroll pattern
   */
  analyzeScrollPattern(velocity: number, acceleration: number, direction: 'up' | 'down' | 'stationary'): ScrollPattern {
    this.trackVelocity(velocity);
    this.trackDirection(direction);

    const avgVelocity = this.getAverageVelocity();
    const velocityVariance = this.getVelocityVariance();
    const directionChanges = this.countDirectionChanges();

    // Determine pattern type
    let pattern: ScrollPattern;

    if (Math.abs(avgVelocity) > 2.0) {
      pattern = {
        type: 'fast-scroll',
        velocity: avgVelocity,
        acceleration,
        direction,
        confidence: 0.9
      };
    } else if (Math.abs(avgVelocity) < 0.3) {
      pattern = {
        type: 'paused',
        velocity: avgVelocity,
        acceleration,
        direction: 'stationary',
        confidence: 0.95
      };
    } else if (directionChanges > 5) {
      pattern = {
        type: 'oscillating',
        velocity: avgVelocity,
        acceleration,
        direction,
        confidence: 0.85
      };
    } else if (velocityVariance < 0.5) {
      pattern = {
        type: 'steady',
        velocity: avgVelocity,
        acceleration,
        direction,
        confidence: 0.9
      };
    } else {
      pattern = {
        type: 'slow-scroll',
        velocity: avgVelocity,
        acceleration,
        direction,
        confidence: 0.8
      };
    }

    return pattern;
  }

  /**
   * Predict prefetch needs based on scroll pattern
   */
  predictPrefetchNeeds(pattern: ScrollPattern, visibleEnd: number, totalLoaded: number): PrefetchPrediction {
    const now = Date.now();
    
    // Check cooldown
    if (now - this.lastPrefetchTime < this.prefetchCooldown) {
      return {
        shouldPrefetch: false,
        prefetchDistance: 0,
        batchSize: 0,
        priority: 'low',
        confidence: 1.0
      };
    }

    let prediction: PrefetchPrediction;

    switch (pattern.type) {
      case 'fast-scroll':
        prediction = {
          shouldPrefetch: true,
          prefetchDistance: 1500, // Far ahead for fast scrolling
          batchSize: 30, // Large batch
          priority: 'critical',
          confidence: pattern.confidence
        };
        break;

      case 'steady':
        prediction = {
          shouldPrefetch: visibleEnd >= totalLoaded - 800,
          prefetchDistance: 800,
          batchSize: 20,
          priority: 'high',
          confidence: pattern.confidence
        };
        break;

      case 'slow-scroll':
        prediction = {
          shouldPrefetch: visibleEnd >= totalLoaded - 400,
          prefetchDistance: 400,
          batchSize: 10,
          priority: 'normal',
          confidence: pattern.confidence
        };
        break;

      case 'oscillating':
        prediction = {
          shouldPrefetch: visibleEnd >= totalLoaded - 600,
          prefetchDistance: 600,
          batchSize: 15,
          priority: 'normal',
          confidence: pattern.confidence * 0.8 // Lower confidence for oscillating
        };
        break;

      case 'paused':
        prediction = {
          shouldPrefetch: false, // User paused, no need to prefetch
          prefetchDistance: 0,
          batchSize: 0,
          priority: 'low',
          confidence: pattern.confidence
        };
        break;

      default:
        prediction = {
          shouldPrefetch: visibleEnd >= totalLoaded - 500,
          prefetchDistance: 500,
          batchSize: 15,
          priority: 'normal',
          confidence: 0.7
        };
    }

    // Update last prefetch time if prefetching
    if (prediction.shouldPrefetch) {
      this.lastPrefetchTime = now;
    }

    return prediction;
  }

  /**
   * Track velocity history
   */
  private trackVelocity(velocity: number): void {
    this.velocityHistory.push(velocity);
    if (this.velocityHistory.length > this.HISTORY_SIZE) {
      this.velocityHistory.shift();
    }
  }

  /**
   * Track direction history
   */
  private trackDirection(direction: 'up' | 'down' | 'stationary'): void {
    this.directionHistory.push(direction);
    if (this.directionHistory.length > this.HISTORY_SIZE) {
      this.directionHistory.shift();
    }
  }

  /**
   * Get average velocity
   */
  private getAverageVelocity(): number {
    if (this.velocityHistory.length === 0) return 0;
    const sum = this.velocityHistory.reduce((a, b) => a + b, 0);
    return sum / this.velocityHistory.length;
  }

  /**
   * Get velocity variance
   */
  private getVelocityVariance(): number {
    if (this.velocityHistory.length < 2) return 0;
    const avg = this.getAverageVelocity();
    const squaredDiffs = this.velocityHistory.map(v => Math.pow(v - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
    return Math.sqrt(avgSquaredDiff);
  }

  /**
   * Count direction changes
   */
  private countDirectionChanges(): number {
    if (this.directionHistory.length < 2) return 0;
    let changes = 0;
    for (let i = 1; i < this.directionHistory.length; i++) {
      if (this.directionHistory[i] !== this.directionHistory[i - 1] &&
          this.directionHistory[i] !== 'stationary' &&
          this.directionHistory[i - 1] !== 'stationary') {
        changes++;
      }
    }
    return changes;
  }

  /**
   * Reset history
   */
  reset(): void {
    this.velocityHistory = [];
    this.directionHistory = [];
    this.lastPrefetchTime = 0;
  }

  /**
   * Get prediction confidence
   */
  getConfidence(): number {
    if (this.velocityHistory.length < 5) return 0.5; // Not enough data
    return Math.min(this.velocityHistory.length / this.HISTORY_SIZE, 1.0);
  }
}

export default SmartPrefetchAlgorithm;