<template>
  <div
    ref="containerRef"
    class="lazy-scroll-container"
    :style="{ height: `${viewportHeight}px`, overflowY: 'auto' }"
  >
    <!-- Top padding to maintain scroll position -->
    <div :style="{ height: `${topPadding}px` }"></div>
    
    <!-- Visible items -->
    <div
      v-for="(item, index) in visibleItems"
      :key="visibleRange.start + index"
      :style="{ height: `${itemHeight}px` }"
      class="lazy-item"
    >
      <slot :item="item" :index="visibleRange.start + index" />
    </div>
    
    <!-- Bottom padding -->
    <div :style="{ height: `${bottomPadding}px` }"></div>
    
    <!-- Loading indicator -->
    <div v-if="isLoading" class="lazy-loading">
      Loading more items...
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLazyScroll } from './useLazyScroll';

// Define props
interface Props {
  items: any[];
  itemHeight: number;
  viewportHeight: number;
  fetchMore: () => Promise<any>;
  bufferSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  bufferSize: 5
});

// Use the lazy scroll composable
const { visibleRange, isLoading, containerRef, refresh } = useLazyScroll({
  itemHeight: props.itemHeight,
  viewportHeight: props.viewportHeight,
  bufferSize: props.bufferSize,
  fetchMore: props.fetchMore
});

// Calculate paddings
const topPadding = computed(() => visibleRange.value.start * props.itemHeight);
const bottomPadding = computed(() => 
  Math.max(0, (props.items.length - visibleRange.value.end) * props.itemHeight)
);

// Get visible items
const visibleItems = computed(() => 
  props.items.slice(visibleRange.value.start, visibleRange.value.end)
);

// Define slots
defineSlots<{
  default: (props: { item: any; index: number }) => void;
}>();
</script>

<style scoped>
.lazy-scroll-container {
  position: relative;
}

.lazy-item {
  width: 100%;
}

.lazy-loading {
  text-align: center;
  padding: 20px;
  color: #666;
}
</style>