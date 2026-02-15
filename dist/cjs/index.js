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
    /**
     * Update buffer size if it changes
     */
    updateBufferSize(size) {
        this.bufferSize = size;
    }
}

class PrefetchManager {
    /**
     * This class is kept for backward compatibility
     * Intelligent prefetching is now handled in the Engine class
     */
    constructor() { }
    /**
     * Legacy method - not used in intelligent mode
     */
    shouldPrefetch(visibleEnd, totalLoaded) {
        // Simple rule: if visible end is approaching the loaded boundary, fetch more
        return visibleEnd >= totalLoaded - 5; // Default buffer
    }
    /**
     * Update buffer size if it changes (for backward compatibility)
     */
    updateBufferSize(size) {
        // This method exists for backward compatibility
        // Intelligent prefetching is now handled in the Engine class
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

class IntelligentScrollDetector {
    constructor() {
        this.lastScrollTop = 0;
        this.lastTime = 0;
        this.velocityHistory = [];
        this.HISTORY_SIZE = 5;
        this.scrollTimeout = null;
        this.isIdle = true;
        this.lastTime = performance.now();
    }
    // Calculate velocity from scroll event
    calculateVelocity(scrollTop) {
        const now = performance.now();
        const deltaY = scrollTop - this.lastScrollTop;
        const deltaTime = now - this.lastTime;
        // Calculate velocity (pixels per millisecond)
        const velocity = deltaTime > 0 ? deltaY / deltaTime : 0;
        // Store in history for smoothing
        this.velocityHistory.push(velocity);
        if (this.velocityHistory.length > this.HISTORY_SIZE) {
            this.velocityHistory.shift();
        }
        // Update for next calculation
        this.lastScrollTop = scrollTop;
        this.lastTime = now;
        // Update idle state
        this.isIdle = false;
        this.resetIdleTimer();
        // Return smoothed velocity (average of recent values)
        return this.getAverageVelocity();
    }
    // Get smoothed velocity from history
    getAverageVelocity() {
        if (this.velocityHistory.length === 0)
            return 0;
        const sum = this.velocityHistory.reduce((acc, vel) => acc + vel, 0);
        return sum / this.velocityHistory.length;
    }
    // Determine scroll direction from velocity
    getDirection(velocity) {
        if (Math.abs(velocity) < 0.1)
            return 'stationary';
        return velocity > 0 ? 'down' : 'up';
    }
    // Calculate buffer size based on scroll velocity
    calculateBuffer(velocity) {
        const absVelocity = Math.abs(velocity);
        if (absVelocity > 1.5) {
            return 20; // Large buffer for fast scrolling
        }
        else if (absVelocity > 1.0) {
            return 10; // Medium buffer
        }
        else if (absVelocity > 0.3) {
            return 7; // Small buffer for medium scrolling
        }
        else {
            return 5; // Minimal buffer when nearly stationary
        }
    }
    // Calculate prefetch distance based on velocity
    calculatePrefetchDistance(velocity) {
        const absVelocity = Math.abs(velocity);
        if (absVelocity > 2.0)
            return 1200; // Far ahead for fast scrolling
        if (absVelocity > 1.0)
            return 800; // Medium distance
        if (absVelocity > 0.3)
            return 400; // Close distance for slow scroll
        return 200; // Minimal prefetch when nearly stationary
    }
    // Predict where user will be in X milliseconds
    predictPosition(currentPosition, velocity, msAhead = 500) {
        return currentPosition + (velocity * msAhead);
    }
    // Check if user is currently idle
    getIsIdle() {
        return this.isIdle;
    }
    // Reset idle timer
    resetIdleTimer() {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
        this.scrollTimeout = window.setTimeout(() => {
            this.isIdle = true;
        }, 150); // 150ms after last scroll = idle
    }
    // Clean up resources
    cleanup() {
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }
    }
}

class NetworkSpeedDetector {
    constructor() {
        this.bandwidthHistory = [];
        this.latencyHistory = [];
        this.HISTORY_SIZE = 5;
    }
    // Estimate available bandwidth
    async estimateBandwidth() {
        const startTime = performance.now();
        const testData = new Array(10000).fill('test_data').join('');
        try {
            // Send test request to measure bandwidth
            const response = await fetch('/api/network-test', {
                method: 'POST',
                body: testData
            });
            const endTime = performance.now();
            const duration = (endTime - startTime) / 1000; // seconds
            const dataSize = testData.length; // bytes
            const bandwidth = dataSize / duration; // bytes per second
            this.bandwidthHistory.push(bandwidth);
            if (this.bandwidthHistory.length > this.HISTORY_SIZE) {
                this.bandwidthHistory.shift();
            }
            return this.getAverageBandwidth();
        }
        catch (error) {
            // If network test fails, return a conservative estimate
            return 100000; // 100 KB/s as fallback
        }
    }
    // Measure network latency
    async measureLatency() {
        try {
            const startTime = performance.now();
            await fetch('/api/ping');
            const endTime = performance.now();
            const latency = endTime - startTime;
            this.latencyHistory.push(latency);
            if (this.latencyHistory.length > this.HISTORY_SIZE) {
                this.latencyHistory.shift();
            }
            return this.getAverageLatency();
        }
        catch (error) {
            // If ping fails, return a high latency as fallback
            return 1000; // 1 second as fallback
        }
    }
    // Assess overall connection quality
    async assessConnectionQuality() {
        try {
            const [bandwidth, latency] = await Promise.all([
                this.estimateBandwidth(),
                this.measureLatency()
            ]);
            if (latency > 1000)
                return 'poor'; // High latency
            if (bandwidth < 100000)
                return 'poor'; // Low bandwidth (< 100 KB/s)
            if (latency > 500 || bandwidth < 500000)
                return 'good'; // Moderate
            return 'excellent'; // Fast and responsive
        }
        catch (_a) {
            return 'offline';
        }
    }
    getAverageBandwidth() {
        if (this.bandwidthHistory.length === 0)
            return 0;
        const sum = this.bandwidthHistory.reduce((a, b) => a + b, 0);
        return sum / this.bandwidthHistory.length;
    }
    getAverageLatency() {
        if (this.latencyHistory.length === 0)
            return 0;
        const sum = this.latencyHistory.reduce((a, b) => a + b, 0);
        return sum / this.latencyHistory.length;
    }
    // Get current network statistics
    getNetworkStats() {
        return {
            bandwidth: this.getAverageBandwidth(),
            latency: this.getAverageLatency(),
            history: [...this.bandwidthHistory]
        };
    }
}

class NetworkAwarePrefetchManager {
    constructor(networkDetector) {
        this.basePrefetchDistance = 400; // Base prefetch distance in pixels
        this.networkDetector = networkDetector;
    }
    // Calculate prefetch distance based on network conditions
    async calculateNetworkAdjustedPrefetch(velocity) {
        const connectionQuality = await this.networkDetector.assessConnectionQuality();
        // Base prefetch distance from scroll velocity
        let baseDistance = this.basePrefetchDistance;
        if (Math.abs(velocity) > 2.0)
            baseDistance = 1200;
        else if (Math.abs(velocity) > 1.0)
            baseDistance = 800;
        else if (Math.abs(velocity) > 0.3)
            baseDistance = 400;
        else
            baseDistance = 200;
        // Adjust based on network quality
        switch (connectionQuality) {
            case 'excellent':
                return Math.round(baseDistance * 1.5); // Extra prefetch on fast networks
            case 'good':
                return Math.round(baseDistance * 1.2); // Slightly more prefetch
            case 'poor':
                return Math.round(baseDistance * 0.7); // Less prefetch on slow networks
            case 'offline':
                return Math.round(baseDistance * 0.3); // Minimal prefetch when offline
            default:
                return baseDistance;
        }
    }
    // Calculate batch size based on network conditions
    async calculateNetworkAdjustedBatchSize(velocity) {
        const connectionQuality = await this.networkDetector.assessConnectionQuality();
        // Base batch size from scroll velocity
        let baseBatchSize = 10; // Default batch size
        if (Math.abs(velocity) > 2.0)
            baseBatchSize = 20; // Fast scroll needs more
        else if (Math.abs(velocity) > 1.0)
            baseBatchSize = 15;
        else if (Math.abs(velocity) > 0.3)
            baseBatchSize = 10;
        else
            baseBatchSize = 5; // Slow scroll needs less
        // Adjust based on network quality
        switch (connectionQuality) {
            case 'excellent':
                return Math.min(baseBatchSize * 2, 50); // Large batches on fast networks
            case 'good':
                return Math.min(baseBatchSize * 1.5, 30); // Medium batches
            case 'poor':
                return Math.max(Math.round(baseBatchSize * 0.5), 5); // Small batches on slow networks
            case 'offline':
                return Math.max(Math.round(baseBatchSize * 0.3), 3); // Minimal batches when offline
            default:
                return baseBatchSize;
        }
    }
    // Determine if prefetch should be delayed based on network conditions
    async shouldDelayPrefetch() {
        const connectionQuality = await this.networkDetector.assessConnectionQuality();
        return connectionQuality === 'poor';
    }
}

class NetworkAwareRequestQueue {
    constructor(networkDetector) {
        this.queue = [];
        this.processing = false;
        this.maxConcurrent = 1;
        this.offlineQueue = [];
        this.networkDetector = networkDetector;
    }
    // Add request with network-aware concurrency
    async add(requestFn) {
        // Adjust concurrency based on network conditions
        const connectionQuality = await this.networkDetector.assessConnectionQuality();
        switch (connectionQuality) {
            case 'excellent':
                this.maxConcurrent = 3; // Allow more concurrent requests
                break;
            case 'good':
                this.maxConcurrent = 2; // Moderate concurrency
                break;
            case 'poor':
                this.maxConcurrent = 1; // Sequential requests on slow networks
                break;
            case 'offline':
                // Queue for later when online
                return this.handleOfflineRequest(requestFn);
            default:
                this.maxConcurrent = 1;
        }
        return new Promise((resolve, reject) => {
            this.queue.push(() => requestFn().then(resolve).catch(reject));
            if (!this.processing) {
                this.processQueue();
            }
        });
    }
    // Process queue with network-aware concurrency
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
            console.error('Network-aware request queue error:', error);
        }
        // Process remaining items
        await this.processQueue();
    }
    // Handle requests when offline
    async handleOfflineRequest(requestFn) {
        // Store request for later execution
        return new Promise((resolve, reject) => {
            // Add to offline queue
            this.offlineQueue.push(() => requestFn().then(resolve).catch(reject));
            // Check for network restoration periodically
            const checkOnline = () => {
                if (navigator.onLine) {
                    // Process offline queue
                    this.processOfflineQueue();
                    resolve(null); // Resolve with null since we can't return the actual result
                }
                else {
                    setTimeout(checkOnline, 5000); // Check again in 5 seconds
                }
            };
            checkOnline();
        });
    }
    // Process offline queue when back online
    async processOfflineQueue() {
        const offlineRequests = [...this.offlineQueue];
        this.offlineQueue = [];
        for (const requestFn of offlineRequests) {
            try {
                await requestFn();
            }
            catch (error) {
                console.error('Offline request failed:', error);
                // Add back to offline queue for retry
                this.offlineQueue.push(requestFn);
            }
        }
    }
    // Get current queue status
    getQueueStatus() {
        return {
            pending: this.queue.length,
            offline: this.offlineQueue.length,
            maxConcurrent: this.maxConcurrent
        };
    }
    // Clear all queues
    clear() {
        this.queue = [];
        this.offlineQueue = [];
        this.processing = false;
    }
}

