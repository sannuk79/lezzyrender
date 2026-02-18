<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { lazyScroll } from './lazyScrollAction';

  interface Props {
    items: any[];
    itemHeight: number;
    viewportHeight: number;
    fetchMore: () => Promise<any>;
    bufferSize?: number;
  }

  export let items: any[] = [];
  export let itemHeight: number = 50;
  export let viewportHeight: number = 400;
  export let fetchMore: () => Promise<any>;
  export let bufferSize: number = 5;

  let container: HTMLElement;
  let visibleRange = $state({ start: 0, end: 0 });
  let isLoading = $state(false);

  // Initialize the lazy scroll action
  const scrollAction = (node: HTMLElement) => {
    return lazyScroll(node, {
      itemHeight,
      viewportHeight,
      bufferSize,
      fetchMore
    });
  };

  // Update visible items when visibleRange changes
  $: visibleItems = items.slice(visibleRange.start, visibleRange.end);
  $: topPadding = visibleRange.start * itemHeight;
  $: bottomPadding = Math.max(0, (items.length - visibleRange.end) * itemHeight);

  // Listen for scroll events to update visible range
  function onScroll() {
    // This will be handled by the lazyScroll action
  }

  // Refresh function
  export function refresh() {
    if (container) {
      const event = new Event('scroll');
      container.dispatchEvent(event);
    }
  }
</script>

<div
  bind:this={container}
  use:scrollAction
  class="lazy-scroll-container"
  style="height: {viewportHeight}px; overflow-y: auto;"
  on:scroll={onScroll}
>
  <!-- Top padding to maintain scroll position -->
  <div style="height: {topPadding}px;"></div>
  
  <!-- Visible items -->
  {#each visibleItems as item, index}
    <div
      style="height: {itemHeight}px;"
      class="lazy-item"
    >
      <slot {item} index={visibleRange.start + index} />
    </div>
  {/each}
  
  <!-- Bottom padding -->
  <div style="height: {bottomPadding}px;"></div>
  
  <!-- Loading indicator -->
  {#if isLoading}
    <div class="lazy-loading">
      Loading more items...
    </div>
  {/if}
</div>

<style>
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