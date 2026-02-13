export declare class RequestQueue {
    private queue;
    private processing;
    private maxConcurrent;
    constructor(maxConcurrent?: number);
    /**
     * Add a request to the queue
     */
    add(requestFn: () => Promise<any>): Promise<any>;
    /**
     * Process the queue
     */
    private processQueue;
    /**
     * Clear the queue
     */
    clear(): void;
    /**
     * Get the current queue length
     */
    getLength(): number;
}
//# sourceMappingURL=RequestQueue.d.ts.map