class DevicePerformanceMonitor {
    constructor() {
        this.frameRateHistory = [];
        this.memoryUsageHistory = [];
        this.gcMonitoring = false;
        this.HISTORY_SIZE = 10;
        this.setupPerformanceMonitoring();
    }
    // Monitor frame rate
    async getFrameRate() {
        return new Promise(resolve => {
            const start = performance.now();
            let frames = 0;
            const measure = () => {
                frames++;
                if (frames >= 60) { // Measure over 60 frames
                    const elapsed = performance.now() - start;
                    const fps = Math.round((frames / elapsed) * 1000);
                    this.frameRateHistory.push(fps);
                    if (this.frameRateHistory.length > this.HISTORY_SIZE) {
                        this.frameRateHistory.shift();
                    }
                    resolve(fps);
                }
                else {
                    requestAnimationFrame(measure);
                }
            };
            requestAnimationFrame(measure);
        });
    }
    // Get average frame rate
    getAverageFrameRate() {
        if (this.frameRateHistory.length === 0)
            return 60;
        const sum = this.frameRateHistory.reduce((a, b) => a + b, 0);
        return sum / this.frameRateHistory.length;
    }
    // Monitor memory usage (where available)
    getMemoryInfo() {
        if ('memory' in performance) {
            // @ts-ignore - memory property is non-standard
            const mem = performance.memory;
            if (mem) {
                return {
                    used: mem.usedJSHeapSize,
                    total: mem.jsHeapSizeLimit
                };
            }
        }
        return null;
    }
    // Assess overall device performance
    async assessPerformance() {
        const frameRate = await this.getFrameRate();
        const memoryInfo = this.getMemoryInfo();
        // Normalize frame rate (60fps = excellent, 30fps = poor)
        const frameRateScore = Math.min(frameRate / 60, 1);
        // If we have memory info, factor it in
        if (memoryInfo) {
            const memoryScore = 1 - (memoryInfo.used / memoryInfo.total);
            return (frameRateScore * 0.7) + (memoryScore * 0.3);
        }
        return frameRateScore;
    }
    setupPerformanceMonitoring() {
        // Set up performance monitoring intervals
        setInterval(() => {
            this.getFrameRate(); // Update frame rate history
        }, 5000); // Every 5 seconds
    }
    // Get performance insights
    getPerformanceInsights() {
        const frameRate = this.getAverageFrameRate();
        const memoryInfo = this.getMemoryInfo();
        // Calculate performance score based on frame rate
        const performanceScore = Math.min(frameRate / 60, 1);
        return {
            frameRate,
            performanceScore,
            memoryUsed: (memoryInfo === null || memoryInfo === void 0 ? void 0 : memoryInfo.used) || null,
            memoryTotal: (memoryInfo === null || memoryInfo === void 0 ? void 0 : memoryInfo.total) || null
        };
    }
}

