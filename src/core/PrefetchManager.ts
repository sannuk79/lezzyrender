export class PrefetchManager {
  private bufferSize: number;

  constructor(bufferSize: number = 5) {
    this.bufferSize = bufferSize;
  }

  /**
   * Determine if more items should be fetched based on visible range and loaded items
   */
  shouldPrefetch(visibleEnd: number, totalLoaded: number): boolean {
    // Simple rule: if visible end is approaching the loaded boundary, fetch more
    return visibleEnd >= totalLoaded - this.bufferSize;
  }

  /**
   * Update buffer size if it changes
   */
  updateBufferSize(size: number): void {
    this.bufferSize = size;
  }
}