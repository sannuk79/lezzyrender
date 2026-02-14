export class PrefetchManager {
  /**
   * This class is kept for backward compatibility
   * Intelligent prefetching is now handled in the Engine class
   */
  constructor() {}

  /**
   * Legacy method - not used in intelligent mode
   */
  shouldPrefetch(visibleEnd: number, totalLoaded: number): boolean {
    // Simple rule: if visible end is approaching the loaded boundary, fetch more
    return visibleEnd >= totalLoaded - 5; // Default buffer
  }

  /**
   * Update buffer size if it changes (for backward compatibility)
   */
  updateBufferSize(size: number): void {
    // This method exists for backward compatibility
    // Intelligent prefetching is now handled in the Engine class
  }
}