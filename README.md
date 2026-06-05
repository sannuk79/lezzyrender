# lazy-render-virtual-scroll

High-performance virtual scrolling library with intelligent scroll detection, adaptive buffering, and multi-framework support.

## Installation

```bash
npm install lazy-render-virtual-scroll
```

## Quick Start

### React
```tsx
import { LazyList } from 'lazy-render-virtual-scroll';

<LazyList
  items={items}
  itemHeight={50}
  viewportHeight={400}
  fetchMore={fetchMore}
  renderItem={(item, index) => <Item data={item} />}
/>
```

### Enhanced Hooks
```tsx
import { useIntelligentScroll, useAdaptiveLoading, useSmartPagination } from 'lazy-render-virtual-scroll';

const { visibleRange, isLoading } = useIntelligentScroll({ itemHeight: 50, viewportHeight: 400, fetchMore });
```

### Advanced Components
```tsx
import { IntelligentLazyList, AdaptiveScrollView, SmartInfiniteScroll } from 'lazy-render-virtual-scroll';
```

## Features

- ✅ Virtual scrolling (60 FPS)
- ✅ Intelligent scroll detection
- ✅ Adaptive buffering
- ✅ Network-aware prefetching
- ✅ Multi-framework (React, Vue, Angular, Svelte, Vanilla)
- ✅ SSR-safe
- ✅ TypeScript support

## Performance

| Metric | Improvement |
|--------|-------------|
| 10K items render | 1800ms → 45ms |
| Memory usage | 99% reduction |
| Scroll performance | Smooth 60 FPS |

## Documentation

See [GitHub](https://github.com/sannuk79/lezzyrender) for full documentation.

## License
## Official Website: https://www.codeevaai.com/
MIT
