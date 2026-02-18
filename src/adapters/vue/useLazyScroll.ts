import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { Engine } from '../../core/Engine';
import { EngineConfig, VisibleRange, FetchMoreCallback } from '../../core/types';

interface LazyScrollConfig extends EngineConfig {
  fetchMore: FetchMoreCallback;
}

export const useLazyScroll = (config: LazyScrollConfig) => {
  const { fetchMore, ...engineConfig } = config;
  const engine = new Engine(engineConfig);
  engine.setFetchMoreCallback(fetchMore);

  const visibleRange = ref<VisibleRange>({ start: 0, end: 0 });
  const loadedItems = ref<any[]>([]);
  const isLoading = ref(false);
  const containerRef = ref<HTMLElement | null>(null);
  const scrollTop = ref(0);

  // Initialize scroll listener
  let scrollHandler: ((event: Event) => void) | null = null;

  onMounted(() => {
    if (containerRef.value) {
      scrollHandler = () => {
        if (containerRef.value) {
          scrollTop.value = containerRef.value.scrollTop;
          updateScrollPosition(scrollTop.value);
        }
      };

      containerRef.value.addEventListener('scroll', scrollHandler, { passive: true });
    }
  });

  onUnmounted(() => {
    if (containerRef.value && scrollHandler) {
      containerRef.value.removeEventListener('scroll', scrollHandler);
    }
    engine.cleanup();
  });

  // Watch for scroll position changes
  watch(scrollTop, (newScrollTop) => {
    updateScrollPosition(newScrollTop);
  });

  const updateScrollPosition = async (position: number) => {
    await engine.updateScrollPosition(position);
    const state = engine.getState();
    visibleRange.value = state.visibleRange;
    isLoading.value = state.isLoading;
  };

  // Refresh function
  const refresh = () => {
    if (containerRef.value) {
      updateScrollPosition(containerRef.value.scrollTop);
    }
  };

  return {
    visibleRange: computed(() => visibleRange.value),
    loadedItems: computed(() => loadedItems.value),
    isLoading: computed(() => isLoading.value),
    containerRef,
    refresh
  };
};