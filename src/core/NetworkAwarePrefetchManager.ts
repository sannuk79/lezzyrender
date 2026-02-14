import { NetworkSpeedDetector } from './NetworkSpeedDetector';

export class NetworkAwarePrefetchManager {
  private networkDetector: NetworkSpeedDetector;
  private basePrefetchDistance = 400; // Base prefetch distance in pixels
  
  constructor(networkDetector: NetworkSpeedDetector) {
    this.networkDetector = networkDetector;
  }
  
  // Calculate prefetch distance based on network conditions
  async calculateNetworkAdjustedPrefetch(velocity: number): Promise<number> {
    const connectionQuality = await this.networkDetector.assessConnectionQuality();
    
    // Base prefetch distance from scroll velocity
    let baseDistance = this.basePrefetchDistance;
    if (Math.abs(velocity) > 2.0) baseDistance = 1200;
    else if (Math.abs(velocity) > 1.0) baseDistance = 800;
    else if (Math.abs(velocity) > 0.3) baseDistance = 400;
    else baseDistance = 200;
    
    // Adjust based on network quality
    switch(connectionQuality) {
      case 'excellent':
        return Math.round(baseDistance * 1.5); // Extra prefetch on fast networks
      case 'good':
        return Math.round(baseDistance * 1.2); // Slightly more prefetch
      case 'poor':
        return Math.round(baseDistance * 0.7); // Less prefetch on slow networks
      case 'offline':
        return Math.round(baseDistance * 0.3); // Minimal prefetch when offline
      default:
        return baseDistance;
    }
  }
  
  // Calculate batch size based on network conditions
  async calculateNetworkAdjustedBatchSize(velocity: number): Promise<number> {
    const connectionQuality = await this.networkDetector.assessConnectionQuality();
    
    // Base batch size from scroll velocity
    let baseBatchSize = 10; // Default batch size
    if (Math.abs(velocity) > 2.0) baseBatchSize = 20; // Fast scroll needs more
    else if (Math.abs(velocity) > 1.0) baseBatchSize = 15;
    else if (Math.abs(velocity) > 0.3) baseBatchSize = 10;
    else baseBatchSize = 5; // Slow scroll needs less
    
    // Adjust based on network quality
    switch(connectionQuality) {
      case 'excellent':
        return Math.min(baseBatchSize * 2, 50); // Large batches on fast networks
      case 'good':
        return Math.min(baseBatchSize * 1.5, 30); // Medium batches
      case 'poor':
        return Math.max(Math.round(baseBatchSize * 0.5), 5); // Small batches on slow networks
      case 'offline':
        return Math.max(Math.round(baseBatchSize * 0.3), 3); // Minimal batches when offline
      default:
        return baseBatchSize;
    }
  }
  
  // Determine if prefetch should be delayed based on network conditions
  async shouldDelayPrefetch(): Promise<boolean> {
    const connectionQuality = await this.networkDetector.assessConnectionQuality();
    return connectionQuality === 'poor';
  }
}