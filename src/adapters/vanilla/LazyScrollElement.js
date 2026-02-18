import { createLazyScroll } from './lazyScroll';

// SSR-safe custom element implementation
export class LazyScrollElement {
  constructor() {
    // Only create element if in browser environment
    if (typeof HTMLElement !== 'undefined' && typeof document !== 'undefined') {
      // Create a proxy that extends HTMLElement in browser
      const element = document.createElement('div');
      Object.setPrototypeOf(element, LazyScrollElement.prototype);
      element.init();
      return element;
    } else {
      // On server, return a plain object with same interface
      this.isServer = true;
      this.init();
      return this;
    }
  }

  // Initialize the element (shared between browser and server)
  init() {
    // Default values
    this.itemHeight = 50;
    this.viewportHeight = 400;
    this.bufferSize = 5;
    this.items = [];
    this.lazyScrollInstance = null;
    this.mutationObserver = null;
    this.container = null;
    this.shadow = null;
  }

  // Browser-specific initialization (only runs in browser)
  static createBrowserElement() {
    if (typeof HTMLElement === 'undefined') {
      throw new Error('HTMLElement is not available - this method should only be called in browser environment');
    }

    class BrowserLazyScrollElement extends HTMLElement {
      constructor() {
        super();
        this.init();
      }

      init() {
        this.itemHeight = 50;
        this.viewportHeight = 400;
        this.bufferSize = 5;
        this.items = [];
        this.lazyScrollInstance = null;
        this.mutationObserver = null;
        this.container = null;
        
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

      attributeChangedCallback(name, oldValue, newValue) {
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

        if (this.lazyScrollInstance) {
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

        this.shadow.appendChild(this.container);

        // Get fetchMore function from attribute or slot
        const fetchMoreAttr = this.getAttribute('fetch-more');
        let fetchMoreFn = () => Promise.resolve([]);

        if (fetchMoreAttr) {
          try {
            // If fetchMore is a function name in global scope
            fetchMoreFn = window[fetchMoreAttr] || (() => Promise.resolve([]));
          } catch (e) {
            console.warn('Could not find fetchMore function:', fetchMoreAttr);
          }
        }

        // Initialize lazy scroll
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
        if (this.lazyScrollInstance) {
          this.lazyScrollInstance.destroy();
        }

        if (this.mutationObserver) {
          this.mutationObserver.disconnect();
        }
      }

      updateItemsFromSlot() {
        // Get items from light DOM or data attribute
        const itemsData = this.getAttribute('items');
        if (itemsData) {
          try {
            const items = JSON.parse(itemsData);
            if (this.lazyScrollInstance) {
              this.lazyScrollInstance.setItems(items);
            }
          } catch (e) {
            console.warn('Could not parse items data:', itemsData);
          }
        }
      }

      // Public methods
      setItems(items) {
        if (this.lazyScrollInstance) {
          this.lazyScrollInstance.setItems(items);
        }
      }

      refresh() {
        if (this.lazyScrollInstance) {
          this.lazyScrollInstance.refresh();
        }
      }

      getVisibleRange() {
        if (this.lazyScrollInstance) {
          return this.lazyScrollInstance.getVisibleRange();
        }
        return { start: 0, end: 0 };
      }
    }

    return BrowserLazyScrollElement;
  }

  // Public methods (SSR-safe versions)
  setItems(items) {
    if (!this.isServer && this.lazyScrollInstance) {
      this.lazyScrollInstance.setItems(items);
    }
  }

  refresh() {
    if (!this.isServer && this.lazyScrollInstance) {
      this.lazyScrollInstance.refresh();
    }
  }

  getVisibleRange() {
    if (!this.isServer && this.lazyScrollInstance) {
      return this.lazyScrollInstance.getVisibleRange();
    }
    return { start: 0, end: 0 };
  }

  // Static method to register the element only in browser
  static registerElement() {
    if (typeof customElements !== 'undefined' && typeof HTMLElement !== 'undefined') {
      const BrowserElement = LazyScrollElement.createBrowserElement();
      customElements.define('lazy-scroll-element', BrowserElement);
    }
  }
}

// Export for module usage
export default LazyScrollElement;