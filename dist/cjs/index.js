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

class PerformanceOptimizer {
    constructor() {
        this.frameBudget = 16; // Target for 60fps (16.67ms per frame)
        this.lastFrameTime = 0;
        this.animationFrameId = null;
        this.isOptimizing = false;
        // Frame rate limiter to prevent excessive updates
        this.lastUpdate = 0;
        this.minUpdateInterval = 16; // Minimum 16ms between updates (60fps)
        // Batch updates to reduce DOM manipulations
        this.updateQueue = [];
        this.isProcessingQueue = false;
        // Memory optimization
        this.cleanupThreshold = 1000; // Clean up items beyond this threshold
        this.gcInterval = null;
        this.setupPerformanceMonitoring();
    }
    // Optimize rendering by limiting updates to frame budget
    scheduleOptimizedUpdate(updateFn) {
        const now = performance.now();
        // Throttle updates based on frame rate
        if (now - this.lastUpdate < this.minUpdateInterval) {
            // Queue the update for later
            this.updateQueue.push(updateFn);
            if (!this.isProcessingQueue) {
                this.processUpdateQueue();
            }
            return;
        }
        // Check if we have enough time in the current frame
        if (this.getTimeRemaining() > 4) { // Leave 4ms buffer
            updateFn();
            this.lastUpdate = now;
        }
        else {
            // Schedule for next frame
            this.updateQueue.push(updateFn);
            if (!this.isProcessingQueue) {
                this.processUpdateQueue();
            }
        }
    }
    // Process queued updates efficiently
    async processUpdateQueue() {
        if (this.updateQueue.length === 0) {
            this.isProcessingQueue = false;
            return;
        }
        this.isProcessingQueue = true;
        const currentTime = performance.now();
        // Process as many updates as possible within frame budget
        while (this.updateQueue.length > 0 && this.getTimeRemaining() > 2) {
            const updateFn = this.updateQueue.shift();
            if (updateFn) {
                updateFn();
            }
        }
        this.lastUpdate = currentTime;
        if (this.updateQueue.length > 0) {
            // Schedule remaining updates for next frame (only in browser environment)
            if (typeof requestAnimationFrame !== 'undefined') {
                requestAnimationFrame(() => this.processUpdateQueue());
            }
            else {
                // In Node.js environment, use setTimeout as fallback
                setTimeout(() => this.processUpdateQueue(), 0);
            }
        }
        else {
            this.isProcessingQueue = false;
        }
    }
    // Get remaining time in current frame
    getTimeRemaining() {
        if (typeof performance === 'undefined' || !performance.now) {
            return 16; // Fallback to 60fps
        }
        const currentTime = performance.now();
        // Typically browsers target 10ms remaining time for smoothness
        return Math.max(0, this.frameBudget - (currentTime - this.lastFrameTime));
    }
    // Memory optimization: cleanup off-screen items
    optimizeMemory(cleanupFn, visibleRange) {
        // Determine cleanup range (items far from visible range)
        const cleanupStart = Math.max(0, visibleRange.end + this.cleanupThreshold);
        const cleanupEnd = Math.max(0, visibleRange.start - this.cleanupThreshold);
        if (cleanupStart > visibleRange.end) {
            cleanupFn(visibleRange.end, cleanupStart);
        }
        if (cleanupEnd < visibleRange.start) {
            cleanupFn(cleanupEnd, visibleRange.start);
        }
    }
    // Enable GPU acceleration for smoother scrolling
    enableGPUCssAcceleration(element) {
        // Force hardware acceleration
        element.style.willChange = 'transform';
        element.style.transform = 'translateZ(0)';
        element.style.backfaceVisibility = 'hidden';
    }
    // Disable GPU acceleration when not needed
    disableGPUCssAcceleration(element) {
        element.style.willChange = 'auto';
        element.style.transform = '';
        element.style.backfaceVisibility = '';
    }
    // Optimize for different device capabilities
    getOptimizationProfile() {
        // Simple profile detection based on common device characteristics
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        // Detect low-end devices
        if (this.isLowEndDevice(userAgent)) {
            return {
                frameRate: 30, // Lower target for low-end devices
                batchSize: 5, // Smaller batches
                bufferMultiplier: 0.5, // Smaller buffer
                updateInterval: 32 // 30fps interval
            };
        }
        // Default profile for capable devices
        return {
            frameRate: 60,
            batchSize: 10,
            bufferMultiplier: 1.0,
            updateInterval: 16 // 60fps interval
        };
    }
    isLowEndDevice(userAgent) {
        // Simple heuristic for low-end devices
        const lowEndPatterns = [
            /Android.*Mobile/,
            /iPhone.*OS [0-9]+_[0-9]+/,
            /Opera Mini/,
            /IEMobile/
        ];
        return lowEndPatterns.some(pattern => pattern.test(userAgent));
    }
    // Setup performance monitoring
    setupPerformanceMonitoring() {
        // Check if we're in a browser environment
        if (typeof window === 'undefined' || typeof requestAnimationFrame === 'undefined') {
            // In Node.js environment, skip browser-specific monitoring
            return;
        }
        // Monitor frame rate
        let frameCount = 0;
        let lastTime = performance.now();
        const monitorFrameRate = () => {
            frameCount++;
            const currentTime = performance.now();
            if (currentTime - lastTime >= 1000) { // Every second
                const fps = frameCount;
                frameCount = 0;
                lastTime = currentTime;
                // Adjust optimization based on actual FPS
                if (fps < 30) {
                    this.frameBudget = 32; // Target 30fps
                }
                else if (fps < 50) {
                    this.frameBudget = 20; // Target 50fps
                }
                else {
                    this.frameBudget = 16; // Target 60fps
                }
            }
            this.animationFrameId = requestAnimationFrame(monitorFrameRate);
        };
        this.animationFrameId = requestAnimationFrame(monitorFrameRate);
        // Setup garbage collection monitoring
        this.gcInterval = window.setInterval(() => {
            if ('gc' in window) {
                // @ts-ignore - gc is non-standard
                window.gc();
            }
        }, 30000); // GC every 30 seconds
    }
    // Get performance insights
    getPerformanceInsights() {
        return {
            frameRate: 60, // Would be calculated from monitoring
            memoryUsage: this.getMemoryUsage(),
            updateFrequency: 1000 / this.minUpdateInterval,
            optimizationActive: this.isOptimizing
        };
    }
    getMemoryUsage() {
        var _a;
        if ('memory' in performance) {
            // @ts-ignore - memory property is non-standard
            return ((_a = performance.memory) === null || _a === void 0 ? void 0 : _a.usedJSHeapSize) || null;
        }
        return null;
    }
    // Cleanup resources
    cleanup() {
        if (this.animationFrameId && typeof cancelAnimationFrame !== 'undefined') {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.gcInterval && typeof clearInterval !== 'undefined') {
            clearInterval(this.gcInterval);
        }
        this.updateQueue = [];
        this.isProcessingQueue = false;
    }
}

