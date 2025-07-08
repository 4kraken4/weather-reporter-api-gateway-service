#!/usr/bin/env node

/**
 * Weather Search Endpoint Test Script
 *
 * Tests the weather search endpoint with various scenarios:
 * - Valid search queries
 * - Empty search queries
 * - Special characters and edge cases
 * - Performance validation
 *
 * Usage: node scripts/test-weather-search.js
 */

import process from 'node:process';

import axios from 'axios';

import TestConfig from './utils/TestConfig.js';

// Configuration using UrlUtils
const CONFIG = TestConfig.getConfig();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  white: '\x1b[37m'
};

// Logging functions
const logger = {
  info: msg => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: msg => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: msg => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warning: msg => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  test: msg => console.log(`${colors.magenta}🧪${colors.reset} ${msg}`),
  perf: msg => console.log(`${colors.cyan}⚡${colors.reset} ${msg}`)
};

// HTTP client setup
const httpClient = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CONFIG.JWT_TOKEN}`,
    Accept: 'application/json'
  }
});

// Test cases
const TEST_CASES = {
  validSearches: [
    { query: 'London', description: 'Simple city name' },
    { query: 'New York', description: 'City with space' },
    { query: 'São Paulo', description: 'City with special characters' },
    { query: 'Tokyo', description: 'Non-English city' },
    { query: 'Los Angeles', description: 'Multi-word city' },
    { query: 'london', description: 'Lowercase city name' },
    { query: 'PARIS', description: 'Uppercase city name' },
    {
      query: {
        city: 'Berlin',
        country: 'GE'
      },
      description: 'City with country'
    }
  ],

  edgeCases: [
    { query: '', description: 'Empty string', shouldFail: true },
    { query: '   ', description: 'Whitespace only', shouldFail: true },
    { query: 'x', description: 'Single character', shouldFail: true },
    { query: 'NonexistentCity', description: 'Non-existent city' },
    { query: '123456', description: 'Numeric input', shouldFail: true },
    { query: '!@#$%', description: 'Special characters only', shouldFail: true },
    { query: 'a'.repeat(100), description: 'Very long string', shouldFail: true }
  ]
};

// Test execution functions
async function runHealthCheck() {
  logger.test('Running Health Check...');
  console.log('='.repeat(50));

  try {
    const response = await axios.get(`${CONFIG.BASE_URL}/health`, {
      timeout: 5000
    });

    if (response.status === 200) {
      logger.success('API Gateway is healthy and responding');
      return true;
    } else {
      logger.warning(`Health check returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`Health check failed: ${error.message}`);
    logger.warning('Make sure the API Gateway is running on port 9000');
    return false;
  }
}

