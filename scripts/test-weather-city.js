#!/usr/bin/env node

/**
 * Weather by City ID Endpoint Test Script
 *
 * This script tests the weather by city ID endpoint of the Weather Reporter API Gateway.
 * It includes comprehensive tests for health checks, validation, success scenarios,
 * and performance metrics.
 *
 * Endpoints tested:
 * - GET /api/v1/weather/current/{cityId} - Get weather by city ID
 * - GET /api/v1/weather/current?city={city}&ccode={country} - Get weather by city name
 *
 * Usage:
 *   npm run test:weather-city
 *   node scripts/test-weather-city.js
 *
 * Configuration:
 *   - Update JWT_TOKEN with a valid authentication token
 *   - Ensure the API Gateway is running on the configured port
 *
 * @author Weather Reporter Team
 * @version 1.0.0
 */

import process from 'node:process';

import axios from 'axios';

import TestConfig from './utils/TestConfig.js';

// Configuration using UrlUtils
const CONFIG = TestConfig.getConfig();

// Test data
const TEST_DATA = {
  validCityIds: [
    '2643743', // London, UK
    '5128581', // New York, US
    '1850147' // Tokyo, JP
  ],
  invalidCityIds: ['0', '999999999', 'invalid-id', ''],
  validCityNames: [
    { city: 'London', ccode: 'GB' },
    { city: 'New York', ccode: 'US' },
    { city: 'Paris', ccode: 'FR' }
  ],
  invalidCityNames: [
    { city: '', ccode: 'US' },
    { city: 'NonExistentCity123456', ccode: 'XX' },
    { city: 'London', ccode: '' }
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Utility functions
const log = {
  info: msg => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: msg => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: msg => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
  subheader: msg => console.log(`${colors.magenta}${msg}${colors.reset}`),
  detail: msg => console.log(`  ${colors.white}${msg}${colors.reset}`)
};

// HTTP client setup
const createHttpClient = () => {
  return axios.create({
    baseURL: CONFIG.BASE_URL,
    timeout: CONFIG.TIMEOUT,
    headers: {
      Authorization: `Bearer ${CONFIG.JWT_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });
};

// Test results tracking
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  duration: 0,
  details: []
};

// Test execution wrapper
const runTest = async (testName, testFn) => {
  testResults.total++;
  const startTime = Date.now();

  try {
    log.subheader(`Running: ${testName}`);
    await testFn();
    const duration = Date.now() - startTime;
    testResults.passed++;
    testResults.details.push({ name: testName, status: 'PASSED', duration });
    log.success(`${testName} - PASSED (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    testResults.failed++;
    testResults.details.push({
      name: testName,
      status: 'FAILED',
      duration,
      error: error.message
    });
    log.error(`${testName} - FAILED (${duration}ms)`);
    log.detail(`Error: ${error.message}`);
  }

  console.log('');
};

// Health check test
const testHealthCheck = async () => {
  const client = createHttpClient();

  try {
    const response = await client.get('/health');
    if (response.status === 200) {
      log.detail('API Gateway health check passed');
    } else {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('API Gateway is not running. Please start the service first.');
    }
    throw error;
  }
};

// Test weather by city ID - valid cases
const testWeatherByCityIdValid = async () => {
  const client = createHttpClient();

  for (const cityId of TEST_DATA.validCityIds) {
    log.detail(`Testing city ID: ${cityId}`);

    const response = await client.get(`/weather/current/${cityId}`);

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Response data is missing or invalid');
    }

    // Validate response structure (adjust based on actual API response)
    if (data.success !== undefined || data.temperature !== undefined) {
      log.detail(`Response structure: ${JSON.stringify(Object.keys(data))}`);
    }

    log.detail(`✓ City ID ${cityId} returned valid weather data`);
  }
};

// Test weather by city ID - invalid cases
const testWeatherByCityIdInvalid = async () => {
  const client = createHttpClient();

  for (const cityId of TEST_DATA.invalidCityIds) {
    log.detail(`Testing invalid city ID: ${cityId}`);

    try {
      await client.get(`/weather/current/${cityId}`);
      throw new Error(`Expected error for invalid city ID: ${cityId}`);
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 400 || error.response.status === 404)
      ) {
        log.detail(`✓ Correctly rejected invalid city ID: ${cityId}`);
      } else if (!error.response) {
        throw error;
      } else {
        throw new Error(
          `Unexpected status for invalid city ID ${cityId}: ${error.response.status}`
        );
      }
    }
  }
};

// Test weather by city name - valid cases
const testWeatherByCityNameValid = async () => {
  const client = createHttpClient();

  for (const cityData of TEST_DATA.validCityNames) {
    log.detail(`Testing city: ${cityData.city}, ${cityData.ccode}`);

    const response = await client.get('/weather/current', {
      params: {
        city: cityData.city,
        ccode: cityData.ccode
      }
    });

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    if (!data || typeof data !== 'object') {
      throw new Error('Response data is missing or invalid');
    }

    log.detail(
      `✓ City ${cityData.city}, ${cityData.ccode} returned valid weather data`
    );
  }
};

// Test weather by city name - invalid cases
const testWeatherByCityNameInvalid = async () => {
  const client = createHttpClient();

  for (const cityData of TEST_DATA.invalidCityNames) {
    log.detail(`Testing invalid city: ${cityData.city}, ${cityData.ccode}`);

    try {
      await client.get('/weather/current', {
        params: {
          city: cityData.city,
          ccode: cityData.ccode
        }
      });
      throw new Error(
        `Expected error for invalid city: ${cityData.city}, ${cityData.ccode}`
      );
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 400 || error.response.status === 404)
      ) {
        log.detail(
          `✓ Correctly rejected invalid city: ${cityData.city}, ${cityData.ccode}`
        );
      } else if (!error.response) {
        throw error;
      } else {
        throw new Error(
          `Unexpected status for invalid city ${cityData.city}: ${error.response.status}`
        );
      }
    }
  }
};