class MemoryManager {
    constructor(maxCacheSize = 1000) {
        this.itemCache = new Map();
        this.maxCacheSize = 1000; // Maximum items to keep in cache
        this.cleanupThreshold = 500; // Start cleanup when cache exceeds this
        this.visibleRange = { start: 0, end: 0 };
        this.totalItems = 0;
        this.maxCacheSize = maxCacheSize;
    }
    // Set visible range to optimize cache
    setVisibleRange(range) {
        this.visibleRange = range;
    }
    // Set total number of items
    setTotalItems(total) {
        this.totalItems = total;
    }
    // Get item from cache
    get(key) {
        return this.itemCache.get(key) || null;
    }
    // Set item in cache
    set(key, value) {
        this.itemCache.set(key, value);
        // Clean up if cache is too large
        if (this.itemCache.size > this.maxCacheSize) {
            this.cleanupCache();
        }
    }
    // Check if item exists in cache
    has(key) {
        return this.itemCache.has(key);
    }
    // Remove item from cache
    delete(key) {
        return this.itemCache.delete(key);
    }
    // Clear entire cache
    clear() {
        this.itemCache.clear();
    }
    // Clean up cache based on visibility and distance from visible range
    cleanupCache() {
        if (this.itemCache.size <= this.cleanupThreshold) {
            return; // No need to clean up
        }
        const itemsToRemove = [];
        // Find items that are far from visible range
        for (const [key] of this.itemCache.entries()) {
            const distanceFromVisible = this.getDistanceFromVisible(key);
            // Remove items that are far from visible range
            if (distanceFromVisible > 100) { // Arbitrary threshold
                itemsToRemove.push(key);
            }
        }
        // If we still have too many items, remove oldest accessed items
        if (this.itemCache.size - itemsToRemove.length > this.cleanupThreshold) {
            const sortedKeys = Array.from(this.itemCache.keys())
                .sort((a, b) => a - b); // Sort by key (assuming they're indexes)
            // Remove items that are furthest from visible range
            for (const key of sortedKeys) {
                if (this.itemCache.size <= this.cleanupThreshold)
                    break;
                const distance = this.getDistanceFromVisible(key);
                if (distance > 50) { // Remove items beyond 50 units from visible
                    itemsToRemove.push(key);
                }
            }
        }
        // Actually remove items
        for (const key of itemsToRemove) {
            this.itemCache.delete(key);
        }
    }
    // Calculate distance from visible range
    getDistanceFromVisible(index) {
        if (index >= this.visibleRange.start && index <= this.visibleRange.end) {
            return 0; // Inside visible range
        }
        if (index < this.visibleRange.start) {
            return this.visibleRange.start - index;
        }
        return index - this.visibleRange.end;
    }
    // Get cache statistics
    getStats() {
        const visibleItems = Array.from(this.itemCache.keys())
            .filter(key => key >= this.visibleRange.start && key <= this.visibleRange.end)
            .length;
        const offScreenItems = this.itemCache.size - visibleItems;
        // Rough estimate of memory usage (in bytes)
        let memoryEstimate = 0;
        for (const [_, value] of this.itemCache.entries()) {
            memoryEstimate += this.estimateObjectSize(value);
        }
        return {
            size: this.itemCache.size,
            maxCacheSize: this.maxCacheSize,
            visibleItems,
            offScreenItems,
            memoryEstimate
        };
    }
    // Estimate object size in bytes
    estimateObjectSize(obj) {
        if (obj === null || obj === undefined)
            return 0;
        if (typeof obj === 'string')
            return obj.length * 2; // UTF-16 chars
        if (typeof obj === 'number')
            return 8; // 8 bytes for number
        if (typeof obj === 'boolean')
            return 4; // 4 bytes for boolean
        if (typeof obj === 'object') {
            let size = 0;
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    size += key.length * 2; // Key size
                    size += this.estimateObjectSize(obj[key]); // Value size
                }
            }
            return size;
        }
        return 0; // Other types
    }
    // Prune cache to only keep essential items
    pruneEssential() {
        const essentialItems = [];
        // Keep items in visible range and nearby
        for (const [key, value] of this.itemCache.entries()) {
            if (this.isEssential(key)) {
                essentialItems.push([key, value]);
            }
        }
        // Clear cache and repopulate with essential items
        this.itemCache.clear();
        for (const [key, value] of essentialItems) {
            this.itemCache.set(key, value);
        }
    }
    // Check if item is essential (within buffer zone)
    isEssential(index) {
        const bufferZone = 20; // Keep items within 20 positions of visible range
        return index >= (this.visibleRange.start - bufferZone) &&
            index <= (this.visibleRange.end + bufferZone);
    }
    // Get cache size
    getSize() {
        return this.itemCache.size;
    }
    // Get cache keys
    getKeys() {
        return Array.from(this.itemCache.keys());
    }
}

class GPUAccelerator {
    constructor() {
        this.gpuAccelerationEnabled = false;
        this.gpuElements = new WeakSet();
        this.animationFrameId = null;
        this.gpuAccelerationEnabled = this.isGPUSupported();
    }
    // Check if GPU acceleration is supported
    isGPUSupported() {
        // Check if we're in a browser environment
        if (typeof document === 'undefined') {
            return false; // Not supported in Node.js environment
        }
        // Check for 3D transform support
        const testEl = document.createElement('div');
        return testEl.style.webkitTransform !== undefined ||
            testEl.style.transform !== undefined;
    }
    // Enable GPU acceleration for an element
    enableForElement(element) {
        if (!this.gpuAccelerationEnabled)
            return;
        // Apply GPU-accelerated styles
        element.style.willChange = 'transform';
        element.style.transform = 'translateZ(0)';
        element.style.backfaceVisibility = 'hidden';
        element.style.perspective = '1000px';
        // Add to tracked elements
        this.gpuElements.add(element);
    }
    // Disable GPU acceleration for an element
    disableForElement(element) {
        if (!this.gpuAccelerationEnabled)
            return;
        // Remove GPU-accelerated styles
        element.style.willChange = 'auto';
        element.style.transform = '';
        element.style.backfaceVisibility = '';
        element.style.perspective = '';
        // Remove from tracked elements
        this.gpuElements.delete(element);
    }
    // Apply GPU acceleration to a list of elements
    enableForElements(elements) {
        elements.forEach(el => this.enableForElement(el));
    }
    // Batch update GPU acceleration
    batchUpdate(elements, enable) {
        if (!this.gpuAccelerationEnabled)
            return;
        if (enable) {
            this.enableForElements(elements);
        }
        else {
            elements.forEach(el => this.disableForElement(el));
        }
    }
    // Optimize scrolling container for GPU acceleration
    optimizeScrollContainer(container) {
        if (!this.gpuAccelerationEnabled)
            return;
        // Apply optimizations to container
        container.style.transform = 'translateZ(0)';
        container.style.willChange = 'scroll-position';
        container.style.webkitOverflowScrolling = 'touch'; // For iOS
    }
    // Optimize individual items for GPU acceleration
    optimizeItem(item) {
        if (!this.gpuAccelerationEnabled)
            return;
        // Apply lightweight GPU acceleration
        item.style.transform = 'translateZ(0)';
        item.style.willChange = 'transform';
    }
    // Get GPU acceleration status
    getStatus() {
        // Since WeakSet doesn't have a size property, we can't count directly
        // This is a limitation of WeakSet
        return {
            enabled: this.gpuAccelerationEnabled,
            supported: this.isGPUSupported(),
            elementCount: 0 // Placeholder - would need different tracking method
        };
    }
    // Optimize for different scenarios
    optimizeForScenario(scenario) {
        if (!this.gpuAccelerationEnabled)
            return;
        switch (scenario) {
            case 'scrolling':
                // Optimize for smooth scrolling
                document.body.style.willChange = 'transform';
                break;
            case 'animation':
                // Optimize for animations
                document.body.style.transform = 'translateZ(0)';
                break;
            case 'static':
                // Remove optimizations when not needed
                document.body.style.willChange = 'auto';
                document.body.style.transform = '';
                break;
        }
    }
    // Cleanup GPU acceleration resources
    cleanup() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        // Reset any applied styles (would need to track them)
        this.gpuElements = new WeakSet();
    }
    // Check if element has GPU acceleration enabled
    isAccelerated(element) {
        return this.gpuElements.has(element);
    }
    // Get optimization recommendations
    getRecommendations() {
        const recommendations = [];
        if (!this.gpuAccelerationEnabled) {
            recommendations.push('GPU acceleration not supported on this device');
        }
        else {
            recommendations.push('GPU acceleration enabled for smooth performance');
            recommendations.push('Using hardware-accelerated compositing');
            recommendations.push('Optimized for 60fps rendering');
        }
        return recommendations;
    }
}

/**
 * Batch Size Optimizer
 * Dynamically adjusts batch size based on scroll speed, network, and performance
 */