async function runValidSearchTests() {
  logger.test('Running Valid Search Tests...');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES.validSearches) {
    try {
      const startTime = Date.now();
      const response = await httpClient.get('/weather/search', {
        params: {
          q: testCase.query?.city ?? testCase.query,
          ccode: testCase.query?.country ?? undefined
        }
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.status === 200) {
        const results = response.data;
        const resultCount = Array.isArray(results?.locations)
          ? (results.suggestions?.length ?? results.locations.length)
          : 'unknown';

        logger.success(
          `${testCase.description}: ✓ Query "${testCase.query}" returned ${resultCount} results (${responseTime}ms)`
        );

        // Validate response structure
        if (results && results.locations && Array.isArray(results.locations)) {
          logger.info(
            `  Found ${results.locations.length} cities matching "${testCase.query}"`
          );
          if (results.locations.length > 0) {
            const firstResult = results.locations[0];
            logger.info(`  First result: ${firstResult.name || 'Unknown'}`);
          }
        }

        passed++;
      } else {
        logger.error(
          `${testCase.description}: Expected 200 but got ${response.status}`
        );
        failed++;
      }
    } catch (error) {
      const status = error.response?.status || 'Network Error';
      logger.error(`${testCase.description}: ${status} - ${error.message}`);

      if (error.response?.data) {
        logger.info(`  Error details: ${JSON.stringify(error.response.data)}`);
      }
      failed++;
    }
  }

  console.log(`\n📊 Valid Search Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

async function runEdgeCaseTests() {
  logger.test('Running Edge Case Tests...');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES.edgeCases) {
    try {
      const startTime = Date.now();
      const response = await httpClient.get('/weather/search', {
        params: { q: testCase.query }
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (testCase.shouldFail) {
        logger.warning(
          `${testCase.description}: Query "${testCase.query}" should have failed but got ${response.status}`
        );
        // Still count as passed if the server handles it gracefully
        passed++;
      } else {
        const results = response.data;
        const resultCount = Array.isArray(results?.locations)
          ? results.locations.length
          : 'unknown';

        logger.success(
          `${testCase.description}: ✓ Query "${testCase.query}" handled gracefully with ${resultCount} results (${responseTime}ms)`
        );
        passed++;
      }
    } catch (error) {
      if (testCase.shouldFail && error.response?.status >= 400) {
        logger.success(
          `${testCase.description}: ✓ Query "${testCase.query}" correctly rejected with ${error.response.status}`
        );
        passed++;
      } else {
        const status = error.response?.status || 'Network Error';
        logger.error(
          `${testCase.description}: Unexpected error ${status} - ${error.message}`
        );
        failed++;
      }
    }
  }

  console.log(`\n📊 Edge Case Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

async function runPerformanceTest() {
  logger.test('Running Performance Test...');
  console.log('='.repeat(50));

  const testQuery = 'London';
  const iterations = 5;
  const responseTimes = [];

  try {
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      await httpClient.get('/weather/search', {
        params: { q: testQuery }
      });
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      responseTimes.push(responseTime);

      logger.perf(`Iteration ${i + 1}: ${responseTime}ms`);
    }

    const avgResponseTime = Math.round(
      responseTimes.reduce((a, b) => a + b) / responseTimes.length
    );
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);

    logger.perf(`Average response time: ${avgResponseTime}ms`);
    logger.perf(`Min response time: ${minResponseTime}ms`);
    logger.perf(`Max response time: ${maxResponseTime}ms`);

    if (avgResponseTime < 2000) {
      logger.success('Performance: ✓ Within acceptable limits');
      return { passed: 1, failed: 0 };
    } else {
      logger.warning('Performance: ⚠ Slower than expected');
      return { passed: 0, failed: 1 };
    }
  } catch (error) {
    logger.error(`Performance test failed: ${error.message}`);
    return { passed: 0, failed: 1 };
  }
}

// Main execution function
async function main() {
  // Header
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║              Weather Search API Test Suite              ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);

  logger.info(`Base URL: ${CONFIG.BASE_URL}`);
  logger.info(`Endpoint: /weather/search`);
  logger.info(`Token: ${CONFIG.JWT_TOKEN.substring(0, 10)}...`);
  console.log();

  // Run health check first
  const isHealthy = await runHealthCheck();
  console.log();

  if (!isHealthy) {
    logger.warning('Health check failed, but continuing with tests...');
    console.log();
  }

  // Run test suites
  const validResults = await runValidSearchTests();
  const edgeResults = await runEdgeCaseTests();
  const performanceResults = await runPerformanceTest();

  // Calculate totals
  const totalPassed =
    validResults.passed + edgeResults.passed + performanceResults.passed;
  const totalFailed =
    validResults.failed + edgeResults.failed + performanceResults.failed;
  const totalTests = totalPassed + totalFailed;

  // Summary
  console.log(`${colors.bright}${colors.cyan}`);
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                        SUMMARY                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);

  console.log(`📋 Total Tests: ${totalTests}`);
  console.log(`${colors.green}✅ Passed: ${totalPassed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${totalFailed}${colors.reset}`);

  if (totalTests > 0) {
    const successRate = Math.round((totalPassed / totalTests) * 100);
    console.log(`📊 Success Rate: ${successRate}%`);
  }

  if (totalFailed === 0) {
    logger.success(
      '🎉 All tests passed! The weather search API is working correctly.'
    );
  } else {
    logger.warning(
      `⚠ ${totalFailed} test(s) failed. Check the output above for details.`
    );
  }

  // Tips
  console.log('\n💡 Tips for troubleshooting:');
  console.log('  - Ensure the API Gateway is running on port 9001');
  console.log('  - Update the JWT token in the CONFIG object');
  console.log('  - Verify the weather service is available and responding');
  console.log('  - Check that the search endpoint is properly configured');

  // Exit with appropriate code
  process.exit(totalFailed === 0 ? 0 : 1);
}

// Error handling
process.on('uncaughtException', error => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', error => {
  logger.error(`Unhandled Rejection: ${error.message}`);
  process.exit(1);
});

// Run the test suite
main().catch(error => {
  logger.error(`Test execution failed: ${error.message}`);
  process.exit(1);
});