class ContentComplexityAnalyzer {
    // Analyze content complexity based on various factors
    analyzeContentComplexity(items) {
        if (items.length === 0)
            return 0.1; // Minimal complexity for empty
        let totalComplexity = 0;
        for (const item of items) {
            // Analyze different aspects of complexity
            const textComplexity = this.analyzeTextComplexity(item);
            const mediaComplexity = this.analyzeMediaComplexity(item);
            const componentComplexity = this.analyzeComponentComplexity(item);
            totalComplexity += (textComplexity + mediaComplexity + componentComplexity) / 3;
        }
        // Return average complexity normalized to 0-1 scale
        return Math.min(totalComplexity / items.length, 1);
    }
    analyzeTextComplexity(item) {
        let complexity = 0;
        // Length of text content
        if (typeof item.text === 'string') {
            complexity += Math.min(item.text.length / 1000, 0.5); // Max 0.5 for text
        }
        // Number of text elements
        if (Array.isArray(item.textElements)) {
            complexity += Math.min(item.textElements.length / 10, 0.3); // Max 0.3 for elements
        }
        // Formatting complexity
        if (item.hasRichText)
            complexity += 0.2;
        return Math.min(complexity, 1);
    }
    analyzeMediaComplexity(item) {
        let complexity = 0;
        // Number of media elements
        if (Array.isArray(item.media)) {
            complexity += Math.min(item.media.length * 0.2, 0.5);
        }
        // Media types (images, videos are more complex than icons)
        if (item.hasVideo)
            complexity += 0.3;
        if (item.hasImage)
            complexity += 0.15;
        if (item.hasSVG)
            complexity += 0.1;
        return Math.min(complexity, 1);
    }
    analyzeComponentComplexity(item) {
        let complexity = 0;
        // Number of nested components
        if (typeof item.componentDepth === 'number') {
            complexity += Math.min(item.componentDepth * 0.1, 0.4);
        }
        // Interactivity
        if (item.interactive)
            complexity += 0.2;
        if (item.hasAnimations)
            complexity += 0.2;
        if (item.hasState)
            complexity += 0.1;
        return Math.min(complexity, 1);
    }
    // Get complexity insights
    getComplexityInsights(items) {
        if (items.length === 0) {
            return {
                averageComplexity: 0.1,
                textComplexity: 0,
                mediaComplexity: 0,
                componentComplexity: 0
            };
        }
        let totalText = 0, totalMedia = 0, totalComponent = 0;
        for (const item of items) {
            totalText += this.analyzeTextComplexity(item);
            totalMedia += this.analyzeMediaComplexity(item);
            totalComponent += this.analyzeComponentComplexity(item);
        }
        return {
            averageComplexity: this.analyzeContentComplexity(items),
            textComplexity: totalText / items.length,
            mediaComplexity: totalMedia / items.length,
            componentComplexity: totalComponent / items.length
        };
    }
}