class BatchSizeOptimizer {
    constructor(config, networkDetector, performanceMonitor) {
        this.scrollSpeedHistory = [];
        this.renderTimeHistory = [];
        this.HISTORY_SIZE = 10;
        this.config = {
            minBatchSize: (config === null || config === void 0 ? void 0 : config.minBatchSize) || 10,
            maxBatchSize: (config === null || config === void 0 ? void 0 : config.maxBatchSize) || 100,
            baseBatchSize: (config === null || config === void 0 ? void 0 : config.baseBatchSize) || 50,
            scrollSpeedThreshold: (config === null || config === void 0 ? void 0 : config.scrollSpeedThreshold) || 1.0
        };
        this.currentBatchSize = this.config.baseBatchSize;
        this.networkDetector = networkDetector || new NetworkSpeedDetector();
        this.performanceMonitor = performanceMonitor || new DevicePerformanceMonitor();
    }
    /**
     * Calculate optimal batch size based on all factors
     */
    async calculateOptimalBatchSize(scrollSpeed) {
        // Track scroll speed history
        this.trackScrollSpeed(scrollSpeed);
        // Get network quality
        const networkQuality = await this.networkDetector.assessConnectionQuality();
        // Get performance score
        const performanceScore = await this.performanceMonitor.assessPerformance();
        // Calculate batch size based on scroll speed
        const speedMultiplier = this.calculateSpeedMultiplier(scrollSpeed);
        // Calculate batch size based on network
        const networkMultiplier = this.calculateNetworkMultiplier(networkQuality);
        // Calculate batch size based on performance
        const performanceMultiplier = this.calculatePerformanceMultiplier(performanceScore);
        // Calculate final batch size
        const optimalBatchSize = Math.round(this.config.baseBatchSize * speedMultiplier * networkMultiplier * performanceMultiplier);
        // Apply min/max bounds
        this.currentBatchSize = Math.max(this.config.minBatchSize, Math.min(this.config.maxBatchSize, optimalBatchSize));
        return this.currentBatchSize;
    }
    /**
     * Calculate multiplier based on scroll speed
     */
    calculateSpeedMultiplier(scrollSpeed) {
        const avgScrollSpeed = this.getAverageScrollSpeed();
        // Fast scrolling = larger batches (preload more)
        if (Math.abs(avgScrollSpeed) > this.config.scrollSpeedThreshold * 2) {
            return 1.5; // 50% more items
        }
        else if (Math.abs(avgScrollSpeed) > this.config.scrollSpeedThreshold) {
            return 1.2; // 20% more items
        }
        else if (Math.abs(avgScrollSpeed) < 0.3) {
            return 0.8; // 20% fewer items (user reading carefully)
        }
        return 1.0; // Normal batch size
    }
    /**
     * Calculate multiplier based on network quality
     */
    calculateNetworkMultiplier(quality) {
        switch (quality) {
            case 'excellent':
                return 1.3; // Load more on fast network
            case 'good':
                return 1.1; // Slightly more
            case 'poor':
                return 0.6; // Load less on slow network
            case 'offline':
                return 0.3; // Minimal loading when offline
            default:
                return 1.0;
        }
    }
    /**
     * Calculate multiplier based on device performance
     */
    calculatePerformanceMultiplier(score) {
        // score is 0-1 (0 = poor, 1 = excellent)
        if (score > 0.8) {
            return 1.2; // High-performance device
        }
        else if (score > 0.5) {
            return 1.0; // Average device
        }
        else {
            return 0.7; // Low-performance device
        }
    }
    /**
     * Track scroll speed for averaging
     */
    trackScrollSpeed(speed) {
        this.scrollSpeedHistory.push(speed);
        if (this.scrollSpeedHistory.length > this.HISTORY_SIZE) {
            this.scrollSpeedHistory.shift();
        }
    }
    /**
     * Get average scroll speed
     */
    getAverageScrollSpeed() {
        if (this.scrollSpeedHistory.length === 0)
            return 0;
        const sum = this.scrollSpeedHistory.reduce((a, b) => a + b, 0);
        return sum / this.scrollSpeedHistory.length;
    }
    /**
     * Track render time for performance monitoring
     */
    trackRenderTime(renderTime) {
        this.renderTimeHistory.push(renderTime);
        if (this.renderTimeHistory.length > this.HISTORY_SIZE) {
            this.renderTimeHistory.shift();
        }
    }
    /**
     * Get average render time
     */
    getAverageRenderTime() {
        if (this.renderTimeHistory.length === 0)
            return 0;
        const sum = this.renderTimeHistory.reduce((a, b) => a + b, 0);
        return sum / this.renderTimeHistory.length;
    }
    /**
     * Get current batch metrics
     */
    getMetrics() {
        return {
            currentBatchSize: this.currentBatchSize,
            scrollSpeed: this.getAverageScrollSpeed(),
            networkQuality: 'good', // Would need to cache this
            performanceScore: 0.8, // Would need to cache this
            avgRenderTime: this.getAverageRenderTime()
        };
    }
    /**
     * Get current batch size
     */
    getCurrentBatchSize() {
        return this.currentBatchSize;
    }
    /**
     * Reset optimizer
     */
    reset() {
        this.scrollSpeedHistory = [];
        this.renderTimeHistory = [];
        this.currentBatchSize = this.config.baseBatchSize;
    }
    /**
     * Get optimization statistics
     */
    getStats() {
        return {
            avgScrollSpeed: this.getAverageScrollSpeed(),
            avgRenderTime: this.getAverageRenderTime(),
            currentBatchSize: this.currentBatchSize,
            totalAdjustments: this.scrollSpeedHistory.length
        };
    }
}

/**
 * Request Deduplication
 * Prevents duplicate requests from being sent
 */
class RequestDeduplicator {
    constructor() {
        this.pendingRequests = new Map();
        this.requestCount = new Map();
    }
    /**
     * Execute request with deduplication
     * If same request is already pending, return existing promise
     */
    async request(key, requestFn, ttl = 5000 // Time to live in ms
    ) {
        // Check if same request is already pending
        if (this.pendingRequests.has(key)) {
            console.log(`[RequestDeduplicator] Deduplicating request: ${key}`);
            return this.pendingRequests.get(key);
        }
        // Create new request
        const promise = requestFn()
            .then(result => {
            this.pendingRequests.delete(key);
            this.requestCount.delete(key);
            return result;
        })
            .catch(error => {
            this.pendingRequests.delete(key);
            this.requestCount.delete(key);
            throw error;
        });
        // Store pending request
        this.pendingRequests.set(key, promise);
        // Track request count for analytics
        const count = this.requestCount.get(key) || 0;
        this.requestCount.set(key, count + 1);
        // Auto cleanup after TTL
        setTimeout(() => {
            if (this.pendingRequests.has(key)) {
                this.pendingRequests.delete(key);
            }
        }, ttl);
        return promise;
    }
    /**
     * Clear specific request
     */
    clear(key) {
        this.pendingRequests.delete(key);
        this.requestCount.delete(key);
    }
    /**
     * Clear all requests
     */
    clearAll() {
        this.pendingRequests.clear();
        this.requestCount.clear();
    }
    /**
     * Get pending request count
     */
    getPendingCount() {
        return this.pendingRequests.size;
    }
    /**
     * Get request statistics
     */
    getStats() {
        const totalRequests = Array.from(this.requestCount.values()).reduce((a, b) => a + b, 0);
        const deduplicated = totalRequests - this.pendingRequests.size;
        return {
            pending: this.pendingRequests.size,
            totalRequests,
            deduplicationRate: totalRequests > 0 ? deduplicated / totalRequests : 0
        };
    }
}

/**
 * Priority-based Request Queue
 * Processes high-priority requests first
 */
