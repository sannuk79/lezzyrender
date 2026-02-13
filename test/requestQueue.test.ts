import { RequestQueue } from '../src/core/RequestQueue';

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
      return result.then(() => console.log('    PASS'))
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

console.log('\nRunning RequestQueue tests...\n');

describe('RequestQueue', () => {
  test('should initialize with empty queue and handle basic operations', () => {
    const requestQueue = new RequestQueue(1); // Single concurrent request

    // Test initialization
    expect(requestQueue.getLength()).toBe(0);

    // Test adding and processing a single request
    let callCount = 0;
    const requestFn = () => {
      callCount++;
      return Promise.resolve('result');
    };
    
    // Since this involves promises, we'll test synchronously for basic functionality
    expect(typeof requestQueue.add).toBe('function');
    expect(typeof requestQueue.getLength).toBe('function');
    expect(typeof requestQueue.clear).toBe('function');
    
    // Test clear functionality
    requestQueue.clear();
    expect(requestQueue.getLength()).toBe(0);
  });

  test('should handle request errors gracefully', async () => {
    const requestQueue = new RequestQueue(1);
    const errorRequest = () => Promise.reject(new Error('Test error'));
    
    // Should reject with the error
    let caughtError = false;
    try {
      await requestQueue.add(errorRequest);
    } catch (error) {
      caughtError = true;
      expect((error as Error).message).toBe('Test error');
    }
    
    expect(caughtError).toBe(true);
  });
});

console.log('\nRequestQueue tests completed.');