class AdaptiveBufferCalculator {
    constructor() {
        this.scrollFactor = 0.3; // Weight for scroll velocity
        this.networkFactor = 0.3; // Weight for network quality
        this.performanceFactor = 0.2; // Weight for device performance
        this.contentFactor = 0.2; // Weight for content complexity
        this.performanceMonitor = new DevicePerformanceMonitor();
        this.contentAnalyzer = new ContentComplexityAnalyzer();
    }
    // Calculate optimal buffer size based on multiple factors
    async calculateOptimalBuffer(params) {
        // Calculate scroll-based buffer
        const scrollBuffer = this.calculateScrollBuffer(params.scrollVelocity, params.baseBuffer);
        // Calculate network-based adjustment
        const networkAdjustment = this.calculateNetworkAdjustment(params.networkQuality);
        // Calculate performance-based adjustment
        const performanceScore = await this.performanceMonitor.assessPerformance();
        const performanceAdjustment = this.calculatePerformanceAdjustment(performanceScore);
        // Calculate content-based adjustment
        const contentComplexity = this.contentAnalyzer.analyzeContentComplexity(params.visibleItems);
        const contentAdjustment = this.calculateContentAdjustment(contentComplexity);
        // Combine all factors
        const weightedBuffer = (scrollBuffer * this.scrollFactor +
            (params.baseBuffer * networkAdjustment) * this.networkFactor +
            (params.baseBuffer * performanceAdjustment) * this.performanceFactor +
            (params.baseBuffer * contentAdjustment) * this.contentFactor);
        // Apply reasonable bounds
        return Math.max(3, Math.min(50, Math.round(weightedBuffer)));
    }
    calculateScrollBuffer(velocity, baseBuffer) {
        const absVelocity = Math.abs(velocity);
        if (absVelocity > 2.0)
            return baseBuffer * 4; // Very fast scroll
        if (absVelocity > 1.0)
            return baseBuffer * 2.5; // Fast scroll
        if (absVelocity > 0.3)
            return baseBuffer * 1.5; // Medium scroll
        return baseBuffer * 0.8; // Slow scroll
    }
    calculateNetworkAdjustment(quality) {
        switch (quality) {
            case 'excellent': return 1.5; // More buffer on fast networks
            case 'good': return 1.2; // Slightly more
            case 'poor': return 0.7; // Less buffer on slow networks
            case 'offline': return 0.5; // Minimal buffer when offline
            default: return 1.0;
        }
    }
    calculatePerformanceAdjustment(performance) {
        // performance is 0-1 scale (0 = poor, 1 = excellent)
        return 0.5 + (performance * 0.8); // Range from 0.5 to 1.3
    }
    calculateContentAdjustment(complexity) {
        // complexity is 0-1 scale (0 = simple, 1 = complex)
        return 1.5 - (complexity * 0.8); // Range from 0.7 to 1.5
    }
    // Get adaptive insights
    async getAdaptiveInsights(params) {
        const buffer = await this.calculateOptimalBuffer(params);
        const perfInsights = this.performanceMonitor.getPerformanceInsights();
        const complexityInsights = this.contentAnalyzer.getComplexityInsights(params.visibleItems);
        return {
            currentBuffer: buffer,
            performance: {
                frameRate: perfInsights.frameRate,
                score: perfInsights.performanceScore
            },
            network: {
                quality: params.networkQuality,
                adjustment: this.calculateNetworkAdjustment(params.networkQuality)
            },
            complexity: {
                score: this.contentAnalyzer.analyzeContentComplexity(params.visibleItems),
                breakdown: complexityInsights
            },
            factors: {
                scroll: this.calculateScrollBuffer(params.scrollVelocity, params.baseBuffer),
                network: this.calculateNetworkAdjustment(params.networkQuality),
                performance: this.calculatePerformanceAdjustment(perfInsights.performanceScore),
                content: this.calculateContentAdjustment(complexityInsights.averageComplexity)
            }
        };
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
        this.intelligentScrollDetector = new IntelligentScrollDetector();
        this.networkDetector = new NetworkSpeedDetector();
        this.networkAwarePrefetchManager = new NetworkAwarePrefetchManager(this.networkDetector);
        this.networkAwareRequestQueue = new NetworkAwareRequestQueue(this.networkDetector);
        this.adaptiveBufferCalculator = new AdaptiveBufferCalculator();
        this.totalItems = this.config.totalItems || Number.MAX_SAFE_INTEGER;
        this.state = {
            scrollTop: 0,
            visibleRange: { start: 0, end: 0 },
            loadedItems: 0,
            isLoading: false
        };
    }
    /**
     * Update scroll position and recalculate visible range with intelligent detection
     */
    async updateScrollPosition(scrollTop) {
        // Calculate velocity and other intelligent metrics
        const velocity = this.intelligentScrollDetector.calculateVelocity(scrollTop);
        this.intelligentScrollDetector.getDirection(velocity);
        // Get network quality for adaptive buffering
        const networkQuality = await this.networkDetector.assessConnectionQuality();
        // Calculate adaptive buffer considering all factors
        const adaptiveBuffer = await this.adaptiveBufferCalculator.calculateOptimalBuffer({
            scrollVelocity: velocity,
            networkQuality,
            baseBuffer: this.intelligentScrollDetector.calculateBuffer(velocity),
            visibleItems: [] // In a real implementation, this would be the actual visible items
        });
        // Update window manager with adaptive buffer
        this.windowManager.updateBufferSize(adaptiveBuffer);
        this.state.scrollTop = scrollTop;
        this.state.visibleRange = this.windowManager.calculateVisibleRange(scrollTop);
        // Check if we need to fetch more items
        if (await this.shouldFetchMore()) {
            await this.fetchMore();
        }
    }
    /**
     * Get the current visible range
     */
    getVisibleRange() {
        return this.state.visibleRange;
    }
    /**
     * Check if more items should be fetched with intelligent and network-aware detection
     */
    async shouldFetchMore() {
        if (!this.fetchMoreCallback)
            return false;
        if (this.state.isLoading)
            return false;
        if (this.state.loadedItems >= this.totalItems)
            return false;
        // Get current velocity for intelligent prefetching
        const velocity = this.intelligentScrollDetector.calculateVelocity(this.state.scrollTop);
        // Get network quality for adaptive prefetching
        await this.networkDetector.assessConnectionQuality();
        // Calculate network-adjusted prefetch distance
        const prefetchDistance = await this.networkAwarePrefetchManager.calculateNetworkAdjustedPrefetch(velocity);
        // Use intelligent prefetch logic
        const visibleEnd = this.state.visibleRange.end;
        const totalLoaded = this.state.loadedItems;
        // Intelligent prefetch: if visible end is approaching the loaded boundary
        return visibleEnd >= totalLoaded - prefetchDistance;
    }
    /**
     * Fetch more items with network awareness
     */
    async fetchMore() {
        if (!this.fetchMoreCallback || this.state.isLoading)
            return;
        this.state.isLoading = true;
        try {
            // Use network-aware request queue
            const result = await this.networkAwareRequestQueue.add(this.fetchMoreCallback);
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
        this.networkAwareRequestQueue.clear();
        this.fetchMoreCallback = null;
        this.intelligentScrollDetector.cleanup();
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
    const [scrollAnalysis, setScrollAnalysis] = React.useState({
        velocity: 0,
        direction: 'stationary',
        buffer: 5,
        prefetchDistance: 400,
        predictedPosition: 0,
        isIdle: true
    });
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
        scrollAnalysis,
        setContainerRef,
        // Helper function to trigger manual refresh
        refresh: () => {
            var _a;
            if (engineRef.current) {
                engineRef.current.updateScrollPosition(((_a = containerRef.current) === null || _a === void 0 ? void 0 : _a.scrollTop) || 0);
            }
        },
        // Function to get current scroll analysis
        getScrollAnalysis: () => {
            if (engineRef.current) {
                // In a real implementation, we would get the analysis from the engine
                // For now, we'll return the current state
                return scrollAnalysis;
            }
            return {
                velocity: 0,
                direction: 'stationary',
                buffer: 5,
                prefetchDistance: 400,
                predictedPosition: 0,
                isIdle: true
            };
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

exports.AdaptiveBufferCalculator = AdaptiveBufferCalculator;
exports.ContentComplexityAnalyzer = ContentComplexityAnalyzer;
exports.DevicePerformanceMonitor = DevicePerformanceMonitor;
exports.Engine = Engine;
exports.IntelligentScrollDetector = IntelligentScrollDetector;
exports.LazyList = LazyList;
exports.NetworkAwarePrefetchManager = NetworkAwarePrefetchManager;
exports.NetworkAwareRequestQueue = NetworkAwareRequestQueue;
exports.NetworkSpeedDetector = NetworkSpeedDetector;
exports.PrefetchManager = PrefetchManager;
exports.RequestQueue = RequestQueue;
exports.ScrollObserver = ScrollObserver;
exports.WindowManager = WindowManager;
exports.debounce = debounce;
exports.throttle = throttle;
exports.useLazyList = useLazyList;
//# sourceMappingURL=index.js.map