exports.Priority = void 0;
(function (Priority) {
    Priority[Priority["LOW"] = 0] = "LOW";
    Priority[Priority["NORMAL"] = 1] = "NORMAL";
    Priority[Priority["HIGH"] = 2] = "HIGH";
    Priority[Priority["CRITICAL"] = 3] = "CRITICAL";
})(exports.Priority || (exports.Priority = {}));
class PriorityRequestQueue {
    constructor(maxConcurrent = 2) {
        this.queues = new Map();
        this.processing = false;
        this.maxConcurrent = 2;
        this.activeRequests = 0;
        this.maxConcurrent = maxConcurrent;
        // Initialize priority queues
        Object.values(exports.Priority).forEach(priority => {
            if (typeof priority === 'number') {
                this.queues.set(priority, []);
            }
        });
    }
    /**
     * Add request with priority
     */
    add(requestFn, priority = exports.Priority.NORMAL) {
        return new Promise((resolve, reject) => {
            const request = {
                priority,
                requestFn: () => requestFn(),
                resolve,
                reject,
                timestamp: Date.now()
            };
            // Add to appropriate priority queue
            const queue = this.queues.get(priority) || [];
            queue.push(request);
            this.queues.set(priority, queue);
            // Start processing if not already processing
            if (!this.processing) {
                this.processQueue();
            }
        });
    }
    /**
     * Process queue by priority
     */
    async processQueue() {
        if (this.processing)
            return;
        this.processing = true;
        while (this.hasPendingRequests() && this.activeRequests < this.maxConcurrent) {
            // Get highest priority request
            const request = this.getNextRequest();
            if (!request)
                break;
            this.activeRequests++;
            // Execute request
            request.requestFn()
                .then(request.resolve)
                .catch(request.reject)
                .finally(() => {
                this.activeRequests--;
                this.processQueue();
            });
        }
        this.processing = false;
    }
    /**
     * Get next request by priority
     */
    getNextRequest() {
        // Process from highest priority to lowest
        for (let priority = exports.Priority.CRITICAL; priority >= exports.Priority.LOW; priority--) {
            const queue = this.queues.get(priority);
            if (queue && queue.length > 0) {
                return queue.shift() || null;
            }
        }
        return null;
    }
    /**
     * Check if there are pending requests
     */
    hasPendingRequests() {
        for (const queue of this.queues.values()) {
            if (queue.length > 0)
                return true;
        }
        return false;
    }
    /**
     * Get queue statistics
     */
    getStats() {
        var _a, _b, _c, _d;
        const byPriority = {
            critical: ((_a = this.queues.get(exports.Priority.CRITICAL)) === null || _a === void 0 ? void 0 : _a.length) || 0,
            high: ((_b = this.queues.get(exports.Priority.HIGH)) === null || _b === void 0 ? void 0 : _b.length) || 0,
            normal: ((_c = this.queues.get(exports.Priority.NORMAL)) === null || _c === void 0 ? void 0 : _c.length) || 0,
            low: ((_d = this.queues.get(exports.Priority.LOW)) === null || _d === void 0 ? void 0 : _d.length) || 0
        };
        return {
            totalPending: Object.values(byPriority).reduce((a, b) => a + b, 0),
            byPriority,
            activeRequests: this.activeRequests
        };
    }
    /**
     * Clear all queues
     */
    clear() {
        this.queues.forEach(queue => queue.length = 0);
        this.processing = false;
        this.activeRequests = 0;
    }
    /**
     * Clear specific priority queue
     */
    clearPriority(priority) {
        const queue = this.queues.get(priority);
        if (queue) {
            queue.length = 0;
        }
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
        this.performanceOptimizer = new PerformanceOptimizer();
        this.memoryManager = new MemoryManager(1000); // Cache up to 1000 items
        this.gpuAccelerator = new GPUAccelerator();
        this.batchSizeOptimizer = new BatchSizeOptimizer();
        this.requestDeduplicator = new RequestDeduplicator();
        this.priorityRequestQueue = new PriorityRequestQueue(2);
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
        // Use performance optimizer to schedule updates efficiently
        this.performanceOptimizer.scheduleOptimizedUpdate(async () => {
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
            // Update memory manager with visible range
            this.memoryManager.setVisibleRange({
                start: Math.max(0, this.state.visibleRange.start - adaptiveBuffer),
                end: this.state.visibleRange.end + adaptiveBuffer
            });
            this.state.scrollTop = scrollTop;
            this.state.visibleRange = this.windowManager.calculateVisibleRange(scrollTop);
            // Check if we need to fetch more items
            if (await this.shouldFetchMore()) {
                await this.fetchMore();
            }
        });
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
        this.performanceOptimizer.cleanup();
        this.memoryManager.clear();
    }
}

/**
 * Height Measurement Cache
 * Dynamically measures and caches item heights for variable height support
 */
class HeightMeasurementCache {
    constructor(estimatedHeight = 100) {
        this.heightMap = new Map();
        this.offsetMap = new Map();
        this.totalHeight = 0;
        this.accessCount = 0;
        this.hitCount = 0;
        this.DEFAULT_TTL = 60000; // 1 minute
        this.estimatedHeight = estimatedHeight;
    }
    /**
     * Measure and cache height for an item
     */
    measureHeight(index, element) {
        const height = element.offsetHeight;
        this.heightMap.set(index, {
            height,
            measured: true,
            timestamp: Date.now()
        });
        // Recalculate offsets
        this.recalculateOffsets();
        return height;
    }
    /**
     * Get height for an item (measured or estimated)
     */
    getHeight(index) {
        this.accessCount++;
        const entry = this.heightMap.get(index);
        if (entry) {
            this.hitCount++;
            return entry.height;
        }
        // Return estimated height for unmeasured items
        return this.estimatedHeight;
    }
    /**
     * Get offset (cumulative height) for an item
     */
    getOffset(index) {
        const offset = this.offsetMap.get(index);
        return offset !== undefined ? offset : index * this.estimatedHeight;
    }
    /**
     * Check if item height is measured
     */
    isMeasured(index) {
        return this.heightMap.has(index);
    }
    /**
     * Mark item as needing remeasurement
     */
    invalidate(index) {
        const entry = this.heightMap.get(index);
        if (entry) {
            entry.measured = false;
        }
    }
    /**
     * Clear specific item from cache
     */
    clear(index) {
        this.heightMap.delete(index);
        this.recalculateOffsets();
    }
    /**
     * Clear entire cache
     */
    clearAll() {
        this.heightMap.clear();
        this.offsetMap.clear();
        this.totalHeight = 0;
        this.accessCount = 0;
        this.hitCount = 0;
    }
    /**
     * Recalculate all offsets
     */
    recalculateOffsets() {
        this.offsetMap.clear();
        let currentOffset = 0;
        // We need to calculate offsets for all items
        // This is called when heights change
        const indices = Array.from(this.heightMap.keys()).sort((a, b) => a - b);
        for (const index of indices) {
            this.offsetMap.set(index, currentOffset);
            const entry = this.heightMap.get(index);
            if (entry) {
                currentOffset += entry.height;
            }
            else {
                currentOffset += this.estimatedHeight;
            }
        }
        this.totalHeight = currentOffset;
    }
    /**
     * Get total height of all items
     */
    getTotalHeight(totalItems) {
        if (this.heightMap.size === 0) {
            return totalItems * this.estimatedHeight;
        }
        // Calculate based on measured + estimated
        let total = 0;
        for (let i = 0; i < totalItems; i++) {
            total += this.getHeight(i);
        }
        return total;
    }
    /**
     * Find item index at a specific scroll position
     */
    findIndexAtPosition(position, totalItems) {
        let low = 0;
        let high = totalItems - 1;
        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const offset = this.getOffset(mid);
            if (offset < position) {
                low = mid + 1;
            }
            else if (offset > position) {
                high = mid - 1;
            }
            else {
                return mid;
            }
        }
        return low;
    }
    /**
     * Get cache statistics
     */
    getStats(totalItems) {
        const measuredItems = this.heightMap.size;
        const estimatedItems = totalItems - measuredItems;
        return {
            totalItems,
            measuredItems,
            estimatedItems,
            cacheSize: this.heightMap.size,
            hitRate: this.accessCount > 0 ? this.hitCount / this.accessCount : 0
        };
    }
    /**
     * Update estimated height
     */
    updateEstimatedHeight(height) {
        this.estimatedHeight = height;
    }
    /**
     * Get estimated height
     */
    getEstimatedHeight() {
        return this.estimatedHeight;
    }
    /**
     * Cleanup old entries (older than TTL)
     */
    cleanup(ttl = this.DEFAULT_TTL) {
        const now = Date.now();
        const toDelete = [];
        this.heightMap.forEach((entry, index) => {
            if (now - entry.timestamp > ttl) {
                toDelete.push(index);
            }
        });
        toDelete.forEach(index => this.clear(index));
    }
    /**
     * Get all measured heights
     */
    getAllHeights() {
        const heights = new Map();
        this.heightMap.forEach((entry, index) => {
            heights.set(index, entry.height);
        });
        return heights;
    }
    /**
     * Set heights in bulk (for initial data load)
     */
    setHeightsBulk(heights) {
        heights.forEach((height, index) => {
            this.heightMap.set(index, {
                height,
                measured: true,
                timestamp: Date.now()
            });
        });
        this.recalculateOffsets();
    }
}

