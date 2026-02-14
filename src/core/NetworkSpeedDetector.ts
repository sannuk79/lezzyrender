export class NetworkSpeedDetector {
  private bandwidthHistory: number[] = [];
  private latencyHistory: number[] = [];
  private readonly HISTORY_SIZE = 5;
  
  // Estimate available bandwidth
  async estimateBandwidth(): Promise<number> {
    const startTime = performance.now();
    const testData = new Array(10000).fill('test_data').join('');
    
    try {
      // Send test request to measure bandwidth
      const response = await fetch('/api/network-test', {
        method: 'POST',
        body: testData
      });
      
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const dataSize = testData.length; // bytes
      const bandwidth = dataSize / duration; // bytes per second
      
      this.bandwidthHistory.push(bandwidth);
      if (this.bandwidthHistory.length > this.HISTORY_SIZE) {
        this.bandwidthHistory.shift();
      }
      
      return this.getAverageBandwidth();
    } catch (error) {
      // If network test fails, return a conservative estimate
      return 100000; // 100 KB/s as fallback
    }
  }
  
  // Measure network latency
  async measureLatency(): Promise<number> {
    try {
      const startTime = performance.now();
      
      await fetch('/api/ping');
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      this.latencyHistory.push(latency);
      if (this.latencyHistory.length > this.HISTORY_SIZE) {
        this.latencyHistory.shift();
      }
      
      return this.getAverageLatency();
    } catch (error) {
      // If ping fails, return a high latency as fallback
      return 1000; // 1 second as fallback
    }
  }
  
  // Assess overall connection quality
  async assessConnectionQuality(): Promise<'excellent' | 'good' | 'poor' | 'offline'> {
    try {
      const [bandwidth, latency] = await Promise.all([
        this.estimateBandwidth(),
        this.measureLatency()
      ]);
      
      if (latency > 1000) return 'poor'; // High latency
      if (bandwidth < 100000) return 'poor'; // Low bandwidth (< 100 KB/s)
      if (latency > 500 || bandwidth < 500000) return 'good'; // Moderate
      return 'excellent'; // Fast and responsive
    } catch {
      return 'offline';
    }
  }
  
  private getAverageBandwidth(): number {
    if (this.bandwidthHistory.length === 0) return 0;
    const sum = this.bandwidthHistory.reduce((a, b) => a + b, 0);
    return sum / this.bandwidthHistory.length;
  }
  
  private getAverageLatency(): number {
    if (this.latencyHistory.length === 0) return 0;
    const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
    return sum / this.latencyHistory.length;
  }
  
  // Get current network statistics
  getNetworkStats(): { bandwidth: number; latency: number; history: number[] } {
    return {
      bandwidth: this.getAverageBandwidth(),
      latency: this.getAverageLatency(),
      history: [...this.bandwidthHistory]
    };
  }
}