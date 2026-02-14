export class IntelligentScrollDetector {
  private lastScrollTop: number = 0;
  private lastTime: number = 0;
  private velocityHistory: number[] = [];
  private readonly HISTORY_SIZE = 5;
  private scrollTimeout: number | null = null;
  private isIdle: boolean = true;

  constructor() {
    this.lastTime = performance.now();
  }

  // Calculate velocity from scroll event
  calculateVelocity(scrollTop: number): number {
    const now = performance.now();
    const deltaY = scrollTop - this.lastScrollTop;
    const deltaTime = now - this.lastTime;

    // Calculate velocity (pixels per millisecond)
    const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;

    // Store in history for smoothing
    this.velocityHistory.push(velocity);
    if (this.velocityHistory.length > this.HISTORY_SIZE) {
      this.velocityHistory.shift();
    }

    // Update for next calculation
    this.lastScrollTop = scrollTop;
    this.lastTime = now;

    // Update idle state
    this.isIdle = false;
    this.resetIdleTimer();

    // Return smoothed velocity (average of recent values)
    return this.getAverageVelocity();
  }

  // Get smoothed velocity from history
  private getAverageVelocity(): number {
    if (this.velocityHistory.length === 0) return 0;
    
    const sum = this.velocityHistory.reduce((acc, vel) => acc + vel, 0);
    return sum / this.velocityHistory.length;
  }

  // Determine scroll direction from velocity
  getDirection(velocity: number): 'up' | 'down' | 'stationary' {
    if (Math.abs(velocity) < 0.1) return 'stationary';
    return velocity > 0 ? 'down' : 'up';
  }

  // Calculate buffer size based on scroll velocity
  calculateBuffer(velocity: number): number {
    const absVelocity = Math.abs(velocity);
    
    if (absVelocity > 1.5) {
      return 20; // Large buffer for fast scrolling
    } else if (absVelocity > 1.0) {
      return 10; // Medium buffer
    } else if (absVelocity > 0.3) {
      return 7; // Small buffer for medium scrolling
    } else {
      return 5; // Minimal buffer when nearly stationary
    }
  }

  // Calculate prefetch distance based on velocity
  calculatePrefetchDistance(velocity: number): number {
    const absVelocity = Math.abs(velocity);
    
    if (absVelocity > 2.0) return 1200; // Far ahead for fast scrolling
    if (absVelocity > 1.0) return 800;  // Medium distance
    if (absVelocity > 0.3) return 400;  // Close distance for slow scroll
    return 200; // Minimal prefetch when nearly stationary
  }

  // Predict where user will be in X milliseconds
  predictPosition(currentPosition: number, velocity: number, msAhead: number = 500): number {
    return currentPosition + (velocity * msAhead);
  }

  // Check if user is currently idle
  getIsIdle(): boolean {
    return this.isIdle;
  }

  // Reset idle timer
  private resetIdleTimer(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    this.scrollTimeout = window.setTimeout(() => {
      this.isIdle = true;
    }, 150); // 150ms after last scroll = idle
  }

  // Clean up resources
  cleanup(): void {
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }
  }
}