/**
 * Variable Height Manager
 * Manages variable height items with efficient position calculations
 */
class VariableHeightManager {
    constructor(config) {
        this.totalItems = 0;
        this.lastMeasuredIndex = -1;
        this.config = {
            estimatedHeight: (config === null || config === void 0 ? void 0 : config.estimatedHeight) || 100,
            minHeight: (config === null || config === void 0 ? void 0 : config.minHeight) || 50,
            maxHeight: (config === null || config === void 0 ? void 0 : config.maxHeight) || 500,
            bufferSize: (config === null || config === void 0 ? void 0 : config.bufferSize) || 5
        };
        this.heightCache = new HeightMeasurementCache(this.config.estimatedHeight);
    }
    /**
     * Set total number of items
     */
    setTotalItems(total) {
        this.totalItems = total;
    }
    /**
     * Measure item height from DOM element
     */
    measureElement(index, element) {
        if (!element) {
            return this.config.estimatedHeight;
        }
        const height = element.offsetHeight;
        // Clamp height between min and max
        const clampedHeight = Math.max(this.config.minHeight, Math.min(this.config.maxHeight, height));
        this.heightCache.measureHeight(index, { offsetHeight: clampedHeight });
        this.lastMeasuredIndex = Math.max(this.lastMeasuredIndex, index);
        return clampedHeight;
    }
    /**
     * Get item position (offset and height)
     */
    getItemPosition(index) {
        const offset = this.heightCache.getOffset(index);
        const height = this.heightCache.getHeight(index);
        return {
            index,
            offset,
            height
        };
    }
    /**
     * Calculate visible range for variable heights
     */
    calculateVisibleRange(scrollTop, viewportHeight) {
        // Find start index based on scroll position
        const startIndex = this.heightCache.findIndexAtPosition(scrollTop, this.totalItems);
        // Calculate how many items fit in viewport
        let endIndex = startIndex;
        let currentOffset = this.heightCache.getOffset(startIndex);
        while (endIndex < this.totalItems && currentOffset < scrollTop + viewportHeight) {
            const height = this.heightCache.getHeight(endIndex);
            currentOffset += height;
            endIndex++;
        }
        // Add buffer
        const bufferedStart = Math.max(0, startIndex - this.config.bufferSize);
        const bufferedEnd = Math.min(this.totalItems - 1, endIndex + this.config.bufferSize);
        return {
            start: bufferedStart,
            end: bufferedEnd
        };
    }
    /**
     * Get total height of all items
     */
    getTotalHeight() {
        return this.heightCache.getTotalHeight(this.totalItems);
    }
    /**
     * Scroll to specific item index
     */
    scrollToIndex(index) {
        const offset = this.heightCache.getOffset(index);
        return offset;
    }
    /**
     * Get items to render for current viewport
     */
    getItemsToRender(scrollTop, viewportHeight) {
        const visibleRange = this.calculateVisibleRange(scrollTop, viewportHeight);
        const items = [];
        for (let i = visibleRange.start; i <= visibleRange.end; i++) {
            items.push(this.getItemPosition(i));
        }
        return {
            items,
            totalHeight: this.getTotalHeight()
        };
    }
    /**
     * Handle height change (when item height changes dynamically)
     */
    onHeightChange(index, newHeight) {
        const oldHeight = this.heightCache.getHeight(index);
        const heightDiff = newHeight - oldHeight;
        // Update cache
        this.heightCache.measureHeight(index, { offsetHeight: newHeight });
        // If height changed significantly, may need to adjust scroll position
        if (Math.abs(heightDiff) > 50) {
            // Large height change - may need to recalculate
            this.heightCache.invalidate(index);
        }
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.heightCache.getStats(this.totalItems);
    }
    /**
     * Clear cache for specific range
     */
    clearRange(startIndex, endIndex) {
        for (let i = startIndex; i <= endIndex; i++) {
            this.heightCache.clear(i);
        }
    }
    /**
     * Clear entire cache
     */
    clearCache() {
        this.heightCache.clearAll();
        this.lastMeasuredIndex = -1;
    }
    /**
     * Get last measured index
     */
    getLastMeasuredIndex() {
        return this.lastMeasuredIndex;
    }
    /**
     * Check if item is measured
     */
    isItemMeasured(index) {
        return this.heightCache.isMeasured(index);
    }
    /**
     * Get measured items count
     */
    getMeasuredCount() {
        return this.heightCache.getStats(this.totalItems).measuredItems;
    }
}

/**
 * Dynamic Height Engine
 * Core engine for variable height virtual scrolling
 */
class DynamicHeightEngine {
    constructor(config = {}) {
        this.containerElement = null;
        this.itemElements = new Map();
        this.config = {
            itemHeight: config.estimatedItemHeight || 100,
            viewportHeight: config.viewportHeight || 400,
            bufferSize: config.heightBufferSize || 5,
            estimatedItemHeight: config.estimatedItemHeight || 100,
            minItemHeight: config.minItemHeight || 50,
            maxItemHeight: config.maxItemHeight || 500,
            heightBufferSize: config.heightBufferSize || 5
        };
        this.variableHeightManager = new VariableHeightManager({
            estimatedHeight: this.config.estimatedItemHeight,
            minHeight: this.config.minItemHeight,
            maxHeight: this.config.maxItemHeight,
            bufferSize: this.config.heightBufferSize
        });
        this.heightCache = new HeightMeasurementCache(this.config.estimatedItemHeight);
        this.state = {
            scrollTop: 0,
            visibleRange: { start: 0, end: 0 },
            loadedItems: 0,
            isLoading: false,
            totalContentHeight: 0,
            measuredItems: 0,
            estimatedItems: 0
        };
    }
    /**
     * Initialize with container element
     */
    init(container) {
        this.containerElement = container;
        this.setupScrollListener();
    }
    /**
     * Setup scroll listener
     */
    setupScrollListener() {
        if (!this.containerElement)
            return;
        this.containerElement.addEventListener('scroll', () => {
            this.onScroll();
        }, { passive: true });
    }
    /**
     * Handle scroll event
     */
    onScroll() {
        if (!this.containerElement)
            return;
        const scrollTop = this.containerElement.scrollTop;
        this.state.scrollTop = scrollTop;
        // Recalculate visible range
        this.updateVisibleRange();
    }
    /**
     * Update visible range based on scroll position
     */
    updateVisibleRange() {
        if (!this.containerElement)
            return;
        const viewportHeight = this.containerElement.clientHeight;
        const visibleRange = this.variableHeightManager.calculateVisibleRange(this.state.scrollTop, viewportHeight);
        this.state.visibleRange = visibleRange;
        // Update state with measured/estimated counts
        const stats = this.variableHeightManager.getCacheStats();
        this.state.measuredItems = stats.measuredItems;
        this.state.estimatedItems = stats.estimatedItems;
        this.state.totalContentHeight = this.variableHeightManager.getTotalHeight();
    }
    /**
     * Measure item height from DOM element
     */
    measureItem(index, element) {
        const height = this.variableHeightManager.measureElement(index, element);
        // Store element reference
        this.itemElements.set(index, element);
        // Update state
        const stats = this.variableHeightManager.getCacheStats();
        this.state.measuredItems = stats.measuredItems;
        this.state.estimatedItems = stats.estimatedItems;
        this.state.totalContentHeight = this.variableHeightManager.getTotalHeight();
        // Trigger re-render if needed
        this.onHeightMeasured(index, height);
        return height;
    }
    /**
     * Called when item height is measured
     */
    onHeightMeasured(index, height) {
        // Can be overridden to trigger UI updates
        // For example, update styles or trigger re-render
    }
    /**
     * Get items to render for current viewport
     */
    getItemsToRender() {
        if (!this.containerElement) {
            return {
                items: [],
                totalHeight: 0,
                visibleRange: { start: 0, end: 0 }
            };
        }
        const { items, totalHeight } = this.variableHeightManager.getItemsToRender(this.state.scrollTop, this.containerElement.clientHeight);
        return {
            items,
            totalHeight,
            visibleRange: this.state.visibleRange
        };
    }
    /**
     * Scroll to specific item index
     */
    scrollToIndex(index) {
        if (!this.containerElement)
            return;
        const offset = this.variableHeightManager.scrollToIndex(index);
        this.containerElement.scrollTop = offset;
        // Update state
        this.state.scrollTop = offset;
        this.updateVisibleRange();
    }
    /**
     * Set total number of items
     */
    setTotalItems(total) {
        this.variableHeightManager.setTotalItems(total);
        this.state.loadedItems = total;
        this.state.totalContentHeight = this.variableHeightManager.getTotalHeight();
    }
    /**
     * Get current state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return this.variableHeightManager.getCacheStats();
    }
    /**
     * Clear cache for range
     */
    clearCacheRange(startIndex, endIndex) {
        this.variableHeightManager.clearRange(startIndex, endIndex);
        // Clear element references
        for (let i = startIndex; i <= endIndex; i++) {
            this.itemElements.delete(i);
        }
    }
    /**
     * Clear entire cache
     */
    clearCache() {
        this.variableHeightManager.clearCache();
        this.itemElements.clear();
    }
    /**
     * Cleanup
     */
    cleanup() {
        if (this.containerElement) {
            this.containerElement.removeEventListener('scroll', this.onScroll.bind(this));
        }
        this.clearCache();
    }
    /**
     * Update viewport height
     */
    updateViewportHeight(height) {
        this.config.viewportHeight = height;
        this.updateVisibleRange();
    }
    /**
     * Get item offset for styling
     */
    getItemOffset(index) {
        return this.variableHeightManager.getItemPosition(index).offset;
    }
    /**
     * Get item height
     */
    getItemHeight(index) {
        return this.variableHeightManager.getItemPosition(index).height;
    }
    /**
     * Check if item is measured
     */
    isItemMeasured(index) {
        return this.variableHeightManager.isItemMeasured(index);
    }
}

