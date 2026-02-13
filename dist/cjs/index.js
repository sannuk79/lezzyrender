'use strict';

var React = require('react');

class WindowManager {
    constructor(itemHeight, viewportHeight, bufferSize = 5) {
        this.itemHeight = itemHeight;
        this.viewportHeight = viewportHeight;
        this.bufferSize = bufferSize;
    }
    /**
     * Calculate the visible range based on scroll position
     */
    calculateVisibleRange(scrollTop) {
        // Calculate how many items fit in the viewport
        const itemsPerViewport = Math.ceil(this.viewportHeight / this.itemHeight);
        // Calculate the starting index based on scroll position
        const startIndex = Math.floor(scrollTop / this.itemHeight);
        // Calculate the ending index with buffer
        const endIndex = Math.min(startIndex + itemsPerViewport + this.bufferSize, Number.MAX_SAFE_INTEGER // Will be limited by total items later
        );
        return {
            start: Math.max(0, startIndex - this.bufferSize),
            end: endIndex
        };
    }
    /**
     * Update viewport height if it changes
     */
    updateViewportHeight(height) {
        this.viewportHeight = height;
    }
    /**
     * Update item height if it changes
     */
    updateItemHeight(height) {
        this.itemHeight = height;
    }
}

class PrefetchManager {
    constructor(bufferSize = 5) {
        this.bufferSize = bufferSize;
    }
    /**
     * Determine if more items should be fetched based on visible range and loaded items
     */
    shouldPrefetch(visibleEnd, totalLoaded) {
        // Simple rule: if visible end is approaching the loaded boundary, fetch more
        return visibleEnd >= totalLoaded - this.bufferSize;
    }
    /**
     * Update buffer size if it changes
     */
    updateBufferSize(size) {
        this.bufferSize = size;
    }
}

class RequestQueue {
    constructor(maxConcurrent = 1) {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = maxConcurrent;
    }
    /**
     * Add a request to the queue
     */
    add(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push(() => requestFn().then(resolve).catch(reject));
            // Start processing if not already processing
            if (!this.processing) {
                this.processQueue();
            }
        });
    }
    /**
     * Process the queue
     */
    async processQueue() {
        if (this.queue.length === 0) {
            this.processing = false;
            return;
        }
        this.processing = true;
        // Process up to maxConcurrent requests
        const concurrentRequests = [];
        const count = Math.min(this.maxConcurrent, this.queue.length);
        for (let i = 0; i < count; i++) {
            const requestFn = this.queue.shift();
            if (requestFn) {
                concurrentRequests.push(requestFn());
            }
        }
        try {
            await Promise.all(concurrentRequests);
        }
        catch (error) {
            console.error('Request queue error:', error);
        }
        // Process remaining items
        await this.processQueue();
    }
    /**
     * Clear the queue
     */
    clear() {
        this.queue = [];
    }
    /**
     * Get the current queue length
     */
    getLength() {
        return this.queue.length;
    }
}

