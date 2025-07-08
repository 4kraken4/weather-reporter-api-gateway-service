import { afterAll, beforeAll, jest } from '@jest/globals';

global.jest = jest;
global.beforeAll = beforeAll;
global.afterAll = afterAll;

// Global test setup and teardown
beforeAll(() => {
  // Set test environment variable
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Clean up any global timers or intervals
  jest.clearAllTimers();
  jest.useRealTimers();

  // Wait a bit for any pending operations to complete
  await new Promise(resolve => {
    setTimeout(resolve, 100);
  });

  // Force garbage collection if available

  if (global.gc) {
    global.gc();
  }
});