/**
 * Smart Prefetch Algorithm
 * Recognizes scroll patterns and predicts data loading needs
 */
class SmartPrefetchAlgorithm {
    constructor() {
        this.velocityHistory = [];
        this.directionHistory = [];
        this.HISTORY_SIZE = 20;
        this.lastPrefetchTime = 0;
        this.prefetchCooldown = 500; // ms
    }
    /**
     * Analyze scroll pattern
     */
    analyzeScrollPattern(velocity, acceleration, direction) {
        this.trackVelocity(velocity);
        this.trackDirection(direction);
        const avgVelocity = this.getAverageVelocity();
        const velocityVariance = this.getVelocityVariance();
        const directionChanges = this.countDirectionChanges();
        // Determine pattern type
        let pattern;
        if (Math.abs(avgVelocity) > 2.0) {
            pattern = {
                type: 'fast-scroll',
                velocity: avgVelocity,
                acceleration,
                direction,
                confidence: 0.9
            };
        }
        else if (Math.abs(avgVelocity) < 0.3) {
            pattern = {
                type: 'paused',
                velocity: avgVelocity,
                acceleration,
                direction: 'stationary',
                confidence: 0.95
            };
        }
        else if (directionChanges > 5) {
            pattern = {
                type: 'oscillating',
                velocity: avgVelocity,
                acceleration,
                direction,
                confidence: 0.85
            };
        }
        else if (velocityVariance < 0.5) {
            pattern = {
                type: 'steady',
                velocity: avgVelocity,
                acceleration,
                direction,
                confidence: 0.9
            };
        }
        else {
            pattern = {
                type: 'slow-scroll',
                velocity: avgVelocity,
                acceleration,
                direction,
                confidence: 0.8
            };
        }
        return pattern;
    }
    /**
     * Predict prefetch needs based on scroll pattern
     */
    predictPrefetchNeeds(pattern, visibleEnd, totalLoaded) {
        const now = Date.now();
        // Check cooldown
        if (now - this.lastPrefetchTime < this.prefetchCooldown) {
            return {
                shouldPrefetch: false,
                prefetchDistance: 0,
                batchSize: 0,
                priority: 'low',
                confidence: 1.0
            };
        }
        let prediction;
        switch (pattern.type) {
            case 'fast-scroll':
                prediction = {
                    shouldPrefetch: true,
                    prefetchDistance: 1500, // Far ahead for fast scrolling
                    batchSize: 30, // Large batch
                    priority: 'critical',
                    confidence: pattern.confidence
                };
                break;
            case 'steady':
                prediction = {
                    shouldPrefetch: visibleEnd >= totalLoaded - 800,
                    prefetchDistance: 800,
                    batchSize: 20,
                    priority: 'high',
                    confidence: pattern.confidence
                };
                break;
            case 'slow-scroll':
                prediction = {
                    shouldPrefetch: visibleEnd >= totalLoaded - 400,
                    prefetchDistance: 400,
                    batchSize: 10,
                    priority: 'normal',
                    confidence: pattern.confidence
                };
                break;
            case 'oscillating':
                prediction = {
                    shouldPrefetch: visibleEnd >= totalLoaded - 600,
                    prefetchDistance: 600,
                    batchSize: 15,
                    priority: 'normal',
                    confidence: pattern.confidence * 0.8 // Lower confidence for oscillating
                };
                break;
            case 'paused':
                prediction = {
                    shouldPrefetch: false, // User paused, no need to prefetch
                    prefetchDistance: 0,
                    batchSize: 0,
                    priority: 'low',
                    confidence: pattern.confidence
                };
                break;
            default:
                prediction = {
                    shouldPrefetch: visibleEnd >= totalLoaded - 500,
                    prefetchDistance: 500,
                    batchSize: 15,
                    priority: 'normal',
                    confidence: 0.7
                };
        }
        // Update last prefetch time if prefetching
        if (prediction.shouldPrefetch) {
            this.lastPrefetchTime = now;
        }
        return prediction;
    }
    /**
     * Track velocity history
     */
    trackVelocity(velocity) {
        this.velocityHistory.push(velocity);
        if (this.velocityHistory.length > this.HISTORY_SIZE) {
            this.velocityHistory.shift();
        }
    }
    /**
     * Track direction history
     */
    trackDirection(direction) {
        this.directionHistory.push(direction);
        if (this.directionHistory.length > this.HISTORY_SIZE) {
            this.directionHistory.shift();
        }
    }
    /**
     * Get average velocity
     */
    getAverageVelocity() {
        if (this.velocityHistory.length === 0)
            return 0;
        const sum = this.velocityHistory.reduce((a, b) => a + b, 0);
        return sum / this.velocityHistory.length;
    }
    /**
     * Get velocity variance
     */
    getVelocityVariance() {
        if (this.velocityHistory.length < 2)
            return 0;
        const avg = this.getAverageVelocity();
        const squaredDiffs = this.velocityHistory.map(v => Math.pow(v - avg, 2));
        const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / squaredDiffs.length;
        return Math.sqrt(avgSquaredDiff);
    }
    /**
     * Count direction changes
     */
    countDirectionChanges() {
        if (this.directionHistory.length < 2)
            return 0;
        let changes = 0;
        for (let i = 1; i < this.directionHistory.length; i++) {
            if (this.directionHistory[i] !== this.directionHistory[i - 1] &&
                this.directionHistory[i] !== 'stationary' &&
                this.directionHistory[i - 1] !== 'stationary') {
                changes++;
            }
        }
        return changes;
    }
    /**
     * Reset history
     */
    reset() {
        this.velocityHistory = [];
        this.directionHistory = [];
        this.lastPrefetchTime = 0;
    }
    /**
     * Get prediction confidence
     */
    getConfidence() {
        if (this.velocityHistory.length < 5)
            return 0.5; // Not enough data
        return Math.min(this.velocityHistory.length / this.HISTORY_SIZE, 1.0);
    }
}