class Engine {
    constructor(config) {
        this.fetchMoreCallback = null;
        this.config = {
            ...config,
            bufferSize: config.bufferSize || 5
        };
        this.windowManager = new WindowManager(this.config.itemHeight, this.config.viewportHeight, this.config.bufferSize);
        this.prefetchManager = new PrefetchManager(this.config.bufferSize);
        this.requestQueue = new RequestQueue(1); // Single request at a time
        this.totalItems = this.config.totalItems || Number.MAX_SAFE_INTEGER;
        this.state = {
            scrollTop: 0,
            visibleRange: { start: 0, end: 0 },
            loadedItems: 0,
            isLoading: false
        };
    }
    /**
     * Update scroll position and recalculate visible range
     */
    updateScrollPosition(scrollTop) {
        this.state.scrollTop = scrollTop;
        this.state.visibleRange = this.windowManager.calculateVisibleRange(scrollTop);
        // Check if we need to fetch more items
        if (this.shouldFetchMore()) {
            this.fetchMore();
        }
    }
    /**
     * Get the current visible range
     */
    getVisibleRange() {
        return this.state.visibleRange;
    }
    /**
     * Check if more items should be fetched
     */
    shouldFetchMore() {
        if (!this.fetchMoreCallback)
            return false;
        if (this.state.isLoading)
            return false;
        if (this.state.loadedItems >= this.totalItems)
            return false;
        return this.prefetchManager.shouldPrefetch(this.state.visibleRange.end, this.state.loadedItems);
    }
    /**
     * Fetch more items
     */
    async fetchMore() {
        if (!this.fetchMoreCallback || this.state.isLoading)
            return;
        this.state.isLoading = true;
        try {
            const result = await this.requestQueue.add(this.fetchMoreCallback);
            // Assuming the result contains new items
            // In a real implementation, this would update the loaded items count
            this.state.loadedItems += Array.isArray(result) ? result.length : 1;
        }
        catch (error) {
            console.error('Error fetching more items:', error);
        }
        finally {
            this.state.isLoading = false;
        }
    }
    /**
     * Set the fetchMore callback function
     */
    setFetchMoreCallback(callback) {
        this.fetchMoreCallback = callback;
    }
    /**
     * Update total items count
     */
    updateTotalItems(count) {
        this.totalItems = count;
    }
    /**
     * Get current engine state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Update viewport dimensions
     */
    updateDimensions(viewportHeight, itemHeight) {
        this.windowManager.updateViewportHeight(viewportHeight);
        this.windowManager.updateItemHeight(itemHeight);
        // Recalculate visible range with new dimensions
        this.state.visibleRange = this.windowManager.calculateVisibleRange(this.state.scrollTop);
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        this.requestQueue.clear();
        this.fetchMoreCallback = null;
    }
}

class ScrollObserver {
    constructor(container, callback, options) {
        this.observer = null;
        this.sentinelElement = null;
        /**
         * Handle scroll events
         */
        this.onScroll = () => {
            // Debounced scroll handler to prevent too frequent updates
            this.debounce(() => {
                this.callback(this.container.scrollTop);
            }, 16); // ~60fps
        };
        this.container = container;
        this.callback = callback;
        this.options = {
            root: container,
            threshold: [0, 1],
            ...options
        };
    }
    /**
     * Start observing scroll events
     */
    observe() {
        // Create a sentinel element at the bottom to detect when user scrolls near the end
        this.sentinelElement = document.createElement('div');
        this.sentinelElement.style.height = '1px'; // Very small element
        this.sentinelElement.setAttribute('data-lazy-sentinel', '');
        // Add sentinel to the container
        this.container.appendChild(this.sentinelElement);
        // Create intersection observer to detect when sentinel comes into view
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Trigger callback with current scroll position
                    this.callback(this.container.scrollTop);
                }
            });
        }, this.options);
        this.observer.observe(this.sentinelElement);
        // Also listen to scroll events for continuous updates
        this.container.addEventListener('scroll', this.onScroll, { passive: true });
    }
    /**
     * Debounce function for scroll events
     */
    debounce(func, wait) {
        let timeout;
        clearTimeout(timeout);
        timeout = setTimeout(func, wait);
    }
    /**
     * Disconnect observer and clean up
     */
    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        if (this.sentinelElement) {
            this.sentinelElement.remove();
            this.sentinelElement = null;
        }
        this.container.removeEventListener('scroll', this.onScroll);
    }
}

