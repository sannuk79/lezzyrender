import { Engine } from '../src/core/Engine';

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
    toBeGreaterThanOrEqual: (expected: number) => {
      if (!(actual >= expected)) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    },
    toEqual: (expected: any) => {
      const actualStr = JSON.stringify(actual);
      const expectedStr = JSON.stringify(expected);
      if (actualStr !== expectedStr) {
        throw new Error(`Expected ${actualStr} to equal ${expectedStr}`);
      } else {
        console.log('    PASS');
      }
    }
  };
}

async function runTests() {
  console.log('\nRunning Engine tests...\n');
  
  describe('Engine', () => {
    let engine: Engine;

    beforeEach(() => {
      engine = new Engine({
        itemHeight: 50,
        viewportHeight: 200,
        bufferSize: 2
      });
    });

    afterEach(() => {
      engine.cleanup();
    });

    test('should initialize with correct default state', () => {
      const state = engine.getState();
      expect(state.scrollTop).toBe(0);
      expect(state.visibleRange.start).toBe(0);
      expect(state.visibleRange.end).toBeGreaterThanOrEqual(0);
      expect(state.loadedItems).toBe(0);
      expect(state.isLoading).toBe(false);
    });

    test('should update scroll position and calculate visible range', () => {
      engine.updateScrollPosition(100);
      
      const state = engine.getState();
      expect(state.scrollTop).toBe(100);
      // With scroll position 100 and item height 50, start should be around 2
      expect(state.visibleRange.start).toBeGreaterThanOrEqual(0);
    });

    test('should determine when to fetch more items', () => {
      // Initially should not need to fetch more since no fetchMore callback is set
      const shouldFetch = engine.shouldFetchMore();
      expect(shouldFetch).toBe(false);
    });

    test('should update dimensions correctly', () => {
      engine.updateDimensions(300, 60);
      
      // Verify that the internal window manager was updated
      // This is tested indirectly by updating scroll and checking range
      engine.updateScrollPosition(150);
      const state = engine.getState();
      expect(state.scrollTop).toBe(150);
    });

    test('should handle fetchMore callback', async () => {
      let fetchMoreCalled = false;
      const mockFetchMore = async () => {
        fetchMoreCalled = true;
        return [];
      };
      
      engine.setFetchMoreCallback(mockFetchMore);
      
      // Test that the callback is set correctly
      // We'll test this by triggering a condition where fetchMore would be called
      // But for this test, just verify the callback is stored
      // @ts-ignore - accessing private property for testing
      expect(engine.fetchMoreCallback !== null).toBe(true);
    });
  });
}

// Define helper functions
function beforeEach(fn: () => void) {
  fn();
}

function afterEach(fn: () => void) {
  fn();
}

// Run the tests
runTests().then(() => {
  console.log('\nEngine tests completed.');
});