/**
 * Preemptive Caching
 * Caches data before it's needed based on predictions
 */
class PreemptiveCache {
    constructor(config) {
        this.cache = new Map();
        this.accessHistory = [];
        this.config = {
            maxSize: (config === null || config === void 0 ? void 0 : config.maxSize) || 1000,
            defaultTTL: (config === null || config === void 0 ? void 0 : config.defaultTTL) || 300000, // 5 minutes
            cleanupThreshold: (config === null || config === void 0 ? void 0 : config.cleanupThreshold) || 800
        };
    }
    /**
     * Preemptively cache data with priority
     */
    preemptiveCache(index, data, priority = 'normal') {
        // Check if we need to cleanup
        if (this.cache.size >= this.config.cleanupThreshold) {
            this.cleanup();
        }
        const entry = {
            data,
            timestamp: Date.now(),
            priority,
            accessCount: 0,
            expiry: Date.now() + this.config.defaultTTL
        };
        this.cache.set(index, entry);
    }
    /**
     * Get cached data
     */
    get(index) {
        const entry = this.cache.get(index);
        if (!entry) {
            return null;
        }
        // Check expiry
        if (Date.now() > entry.expiry) {
            this.cache.delete(index);
            return null;
        }
        // Update access count
        entry.accessCount++;
        this.trackAccess(index);
        return entry.data;
    }
    /**
     * Check if data is cached
     */
    has(index) {
        const entry = this.cache.get(index);
        if (!entry)
            return false;
        // Check expiry
        if (Date.now() > entry.expiry) {
            this.cache.delete(index);
            return false;
        }
        return true;
    }
    /**
     * Get cached data for range
     */
    getRange(startIndex, endIndex) {
        const results = [];
        for (let i = startIndex; i <= endIndex; i++) {
            const data = this.get(i);
            if (data !== null) {
                results.push(data);
            }
        }
        return results;
    }
    /**
     * Delete cached data
     */
    delete(index) {
        return this.cache.delete(index);
    }
    /**
     * Clear cache
     */
    clear() {
        this.cache.clear();
        this.accessHistory = [];
    }
    /**
     * Cleanup old/low-priority entries
     */
    cleanup() {
        const now = Date.now();
        const toDelete = [];
        // First pass: remove expired entries
        this.cache.forEach((entry, index) => {
            if (now > entry.expiry) {
                toDelete.push(index);
            }
        });
        // Second pass: remove low-priority entries if still over limit
        if (this.cache.size - toDelete.length > this.config.maxSize) {
            const sortedByPriority = Array.from(this.cache.entries())
                .filter(([index]) => !toDelete.includes(index))
                .sort((a, b) => {
                const priorityOrder = { critical: 4, high: 3, normal: 2, low: 1 };
                return priorityOrder[a[1].priority] - priorityOrder[b[1].priority];
            });
            // Remove lowest priority entries
            const toRemove = Math.ceil(sortedByPriority.length * 0.2); // Remove 20%
            for (let i = 0; i < toRemove; i++) {
                toDelete.push(sortedByPriority[i][0]);
            }
        }
        // Delete marked entries
        toDelete.forEach(index => this.cache.delete(index));
    }
    /**
     * Track access for analytics
     */
    trackAccess(index) {
        this.accessHistory.push(index);
        if (this.accessHistory.length > 100) {
            this.accessHistory.shift();
        }
    }
    /**
     * Get cache statistics
     */
    getStats() {
        const byPriority = {
            critical: 0,
            high: 0,
            normal: 0,
            low: 0
        };
        let totalAccessCount = 0;
        this.cache.forEach(entry => {
            byPriority[entry.priority]++;
            totalAccessCount += entry.accessCount;
        });
        return {
            size: this.cache.size,
            maxSize: this.config.maxSize,
            hitRate: this.accessHistory.length > 0 ?
                this.accessHistory.filter(i => this.has(i)).length / this.accessHistory.length : 0,
            avgAccessCount: this.cache.size > 0 ? totalAccessCount / this.cache.size : 0,
            byPriority
        };
    }
    /**
     * Get all cached indices
     */
    getCachedIndices() {
        return Array.from(this.cache.keys());
    }
    /**
     * Preemptively cache range
     */
    cacheRange(startIndex, endIndex, dataFetcher, priority) {
        for (let i = startIndex; i <= endIndex; i++) {
            if (!this.has(i)) {
                const data = dataFetcher(i);
                this.preemptiveCache(i, data, priority);
            }
        }
    }
    /**
     * Get memory usage estimate
     */
    getMemoryUsage() {
        // Rough estimate based on cache size
        return this.cache.size * 1024; // Assume ~1KB per entry
    }
}

/**
 * Intelligent Pagination
 * Adaptive page size with cursor-based pagination
 */