const useLazyList = (config) => {
    const { fetchMore, ...engineConfig } = config;
    const engineRef = React.useRef(null);
    const containerRef = React.useRef(null);
    const [visibleRange, setVisibleRange] = React.useState({ start: 0, end: 0 });
    const [loadedItems, setLoadedItems] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(false);
    // Initialize engine
    React.useEffect(() => {
        engineRef.current = new Engine(engineConfig);
        engineRef.current.setFetchMoreCallback(fetchMore);
        return () => {
            if (engineRef.current) {
                engineRef.current.cleanup();
            }
        };
    }, []);
    // Update engine when config changes
    React.useEffect(() => {
        if (engineRef.current) {
            engineRef.current.updateDimensions(engineConfig.viewportHeight, engineConfig.itemHeight);
        }
    }, [engineConfig.viewportHeight, engineConfig.itemHeight]);
    // Handle scroll events
    const handleScroll = React.useCallback((scrollTop) => {
        if (engineRef.current) {
            engineRef.current.updateScrollPosition(scrollTop);
            // Update state based on engine
            const state = engineRef.current.getState();
            setVisibleRange(state.visibleRange);
            setIsLoading(state.isLoading);
        }
    }, []);
    // Set container reference
    const setContainerRef = (element) => {
        if (element) {
            containerRef.current = element;
            // Initialize scroll observer when container is available
            if (typeof window !== 'undefined' && element) {
                // In a real implementation, we would use ScrollObserver here
                // For now, we'll just attach a basic scroll listener
                const handleScrollEvent = () => {
                    handleScroll(element.scrollTop);
                };
                element.addEventListener('scroll', handleScrollEvent, { passive: true });
                // Cleanup
                return () => {
                    element.removeEventListener('scroll', handleScrollEvent);
                };
            }
        }
    };
    return {
        visibleRange,
        loadedItems,
        isLoading,
        setContainerRef,
        // Helper function to trigger manual refresh
        refresh: () => {
            var _a;
            if (engineRef.current) {
                engineRef.current.updateScrollPosition(((_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.scrollTop) || 0);
            }
        }
    };
};

const LazyList = React.forwardRef((props, ref) => {
    const { fetchMore, renderItem, items, itemHeight, viewportHeight, bufferSize, className = '', style = {}, ...rest } = props;
    const { visibleRange, setContainerRef, isLoading } = useLazyList({
        fetchMore,
        itemHeight,
        viewportHeight,
        bufferSize,
        ...rest
    });
    // Calculate container height to simulate infinite scroll
    const containerHeight = items.length * itemHeight;
    const visibleItems = items.slice(visibleRange.start, visibleRange.end);
    // Calculate top padding to maintain scroll position
    const paddingTop = visibleRange.start * itemHeight;
    return (React.createElement("div", { ref: (el) => {
            setContainerRef(el);
            if (ref) {
                if (typeof ref === 'function') {
                    ref(el);
                }
                else {
                    ref.current = el;
                }
            }
        }, className: `lazy-list ${className}`, style: {
            height: `${viewportHeight}px`,
            overflowY: 'auto',
            ...style
        }, ...rest },
        React.createElement("div", { style: { height: `${paddingTop}px` } }),
        visibleItems.map((item, index) => (React.createElement("div", { key: visibleRange.start + index, style: { height: `${itemHeight}px` }, className: "lazy-item" }, renderItem(item, visibleRange.start + index)))),
        React.createElement("div", { style: {
                height: `${Math.max(0, containerHeight - (visibleRange.end * itemHeight))}px`
            } }),
        isLoading && (React.createElement("div", { className: "lazy-loading" }, "Loading more items..."))));
});
LazyList.displayName = 'LazyList';

/**
 * Debounce function to limit the rate at which a function is called
 */
function debounce(func, wait) {
    let timeout = null;
    return function executedFunction(...args) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
            func.apply(this, args);
        }, wait);
    };
}

/**
 * Throttle function to limit the rate at which a function is called
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}

exports.Engine = Engine;
exports.LazyList = LazyList;
exports.PrefetchManager = PrefetchManager;
exports.RequestQueue = RequestQueue;
exports.ScrollObserver = ScrollObserver;
exports.WindowManager = WindowManager;
exports.debounce = debounce;
exports.throttle = throttle;
exports.useLazyList = useLazyList;
//# sourceMappingURL=index.js.map
