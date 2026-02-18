import { Engine } from '../../core/Engine';
import { EngineConfig, FetchMoreCallback } from '../../core/types';

interface LazyScrollConfig {
  itemHeight: number;
  viewportHeight: number;
  bufferSize?: number;
  fetchMore: FetchMoreCallback;
}

export function lazyScroll(node: HTMLElement, config: LazyScrollConfig) {
  const engine = new Engine({
    itemHeight: config.itemHeight,
    viewportHeight: config.viewportHeight,
    bufferSize: config.bufferSize || 5
  });
  
  engine.setFetchMoreCallback(config.fetchMore);

  let scrollHandler: ((event: Event) => void) | null = null;

  // Initialize scroll handler
  scrollHandler = () => {
    const scrollTop = node.scrollTop;
    engine.updateScrollPosition(scrollTop);
  };

  // Add scroll listener
  node.addEventListener('scroll', scrollHandler, { passive: true });

  // Return destroy function
  return {
    update(newConfig: LazyScrollConfig) {
      // Update configuration if needed
      if (newConfig.fetchMore !== config.fetchMore) {
        engine.setFetchMoreCallback(newConfig.fetchMore);
      }
      config = newConfig;
    },
    destroy() {
      // Remove scroll listener
      if (scrollHandler) {
        node.removeEventListener('scroll', scrollHandler);
      }
      // Cleanup engine
      engine.cleanup();
    }
  };
}