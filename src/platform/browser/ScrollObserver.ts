export class ScrollObserver {
  private container: HTMLElement;
  private callback: (scrollTop: number) => void;
  private options: IntersectionObserverInit;
  private observer: IntersectionObserver | null = null;
  private sentinelElement: HTMLElement | null = null;
  
  constructor(
    container: HTMLElement, 
    callback: (scrollTop: number) => void,
    options?: Partial<IntersectionObserverInit>
  ) {
    this.container = container;
    this.callback = callback;
    this.options = {
      root: container,
      threshold: [0, 1],
      ...options
    };
  }

  /**
   * Start observing scroll events
   */
  observe(): void {
    // Create a sentinel element at the bottom to detect when user scrolls near the end
    this.sentinelElement = document.createElement('div');
    this.sentinelElement.style.height = '1px'; // Very small element
    this.sentinelElement.setAttribute('data-lazy-sentinel', '');
    
    // Add sentinel to the container
    this.container.appendChild(this.sentinelElement);
    
    // Create intersection observer to detect when sentinel comes into view
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Trigger callback with current scroll position
          this.callback(this.container.scrollTop);
        }
      });
    }, this.options);
    
    this.observer.observe(this.sentinelElement);
    
    // Also listen to scroll events for continuous updates
    this.container.addEventListener('scroll', this.onScroll, { passive: true });
  }

  /**
   * Handle scroll events
   */
  private onScroll = (): void => {
    // Debounced scroll handler to prevent too frequent updates
    this.debounce(() => {
      this.callback(this.container.scrollTop);
    }, 16); // ~60fps
  };

  /**
   * Debounce function for scroll events
   */
  private debounce(func: () => void, wait: number): void {
    let timeout: NodeJS.Timeout;
    
    clearTimeout(timeout);
    timeout = setTimeout(func, wait);
  }

  /**
   * Disconnect observer and clean up
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.sentinelElement) {
      this.sentinelElement.remove();
      this.sentinelElement = null;
    }
    
    this.container.removeEventListener('scroll', this.onScroll);
  }
}