class IntelligentPagination {
    constructor() {
        this.currentPage = 1;
        this.basePageSize = 50;
        this.adaptivePageSize = 50;
        this.totalItems = 0;
        this.loadHistory = [];
        this.MIN_PAGE_SIZE = 20;
        this.MAX_PAGE_SIZE = 200;
    }
    /**
     * Get current pagination state
     */
    getState() {
        const totalPages = Math.ceil(this.totalItems / this.adaptivePageSize);
        const hasMore = this.currentPage < totalPages;
        return {
            currentPage: this.currentPage,
            pageSize: this.adaptivePageSize,
            totalItems: this.totalItems,
            totalPages,
            hasMore,
            cursor: this.createCursor(this.currentPage),
            nextCursor: hasMore ? this.createCursor(this.currentPage + 1) : undefined,
            prevCursor: this.currentPage > 1 ? this.createCursor(this.currentPage - 1) : undefined
        };
    }
    /**
     * Set total items
     */
    setTotalItems(total) {
        this.totalItems = total;
    }
    /**
     * Go to next page
     */
    nextPage() {
        const state = this.getState();
        if (state.hasMore) {
            this.currentPage++;
        }
        return this.getState();
    }
    /**
     * Go to previous page
     */
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
        }
        return this.getState();
    }
    /**
     * Go to specific page
     */
    goToPage(page) {
        const totalPages = Math.ceil(this.totalItems / this.adaptivePageSize);
        this.currentPage = Math.max(1, Math.min(page, totalPages));
        return this.getState();
    }
    /**
     * Record load time for adaptive sizing
     */
    recordLoadTime(page, loadTimeMs) {
        this.loadHistory.push({ page, loadTime: loadTimeMs });
        // Keep last 10 load times
        if (this.loadHistory.length > 10) {
            this.loadHistory.shift();
        }
        // Adjust page size based on load time
        this.adaptPageSize();
    }
    /**
     * Adapt page size based on performance
     */
    adaptPageSize() {
        if (this.loadHistory.length < 3)
            return;
        const avgLoadTime = this.loadHistory.reduce((a, b) => a.loadTime + b.loadTime, 0) / this.loadHistory.length;
        // Target: 100-300ms load time
        if (avgLoadTime < 100) {
            // Fast loads - increase page size
            this.adaptivePageSize = Math.min(this.MAX_PAGE_SIZE, Math.round(this.adaptivePageSize * 1.2));
        }
        else if (avgLoadTime > 300) {
            // Slow loads - decrease page size
            this.adaptivePageSize = Math.max(this.MIN_PAGE_SIZE, Math.round(this.adaptivePageSize * 0.8));
        }
        // Optimal load time - keep current size
    }
    /**
     * Create cursor for page
     */
    createCursor(page) {
        const cursorData = {
            page,
            limit: this.adaptivePageSize,
            timestamp: Date.now()
        };
        // Add checksum for validation
        cursorData.checksum = this.calculateChecksum(cursorData);
        return Buffer.from(JSON.stringify(cursorData)).toString('base64');
    }
    /**
     * Decode cursor
     */
    decodeCursor(cursor) {
        try {
            const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
            // Validate checksum
            if (decoded.checksum && !this.validateChecksum(decoded)) {
                return null;
            }
            return decoded;
        }
        catch (_a) {
            return null;
        }
    }
    /**
     * Go to page from cursor
     */
    goToCursor(cursor) {
        const decoded = this.decodeCursor(cursor);
        if (decoded) {
            this.currentPage = decoded.page;
            this.adaptivePageSize = decoded.limit;
        }
        return this.getState();
    }
    /**
     * Calculate checksum for cursor validation
     */
    calculateChecksum(data) {
        const str = `${data.page}-${data.limit}-${data.timestamp}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    /**
     * Validate cursor checksum
     */
    validateChecksum(data) {
        if (!data.checksum)
            return false;
        const { checksum, ...rest } = data;
        return this.calculateChecksum(rest) === checksum;
    }
    /**
     * Get items to fetch for current page
     */
    getFetchRange() {
        return {
            skip: (this.currentPage - 1) * this.adaptivePageSize,
            limit: this.adaptivePageSize
        };
    }
    /**
     * Reset pagination
     */
    reset() {
        this.currentPage = 1;
        this.adaptivePageSize = this.basePageSize;
        this.loadHistory = [];
    }
    /**
     * Get load history for analytics
     */
    getLoadHistory() {
        return [...this.loadHistory];
    }
    /**
     * Get average load time
     */
    getAverageLoadTime() {
        if (this.loadHistory.length === 0)
            return 0;
        return this.loadHistory.reduce((a, b) => a + b.loadTime, 0) / this.loadHistory.length;
    }
    /**
     * Set base page size
     */
    setBasePageSize(size) {
        this.basePageSize = Math.max(this.MIN_PAGE_SIZE, Math.min(this.MAX_PAGE_SIZE, size));
        this.adaptivePageSize = this.basePageSize;
    }
    /**
     * Get current page size
     */
    getPageSize() {
        return this.adaptivePageSize;
    }
    /**
     * Get current page number
     */
    getCurrentPage() {
        return this.currentPage;
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

class LazyScroll {
  constructor(container, config) {
    this.container = container;
    this.config = {
      itemHeight: config.itemHeight || 50,
      viewportHeight: config.viewportHeight || 400,
      bufferSize: config.bufferSize || 5,
      fetchMore: config.fetchMore || (() => Promise.resolve([]))
    };

    this.engine = new Engine(this.config);
    this.engine.setFetchMoreCallback(this.config.fetchMore);

    this.visibleRange = { start: 0, end: 0 };
    this.isLoading = false;
    this.items = [];
    this.visibleItems = [];

    this.scrollHandler = this.onScroll.bind(this);
    this.container.addEventListener('scroll', this.scrollHandler, { passive: true });
  }

  onScroll() {
    const scrollTop = this.container.scrollTop;
    this.engine.updateScrollPosition(scrollTop);

    const state = this.engine.getState();
    this.visibleRange = state.visibleRange;
    this.isLoading = state.isLoading;

    this.render();
  }

  setItems(items) {
    this.items = items;
    this.render();
  }

  render() {
    // Calculate paddings
    const topPadding = this.visibleRange.start * this.config.itemHeight;
    const bottomPadding = Math.max(0, (this.items.length - this.visibleRange.end) * this.config.itemHeight);

    // Get visible items
    this.visibleItems = this.items.slice(this.visibleRange.start, this.visibleRange.end);

    // Clear container except for paddings and content
    const existingContent = this.container.querySelector('.lazy-scroll-content');
    if (existingContent) {
      existingContent.remove();
    }

    // Create content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'lazy-scroll-content';

    // Add top padding
    const topPaddingDiv = document.createElement('div');
    topPaddingDiv.style.height = `${topPadding}px`;
    contentWrapper.appendChild(topPaddingDiv);

    // Add visible items
    this.visibleItems.forEach((item, index) => {
      const itemElement = this.createItemElement(item, this.visibleRange.start + index);
      contentWrapper.appendChild(itemElement);
    });

    // Add bottom padding
    const bottomPaddingDiv = document.createElement('div');
    bottomPaddingDiv.style.height = `${bottomPadding}px`;
    contentWrapper.appendChild(bottomPaddingDiv);

    // Add loading indicator if needed
    if (this.isLoading) {
      const loadingElement = document.createElement('div');
      loadingElement.className = 'lazy-loading';
      loadingElement.textContent = 'Loading more items...';
      contentWrapper.appendChild(loadingElement);
    }

    this.container.appendChild(contentWrapper);
  }

  createItemElement(item, index) {
    const itemElement = document.createElement('div');
    itemElement.style.height = `${this.config.itemHeight}px`;
    itemElement.className = 'lazy-item';

    // Default content - can be customized
    itemElement.textContent = `Item ${index}: ${item.text || item.id || 'Content'}`;

    return itemElement;
  }

  updateConfig(newConfig) {
    if (newConfig.itemHeight !== undefined) this.config.itemHeight = newConfig.itemHeight;
    if (newConfig.viewportHeight !== undefined) this.config.viewportHeight = newConfig.viewportHeight;
    if (newConfig.bufferSize !== undefined) this.config.bufferSize = newConfig.bufferSize;
    if (newConfig.fetchMore !== undefined) {
      this.config.fetchMore = newConfig.fetchMore;
      this.engine.setFetchMoreCallback(newConfig.fetchMore);
    }

    // Re-render with new config
    this.render();
  }

  destroy() {
    this.container.removeEventListener('scroll', this.scrollHandler);
    this.engine.cleanup();
  }

  // Public methods
  getVisibleRange() {
    return { ...this.visibleRange };
  }

  refresh() {
    this.onScroll();
  }
}

// Factory function for easier usage
function createLazyScroll(container, config) {
  return new LazyScroll(container, config);
}

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

// Core exports
class LazyScrollElementClass {
    constructor() { }
    setItems(items) { }
    refresh() { }
    getVisibleRange() { return { start: 0, end: 0 }; }
    static registerElement() { }
}
// Use dynamic import for browser-specific functionality
const LazyScrollElement = typeof window !== 'undefined' && typeof HTMLElement !== 'undefined'
    ? LazyScrollElementClass // Will be replaced with actual element in browser
    : LazyScrollElementClass; // SSR-safe fallback

exports.AdaptiveBufferCalculator = AdaptiveBufferCalculator;
exports.BatchSizeOptimizer = BatchSizeOptimizer;
exports.ContentComplexityAnalyzer = ContentComplexityAnalyzer;
exports.DevicePerformanceMonitor = DevicePerformanceMonitor;
exports.DynamicHeightEngine = DynamicHeightEngine;
exports.Engine = Engine;
exports.GPUAccelerator = GPUAccelerator;
exports.HeightMeasurementCache = HeightMeasurementCache;
exports.IntelligentPagination = IntelligentPagination;
exports.IntelligentScrollDetector = IntelligentScrollDetector;
exports.LazyList = LazyList;
exports.LazyScroll = LazyScroll;
exports.LazyScrollElement = LazyScrollElement;
exports.MemoryManager = MemoryManager;
exports.NetworkAwarePrefetchManager = NetworkAwarePrefetchManager;
exports.NetworkAwareRequestQueue = NetworkAwareRequestQueue;
exports.NetworkSpeedDetector = NetworkSpeedDetector;
exports.PerformanceOptimizer = PerformanceOptimizer;
exports.PreemptiveCache = PreemptiveCache;
exports.PrefetchManager = PrefetchManager;
exports.PriorityRequestQueue = PriorityRequestQueue;
exports.RequestDeduplicator = RequestDeduplicator;
exports.RequestQueue = RequestQueue;
exports.ScrollObserver = ScrollObserver;
exports.SmartPrefetchAlgorithm = SmartPrefetchAlgorithm;
exports.VariableHeightManager = VariableHeightManager;
exports.WindowManager = WindowManager;
exports.createLazyScroll = createLazyScroll;
exports.debounce = debounce;
exports.throttle = throttle;
exports.useLazyList = useLazyList;
//# sourceMappingURL=index.js.map
