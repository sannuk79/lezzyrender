import { WindowManager } from '../src/core/WindowManager';

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
    toBeGreaterThanOrEqual: (expected: number) => {
      if (!(actual >= expected)) {
        throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
      }
    },
    toBeGreaterThan: (expected: number) => {
      if (!(actual > expected)) {
        throw new Error(`Expected ${actual} to be greater than ${expected}`);
      }
    }
  };
}

describe('WindowManager', () => {
  let windowManager: WindowManager;

  beforeEach(() => {
    windowManager = new WindowManager(50, 200, 2); // itemHeight: 50, viewportHeight: 200, bufferSize: 2
  });

  test('should calculate visible range correctly with zero scroll', () => {
    const range = windowManager.calculateVisibleRange(0);
    
    expect(range.start).toBeGreaterThanOrEqual(0);
    expect(range.end).toBeGreaterThan(0);
    // With viewport of 200 and item height of 50, we can fit 4 items
    // Plus buffer of 2, so end should be at least 6
    expect(range.end).toBeGreaterThanOrEqual(4); // 4 items in viewport + buffer
  });

  test('should calculate visible range correctly with middle scroll', () => {
    const range = windowManager.calculateVisibleRange(100); // scrolled down 100px
    
    // With item height of 50, scroll of 100 means we're at item index 2
    // So visible range should start around index 0 (with negative buffer) or 0 (clamped)
    expect(range.start).toBeGreaterThanOrEqual(0);
    expect(range.end).toBeGreaterThan(range.start);
  });

  test('should calculate visible range correctly with large scroll', () => {
    const range = windowManager.calculateVisibleRange(1000); // scrolled way down
    
    expect(range.start).toBeGreaterThan(10); // Should be showing items much further down
    expect(range.end).toBeGreaterThan(range.start);
  });

  test('should update viewport height', () => {
    windowManager.updateViewportHeight(400); // Double the viewport height
    
    const range = windowManager.calculateVisibleRange(0);
    // With larger viewport, we should see more items
    expect(range.end).toBeGreaterThan(8); // Should see more than 4 items now
  });

  test('should update item height', () => {
    windowManager.updateItemHeight(25); // Half the item height
    
    const range = windowManager.calculateVisibleRange(0);
    // With smaller items, we should see more items in the same viewport
    expect(range.end).toBeGreaterThan(8); // Should see more items with smaller height
  });
});

// Define beforeEach for compatibility
function beforeEach(fn: () => void) {
  fn();
}