import { Component, Input, Output, EventEmitter, ContentChild, TemplateRef, AfterViewInit, OnDestroy } from '@angular/core';
import { LazyScrollDirective } from './lazy-scroll.directive';

@Component({
  selector: 'lazy-scroll',
  template: `
    <div 
      class="lazy-scroll-container"
      [style.height.px]="viewportHeight"
      [style.overflow-y]="'auto'"
      [lazyScroll]="true"
      [items]="items"
      [itemHeight]="itemHeight"
      [viewportHeight]="viewportHeight"
      [bufferSize]="bufferSize"
      [fetchMore]="fetchMore"
      (visibleRangeChange)="onVisibleRangeChange($event)"
      (loadingChange)="onLoadingChange($event)"
      #scrollContainer
    >
      <!-- Top padding -->
      <div [style.height.px]="topPadding"></div>
      
      <!-- Visible items -->
      <div 
        *ngFor="let item of visibleItems; let i = index; trackBy: trackByFn" 
        [style.height.px]="itemHeight"
        class="lazy-item"
      >
        <ng-container 
          *ngTemplateOutlet="itemTemplate; context: { $implicit: item, index: visibleRange.start + i }">
        </ng-container>
      </div>
      
      <!-- Bottom padding -->
      <div [style.height.px]="bottomPadding"></div>
      
      <!-- Loading indicator -->
      <div *ngIf="isLoading" class="lazy-loading">
        Loading more items...
      </div>
    </div>
  `,
  styles: [`
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
  `]
})
export class LazyScrollComponent implements AfterViewInit, OnDestroy {
  @Input() items: any[] = [];
  @Input() itemHeight: number = 50;
  @Input() viewportHeight: number = 400;
  @Input() bufferSize: number = 5;
  @Input() fetchMore!: () => Promise<any>;
  
  @Output() visibleRangeChange = new EventEmitter<{ start: number; end: number }>();
  @Output() loadingChange = new EventEmitter<boolean>();
  
  @ContentChild('itemTemplate', { read: TemplateRef }) 
  itemTemplate!: TemplateRef<any>;

  visibleRange = { start: 0, end: 0 };
  isLoading = false;
  
  get topPadding(): number {
    return this.visibleRange.start * this.itemHeight;
  }
  
  get bottomPadding(): number {
    return Math.max(0, (this.items.length - this.visibleRange.end) * this.itemHeight);
  }
  
  get visibleItems(): any[] {
    return this.items.slice(this.visibleRange.start, this.visibleRange.end);
  }

  ngAfterViewInit() {
    // Component initialized
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  onVisibleRangeChange(range: { start: number; end: number }) {
    this.visibleRange = range;
    this.visibleRangeChange.emit(range);
  }

  onLoadingChange(loading: boolean) {
    this.isLoading = loading;
    this.loadingChange.emit(loading);
  }

  trackByFn(index: number, item: any): any {
    return item.id || index;
  }
}