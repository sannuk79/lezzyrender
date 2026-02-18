// Multi-framework adapter exports

// Vue adapters
export { useLazyScroll } from './vue/useLazyScroll';
// Note: Vue component is in .vue file and would be imported separately

// Angular adapters
export { LazyScrollDirective } from './angular/lazy-scroll.directive';
export { LazyScrollComponent } from './angular/lazy-scroll.component';

// Svelte adapters
export { lazyScroll } from './svelte/lazyScrollAction';
// Note: Svelte component is in .svelte file and would be imported separately

// Vanilla JS adapters
export { LazyScroll, createLazyScroll } from './vanilla/lazyScroll';
export { default as LazyScrollElement } from './vanilla/LazyScrollElement';