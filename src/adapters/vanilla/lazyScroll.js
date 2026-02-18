import { Engine } from '../../core/Engine';

export class LazyScroll {
  constructor(container, config) {
    this.container = container;
    this.config = {
      itemHeight: config.itemHeight || 50,
      viewportHeight: config.viewportHeight || 400,
      bufferSize: config.bufferSize || 5,
      fetchMore: config.fetchMore || (() => Promise.resolve([]))
    };

    this.engine = new Engine(this.config);
    this.engine.setFetchMoreCallback(this.config.fetchMore);

    this.visibleRange = { start: 0, end: 0 };
    this.isLoading = false;
    this.items = [];
    this.visibleItems = [];

    this.scrollHandler = this.onScroll.bind(this);
    this.container.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  onScroll() {
    const scrollTop = this.container.scrollTop;
    this.engine.updateScrollPosition(scrollTop);

    const state = this.engine.getState();
    this.visibleRange = state.visibleRange;
    this.isLoading = state.isLoading;

    this.render();
  }

  setItems(items) {
    this.items = items;
    this.render();
  }

  render() {
    // Calculate paddings
    const topPadding = this.visibleRange.start * this.config.itemHeight;
    const bottomPadding = Math.max(0, (this.items.length - this.visibleRange.end) * this.config.itemHeight);

    // Get visible items
    this.visibleItems = this.items.slice(this.visibleRange.start, this.visibleRange.end);

    // Clear container except for paddings and content
    const existingContent = this.container.querySelector('.lazy-scroll-content');
    if (existingContent) {
      existingContent.remove();
    }

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'lazy-scroll-content';

    // Add top padding
    const topPaddingDiv = document.createElement('div');
    topPaddingDiv.style.height = `${topPadding}px`;
    contentWrapper.appendChild(topPaddingDiv);

    // Add visible items
    this.visibleItems.forEach((item, index) => {
      const itemElement = this.createItemElement(item, this.visibleRange.start + index);
      contentWrapper.appendChild(itemElement);
    });

    // Add bottom padding
    const bottomPaddingDiv = document.createElement('div');
    bottomPaddingDiv.style.height = `${bottomPadding}px`;
    contentWrapper.appendChild(bottomPaddingDiv);

    // Add loading indicator if needed
    if (this.isLoading) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'lazy-loading';
      loadingElement.textContent = 'Loading more items...';
      contentWrapper.appendChild(loadingElement);
    }

    this.container.appendChild(contentWrapper);
  }

  createItemElement(item, index) {
    const itemElement = document.createElement('div');
    itemElement.style.height = `${this.config.itemHeight}px`;
    itemElement.className = 'lazy-item';

    // Default content - can be customized
    itemElement.textContent = `Item ${index}: ${item.text || item.id || 'Content'}`;

    return itemElement;
  }

  updateConfig(newConfig) {
    if (newConfig.itemHeight !== undefined) this.config.itemHeight = newConfig.itemHeight;
    if (newConfig.viewportHeight !== undefined) this.config.viewportHeight = newConfig.viewportHeight;
    if (newConfig.bufferSize !== undefined) this.config.bufferSize = newConfig.bufferSize;
    if (newConfig.fetchMore !== undefined) {
      this.config.fetchMore = newConfig.fetchMore;
      this.engine.setFetchMoreCallback(newConfig.fetchMore);
    }

    // Re-render with new config
    this.render();
  }

  destroy() {
    this.container.removeEventListener('scroll', this.scrollHandler);
    this.engine.cleanup();
  }

  // Public methods
  getVisibleRange() {
    return { ...this.visibleRange };
  }

  refresh() {
    this.onScroll();
  }
}

// Factory function for easier usage
export function createLazyScroll(container, config) {
  return new LazyScroll(container, config);
}