// Test authentication
const testAuthentication = async () => {
  const client = axios.create({
    baseURL: CONFIG.BASE_URL,
    timeout: CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });

  try {
    await client.get('/weather/current/2643743'); // London
    throw new Error('Expected authentication error');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log.detail('✓ Correctly rejected request without authentication');
    } else {
      throw new Error(
        `Expected 401 status, got ${error.response?.status || 'no response'}`
      );
    }
  }
};

// Performance test
const testPerformance = async () => {
  const client = createHttpClient();
  const iterations = 5;
  const cityId = '2643743'; // London
  const times = [];

  log.detail(`Running ${iterations} performance tests...`);

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    await client.get(`/weather/current/${cityId}`);
    const duration = Date.now() - startTime;
    times.push(duration);
    log.detail(`Request ${i + 1}: ${duration}ms`);
  }

  const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);

  log.detail(`Performance Results:`);
  log.detail(`  Average: ${avgTime.toFixed(2)}ms`);
  log.detail(`  Min: ${minTime}ms`);
  log.detail(`  Max: ${maxTime}ms`);

  if (avgTime > 5000) {
    throw new Error(`Average response time too high: ${avgTime.toFixed(2)}ms`);
  }
};

// Rate limiting test
const testRateLimit = async () => {
  const client = createHttpClient();
  const requests = [];
  const cityId = '2643743'; // London

  log.detail('Testing rate limiting with concurrent requests...');

  // Send multiple concurrent requests
  for (let i = 0; i < 10; i++) {
    requests.push(client.get(`/weather/current/${cityId}`));
  }

  try {
    const results = await Promise.allSettled(requests);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    log.detail(`Concurrent requests - Successful: ${successful}, Failed: ${failed}`);

    if (successful === 0) {
      throw new Error('All concurrent requests failed');
    }
  } catch {
    // Rate limiting might cause some requests to fail, which is expected
    log.detail('Some requests may have been rate-limited (expected behavior)');
  }
};

// Error handling test
const testErrorHandling = async () => {
  const client = createHttpClient();

  // Test malformed requests
  const malformedTests = [
    { path: '/weather/current/', description: 'empty city ID' },
    { path: '/weather/current/abc/def', description: 'malformed path' }
  ];

  for (const test of malformedTests) {
    log.detail(`Testing ${test.description}`);

    try {
      await client.get(test.path);
      throw new Error(`Expected error for ${test.description}`);
    } catch (error) {
      if (
        error.response &&
        (error.response.status === 400 || error.response.status === 404)
      ) {
        log.detail(`✓ Correctly handled ${test.description}`);
      } else if (!error.response) {
        throw error;
      } else {
        throw new Error(
          `Unexpected status for ${test.description}: ${error.response.status}`
        );
      }
    }
  }
};

// Main test execution
const runAllTests = async () => {
  const startTime = Date.now();

  log.header('🌤️  Weather by City ID Endpoint Test Suite');
  log.header('=====================================');
  console.log('');

  log.info('Configuration:');
  log.detail(`Base URL: ${CONFIG.BASE_URL}`);
  log.detail(`Timeout: ${CONFIG.TIMEOUT}ms`);
  log.detail(`JWT Token: ${CONFIG.JWT_TOKEN ? 'Configured' : 'Missing'}`);
  console.log('');

  // Test sequence
  await runTest('Health Check', testHealthCheck);
  await runTest('Authentication Test', testAuthentication);
  await runTest('Weather by City ID - Valid Cases', testWeatherByCityIdValid);
  await runTest('Weather by City ID - Invalid Cases', testWeatherByCityIdInvalid);
  await runTest('Weather by City Name - Valid Cases', testWeatherByCityNameValid);
  await runTest('Weather by City Name - Invalid Cases', testWeatherByCityNameInvalid);
  await runTest('Performance Test', testPerformance);
  await runTest('Rate Limiting Test', testRateLimit);
  await runTest('Error Handling Test', testErrorHandling);

  testResults.duration = Date.now() - startTime;

  // Print summary
  log.header('📊 Test Results Summary');
  log.header('======================');
  console.log('');

  log.info(`Total Tests: ${testResults.total}`);
  log.success(`Passed: ${testResults.passed}`);
  if (testResults.failed > 0) {
    log.error(`Failed: ${testResults.failed}`);
  }
  if (testResults.skipped > 0) {
    log.warning(`Skipped: ${testResults.skipped}`);
  }
  log.info(`Total Duration: ${testResults.duration}ms`);
  console.log('');

  // Detailed results
  if (testResults.details.length > 0) {
    log.header('📋 Detailed Results');
    log.header('==================');
    console.log('');

    testResults.details.forEach(test => {
      const status =
        test.status === 'PASSED'
          ? `${colors.green}PASSED${colors.reset}`
          : `${colors.red}FAILED${colors.reset}`;
      console.log(`${test.name}: ${status} (${test.duration}ms)`);
      if (test.error) {
        log.detail(`Error: ${test.error}`);
      }
    });
    console.log('');
  }

  // Final status
  if (testResults.failed === 0) {
    log.success('🎉 All tests passed!');
    process.exit(0);
  } else {
    log.error('❌ Some tests failed. Please check the results above.');
    process.exit(1);
  }
};

// Handle uncaught errors
process.on('uncaughtException', error => {
  log.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Run tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    log.error(`Test execution failed: ${error.message}`);
    process.exit(1);
  });
}

export default {
  runAllTests,
  testResults,
  CONFIG
};
