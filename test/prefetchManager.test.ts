import { PrefetchManager } from '../src/core/PrefetchManager';

// Simple test runner for Node.js
function describe(name: string, fn: () => void) {
  console.log(`\nDESCRIBE: ${name}`);
  fn();
}

function test(name: string, fn: () => void | Promise<void>) {
  console.log(`  TEST: ${name}`);
  
  try {
    const result = fn();
    if (result instanceof Promise) {
      result.then(() => console.log('    PASS'))
            .catch(err => console.error(`    FAIL: ${err.message}`));
    } else {
      console.log('    PASS');
    }
  } catch (err) {
    console.error(`    FAIL: ${(err as Error).message}`);
  }
}

function expect(actual: any) {
  return {
    toBe: (expected: any) => {
      if (actual !== expected) {
        throw new Error(`Expected ${actual} to be ${expected}`);
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toBeGreaterThanOrEqual: (expected: number) => {
      if (!(actual >= expected)) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    }
  };
}

describe('PrefetchManager', () => {
  let prefetchManager: PrefetchManager;

  beforeEach(() => {
    prefetchManager = new PrefetchManager(5); // buffer size of 5
  });

  test('should return false when visible end is far from loaded boundary', () => {
    // Visible end at 10, loaded at 50, buffer at 5
    // 10 >= 50 - 5 = 45? No, so should not prefetch
    const shouldPrefetch = prefetchManager.shouldPrefetch(10, 50);
    expect(shouldPrefetch).toBe(false);
  });

  test('should return true when visible end approaches loaded boundary', () => {
    // Visible end at 48, loaded at 50, buffer at 5
    // 48 >= 50 - 5 = 45? Yes, so should prefetch
    const shouldPrefetch = prefetchManager.shouldPrefetch(48, 50);
    expect(shouldPrefetch).toBe(true);
  });

  test('should return true when visible end equals loaded boundary minus buffer', () => {
    // Visible end at 45, loaded at 50, buffer at 5
    // 45 >= 50 - 5 = 45? Yes, so should prefetch
    const shouldPrefetch = prefetchManager.shouldPrefetch(45, 50);
    expect(shouldPrefetch).toBe(true);
  });

  test('should return false when visible end is less than loaded boundary minus buffer', () => {
    // Visible end at 40, loaded at 50, buffer at 5
    // 40 >= 50 - 5 = 45? No, so should not prefetch
    const shouldPrefetch = prefetchManager.shouldPrefetch(40, 50);
    expect(shouldPrefetch).toBe(false);
  });

  test('should update buffer size correctly', () => {
    prefetchManager.updateBufferSize(10); // Larger buffer
    
    // Now with buffer of 10: visible end at 40, loaded at 50
    // 40 >= 50 - 10 = 40? Yes, so should prefetch
    const shouldPrefetch = prefetchManager.shouldPrefetch(40, 50);
    expect(shouldPrefetch).toBe(true);
  });

  test('should handle edge case with zero loaded items', () => {
    const shouldPrefetch = prefetchManager.shouldPrefetch(0, 0);
    // 0 >= 0 - 5 = -5? Yes, so should prefetch
    expect(shouldPrefetch).toBe(true);
  });
});

// Define beforeEach for compatibility
function beforeEach(fn: () => void) {
  fn();
}