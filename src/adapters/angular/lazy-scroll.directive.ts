import { Directive, ElementRef, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { Engine } from '../../core/Engine';
import { EngineConfig, FetchMoreCallback } from '../../core/types';

@Directive({
  selector: '[lazyScroll]'
})
export class LazyScrollDirective implements OnInit, OnDestroy {
  @Input() items: any[] = [];
  @Input() itemHeight: number = 50;
  @Input() viewportHeight: number = 400;
  @Input() bufferSize: number = 5;
  @Input() fetchMore!: FetchMoreCallback;
  
  @Output() visibleRangeChange = new EventEmitter<{ start: number; end: number }>();
  @Output() loadingChange = new EventEmitter<boolean>();

  private engine: Engine | null = null;
  private scrollListener: ((event: Event) => void) | null = null;

  constructor(private el: ElementRef) {}

  ngOnInit() {
    const config: EngineConfig = {
      itemHeight: this.itemHeight,
      viewportHeight: this.viewportHeight,
      bufferSize: this.bufferSize
    };

    this.engine = new Engine(config);
    if (this.fetchMore) {
      this.engine.setFetchMoreCallback(this.fetchMore);
    }

    // Add scroll listener
    this.scrollListener = () => {
      this.onScroll();
    };

    this.el.nativeElement.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  ngOnDestroy() {
    if (this.scrollListener) {
      this.el.nativeElement.removeEventListener('scroll', this.scrollListener);
    }
    
    if (this.engine) {
      this.engine.cleanup();
      this.engine = null;
    }
  }

  private onScroll() {
    if (this.engine) {
      const scrollTop = this.el.nativeElement.scrollTop;
      this.engine.updateScrollPosition(scrollTop);
      
      const state = this.engine.getState();
      this.visibleRangeChange.emit(state.visibleRange);
      this.loadingChange.emit(state.isLoading);
    }
  }

  // Method to refresh the scroll position
  refresh() {
    if (this.engine) {
      const scrollTop = this.el.nativeElement.scrollTop;
      this.engine.updateScrollPosition(scrollTop);
    }
  }

  // Method to get current visible range
  getVisibleRange() {
    if (this.engine) {
      return this.engine.getState().visibleRange;
    }
    return { start: 0, end: 0 };
  }
}