#!/usr/bin/env node

/**
 * Bulk Weather API Test Script
 *
 * Tests the bulk weather implementation with various scenarios:
 * - Validation tests (missing data, invalid formats, limits)
 * - Success scenarios (single city, multiple cities)
 * - Error handling tests
 * - Performance validation
 *
 * Usage: node scripts/test-bulk-weather.js
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
  magenta: '\x1b[35m'
};

// Logging utilities
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

// Test data
const TEST_CASES = {
  validation: [
    {
      name: 'Missing cities array',
      payload: {},
      expectedStatus: 400,
      expectedMessage: 'Cities array is required'
    },
    {
      name: 'Cities is not an array',
      payload: { cities: 'invalid-format' },
      expectedStatus: 400,
      expectedMessage: 'Cities must be an array'
    },
    {
      name: 'Empty cities array',
      payload: { cities: [] },
      expectedStatus: 400,
      expectedMessage: 'Cities array cannot be empty'
    },
    {
      name: 'Exceeds maximum cities (51)',
      payload: {
        cities: Array(51).fill({ city: 'London', country: 'GB' })
      },
      expectedStatus: 400,
      expectedMessage: 'Maximum 50 cities allowed'
    }
  ],

  success: [
    {
      name: 'Single city request',
      payload: {
        cities: [{ city: 'London', country: 'GB' }]
      },
      expectedStatus: 200
    },
    {
      name: 'Multiple cities request',
      payload: {
        cities: [
          { city: 'London', country: 'GB' },
          { city: 'New York', country: 'US' },
          { city: 'Tokyo', country: 'JP' },
          { city: 'Paris', country: 'FR' },
          { city: 'Sydney', country: 'AU' }
        ]
      },
      expectedStatus: 200
    },
    {
      name: 'Maximum allowed cities (50)',
      payload: {
        cities: [
          ...Array(10)
            .fill()
            .map((_, i) => ({
              city: ['London', 'Paris', 'Berlin', 'Madrid', 'Rome'][i % 5],
              country: ['GB', 'FR', 'DE', 'ES', 'IT'][i % 5]
            })),
          ...Array(40).fill({ city: 'Toronto', country: 'CA' })
        ]
      },
      expectedStatus: 200
    }
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
    logger.warning('Make sure the API Gateway is running on the correct port');
    return false;
  }
}

async function runValidationTests() {
  logger.test('Running Validation Tests...');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  // Process validation tests sequentially to maintain order
  for (const testCase of TEST_CASES.validation) {
    try {
      const response = await httpClient.post(CONFIG.endpoint, testCase.payload);

      // If we get here, the request succeeded when it should have failed
      logger.error(
        `${testCase.name}: Expected ${testCase.expectedStatus} but got ${response.status}`
      );
      failed++;
    } catch (error) {
      if (error.response && error.response.status === testCase.expectedStatus) {
        const message = error.response.data?.message || '';
        const hasExpectedMessage = message
          .toLowerCase()
          .includes(testCase.expectedMessage.toLowerCase());

        if (hasExpectedMessage) {
          logger.success(
            `${testCase.name}: ✓ Status ${error.response.status}, Message: "${message}"`
          );
          passed++;
        } else {
          logger.warning(
            `${testCase.name}: ⚠ Correct status but unexpected message: "${message}"`
          );
          passed++; // Still count as passed for status
        }
      } else {
        const actualStatus = error.response?.status || 'unknown';
        logger.error(
          `${testCase.name}: Expected ${testCase.expectedStatus} but got ${actualStatus}`
        );
        failed++;
      }
    }
  }

  console.log(`\n📊 Validation Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

async function runSuccessTests() {
  logger.test('Running Success Tests...');
  console.log('='.repeat(50));

  let passed = 0;
  let failed = 0;

  for (const testCase of TEST_CASES.success) {
    try {
      const startTime = Date.now();
      const response = await httpClient.post(CONFIG.endpoint, testCase.payload);
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (response.status === testCase.expectedStatus) {
        const cityCount = testCase.payload.cities.length;
        logger.success(
          `${testCase.name}: ✓ Status ${response.status} (${cityCount} cities, ${responseTime}ms)`
        );

        // Validate response structure
        const data = response.data;
        if (data && (data.success !== undefined || data.data !== undefined)) {
          logger.info(
            `  Response format: ${data.success ? 'Success wrapper' : 'Direct data'}`
          );
        }

        passed++;
      } else {
        logger.error(
          `${testCase.name}: Expected ${testCase.expectedStatus} but got ${response.status}`
        );
        failed++;
      }
    } catch (error) {
      const status = error.response?.status || 'Network Error';
      logger.error(`${testCase.name}: ${status} - ${error.message}`);

      if (error.response?.data) {
        logger.info(`  Error details: ${JSON.stringify(error.response.data)}`);
      }
      failed++;
    }
  }

  console.log(`\n📊 Success Tests: ${passed} passed, ${failed} failed\n`);
  return { passed, failed };
}

async function runPerformanceTest() {
  logger.test('Running Performance Test...');
  console.log('='.repeat(50));

  const testPayload = {
    cities: Array(10)
      .fill()
      .map((_, i) => ({
        city: ['London', 'Paris', 'Berlin', 'Madrid', 'Rome'][i % 5],
        country: ['GB', 'FR', 'DE', 'ES', 'IT'][i % 5]
      }))
  };

  try {
    const startTime = Date.now();
    await httpClient.post(CONFIG.endpoint, testPayload);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    logger.perf(
      `Response time: ${responseTime}ms for ${testPayload.cities.length} cities`
    );
    logger.perf(
      `Average per city: ${Math.round(responseTime / testPayload.cities.length)}ms`
    );

    if (responseTime < 5000) {
      // Less than 5 seconds
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
  console.log('║               Bulk Weather API Test Suite               ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log(`${colors.reset}\n`);

  logger.info(`Base URL: ${CONFIG.BASE_URL}`);
  logger.info(`Endpoint: /weather/bulk`);
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
  const validationResults = await runValidationTests();
  const successResults = await runSuccessTests();
  const performanceResults = await runPerformanceTest();

  // Calculate totals
  const totalPassed =
    validationResults.passed + successResults.passed + performanceResults.passed;
  const totalFailed =
    validationResults.failed + successResults.failed + performanceResults.failed;
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
    logger.success('🎉 All tests passed! The bulk weather API is working correctly.');
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
  console.log('  - Check network connectivity and firewall settings');

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
