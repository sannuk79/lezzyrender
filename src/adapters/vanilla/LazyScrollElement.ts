// SSR-safe custom element implementation
class SSRSafeLazyScrollElement {
  private isServer: boolean;
  private itemHeight: number;
  private viewportHeight: number;
  private bufferSize: number;
  private items: any[];
  
  constructor() {
    // Check if we're in a browser environment
    this.isServer = typeof window === 'undefined' || typeof HTMLElement === 'undefined';
    
    if (!this.isServer) {
      // In browser, we'll return an actual HTMLElement
      return this.createBrowserElement();
    }
    
    // On server, initialize properties
    this.itemHeight = 50;
    this.viewportHeight = 400;
    this.bufferSize = 5;
    this.items = [];
  }
  
  private createBrowserElement(): HTMLElement {
    if (typeof HTMLElement === 'undefined') {
      throw new Error('HTMLElement is not available - this should only be called in browser environment');
    }
    
    // Create a custom element class that extends HTMLElement
    class BrowserLazyScrollElement extends HTMLElement {
      private itemHeight: number = 50;
      private viewportHeight: number = 400;
      private bufferSize: number = 5;
      private items: any[] = [];
      private lazyScrollInstance: any = null;
      private mutationObserver: MutationObserver | null = null;
      private container: HTMLElement | null = null;
      private shadow: ShadowRoot | null = null;

      constructor() {
        super();
        this.init();
      }

      private init() {
        // Create shadow root only in browser
        if (typeof document !== 'undefined') {
          this.shadow = this.attachShadow({ mode: 'open' });

          // Styles
          const style = document.createElement('style');
          style.textContent = `
            :host {
              display: block;
            }

            .lazy-scroll-container {
              position: relative;
              overflow-y: auto;
            }

            .lazy-item {
              width: 100%;
            }

            .lazy-loading {
              text-align: center;
              padding: 20px;
              color: #666;
            }
          `;

          this.shadow.appendChild(style);
        }
      }

      static get observedAttributes() {
        return ['item-height', 'viewport-height', 'buffer-size'];
      }

      attributeChangedCallback(name: string, oldValue: string, newValue: string) {
        switch (name) {
          case 'item-height':
            this.itemHeight = parseInt(newValue) || 50;
            break;
          case 'viewport-height':
            this.viewportHeight = parseInt(newValue) || 400;
            break;
          case 'buffer-size':
            this.bufferSize = parseInt(newValue) || 5;
            break;
        }

        // Update configuration if instance exists
        if (this.lazyScrollInstance && typeof this.lazyScrollInstance.updateConfig === 'function') {
          this.lazyScrollInstance.updateConfig({
            itemHeight: this.itemHeight,
            viewportHeight: this.viewportHeight,
            bufferSize: this.bufferSize
          });
        }
      }

      connectedCallback() {
        if (typeof document === 'undefined') return; // Skip if not in browser
        
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'lazy-scroll-container';
        this.container.style.height = `${this.viewportHeight}px`;
        this.container.style.overflowY = 'auto';

        if (this.shadow) {
          this.shadow.appendChild(this.container);
        }

        // Get fetchMore function from attribute
        const fetchMoreAttr = this.getAttribute('fetch-more');
        let fetchMoreFn = () => Promise.resolve([]);

        if (fetchMoreAttr && typeof window !== 'undefined') {
          try {
            // If fetchMore is a function name in global scope
            fetchMoreFn = (window as any)[fetchMoreAttr] || (() => Promise.resolve([]));
          } catch (e) {
            console.warn('Could not find fetchMore function:', fetchMoreAttr);
          }
        }

        // Initialize lazy scroll - import dynamically
        this.initializeLazyScroll(fetchMoreFn);
      }

      private async initializeLazyScroll(fetchMoreFn: () => Promise<any>) {
        if (typeof window === 'undefined' || !this.container) return;
        
        // Dynamically import the lazy scroll functionality
        const { createLazyScroll } = await import('../lazyScroll');
        this.lazyScrollInstance = createLazyScroll(this.container, {
          itemHeight: this.itemHeight,
          viewportHeight: this.viewportHeight,
          bufferSize: this.bufferSize,
          fetchMore: fetchMoreFn
        });

        // Handle items from light DOM
        this.updateItemsFromSlot();

        // Observe child changes
        if (typeof MutationObserver !== 'undefined') {
          this.mutationObserver = new MutationObserver(() => {
            this.updateItemsFromSlot();
          });

          this.mutationObserver.observe(this, { childList: true, subtree: true });
        }
      }

      disconnectedCallback() {
        if (this.lazyScrollInstance && typeof this.lazyScrollInstance.destroy === 'function') {
          this.lazyScrollInstance.destroy();
        }

        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
        }
      }

      updateItemsFromSlot() {
        // Get items from light DOM or data attribute
        const itemsData = this.getAttribute('items');
        if (itemsData && this.lazyScrollInstance) {
          try {
            const items = JSON.parse(itemsData);
            if (this.lazyScrollInstance && typeof this.lazyScrollInstance.setItems === 'function') {
              this.lazyScrollInstance.setItems(items);
            }
          } catch (e) {
            console.warn('Could not parse items data:', itemsData);
          }
        }
      }

      // Public methods
      setItems(items: any[]) {
        if (this.lazyScrollInstance && typeof this.lazyScrollInstance.setItems === 'function') {
          this.lazyScrollInstance.setItems(items);
        }
      }

      refresh() {
        if (this.lazyScrollInstance && typeof this.lazyScrollInstance.refresh === 'function') {
          this.lazyScrollInstance.refresh();
        }
      }

      getVisibleRange() {
        if (this.lazyScrollInstance && typeof this.lazyScrollInstance.getVisibleRange === 'function') {
          return this.lazyScrollInstance.getVisibleRange();
        }
        return { start: 0, end: 0 };
      }
    }

    // Register the custom element
    if (typeof customElements !== 'undefined') {
      customElements.define('lazy-scroll-element', BrowserLazyScrollElement);
    }
    
    return new BrowserLazyScrollElement();
  }

  // Public methods (SSR-safe versions)
  setItems(items: any[]) {
    if (!this.isServer && (this as any).setItems) {
      (this as any).setItems(items);
    }
  }

  refresh() {
    if (!this.isServer && (this as any).refresh) {
      (this as any).refresh();
    }
  }

  getVisibleRange() {
    if (!this.isServer && (this as any).getVisibleRange) {
      return (this as any).getVisibleRange();
    }
    return { start: 0, end: 0 };
  }

  static registerElement() {
    if (typeof customElements !== 'undefined' && typeof HTMLElement !== 'undefined') {
      // The element is registered in the constructor when in browser
    }
  }
}

// Export the SSR-safe element
export default typeof HTMLElement !== 'undefined' 
  ? class extends HTMLElement {} // Placeholder for type system
  : SSRSafeLazyScrollElement;

// For actual usage, we'll export a factory function that handles SSR
export function createLazyScrollElement(): HTMLElement | SSRSafeLazyScrollElement {
  if (typeof HTMLElement !== 'undefined' && typeof window !== 'undefined') {
    // In browser, return actual custom element
    return document.createElement('lazy-scroll-element') as any;
  } else {
    // On server, return SSR-safe implementation
    return new SSRSafeLazyScrollElement() as any;
  }
}