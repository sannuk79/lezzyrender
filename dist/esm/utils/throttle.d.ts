/**
 * Throttle function to limit the rate at which a function is called
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=throttle.d.ts.map