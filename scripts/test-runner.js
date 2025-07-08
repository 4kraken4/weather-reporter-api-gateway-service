#!/usr/bin/env node

/**
 * Test Runner Script
 *
 * This script provides a convenient way to run all weather endpoint tests
 * in a specific order with proper error handling and summary reporting.
 *
 * Usage:
 *   npm run test:runner
 *   node scripts/test-runner.js
 *
 * @author Weather Reporter Team
 * @version 1.0.0
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: msg => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: msg => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: msg => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  warning: msg => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: msg => console.log(`${colors.bright}${colors.blue}${msg}${colors.reset}`),
  subheader: msg => console.log(`${colors.magenta}${msg}${colors.reset}`)
};

// Test configurations
const tests = [
  {
    name: 'Weather Search Endpoint',
    script: 'test-weather-search.js',
    description: 'Tests weather search functionality'
  },
  {
    name: 'Weather by City Endpoint',
    script: 'test-weather-city.js',
    description: 'Tests weather by city ID and name endpoints'
  },
  {
    name: 'Bulk Weather Endpoint',
    script: 'test-bulk-weather.js',
    description: 'Tests bulk weather retrieval functionality'
  }
];

// Results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  details: []
};

// Run a single test script
const runTest = test => {
  return new Promise(resolve => {
    const startTime = Date.now();
    log.subheader(`Running: ${test.name}`);
    log.info(test.description);

    const scriptPath = join(__dirname, test.script);
    const childProcess = spawn('node', [scriptPath], {
      stdio: 'pipe',
      shell: true
    });

    let _output = '';
    let _errorOutput = '';

    childProcess.stdout.on('data', data => {
      const chunk = data.toString();
      _output += chunk;
      process.stdout.write(chunk);
    });

    childProcess.stderr.on('data', data => {
      const chunk = data.toString();
      _errorOutput += chunk;
      process.stderr.write(chunk);
    });

    childProcess.on('close', code => {
      const duration = Date.now() - startTime;
      const result = {
        name: test.name,
        script: test.script,
        exitCode: code,
        duration,
        success: code === 0
      };

      results.total++;
      if (code === 0) {
        results.passed++;
        log.success(`${test.name} completed successfully (${duration}ms)`);
      } else {
        results.failed++;
        log.error(`${test.name} failed with exit code ${code} (${duration}ms)`);
      }

      results.details.push(result);
      console.log('');
      resolve(result);
    });

    childProcess.on('error', error => {
      const duration = Date.now() - startTime;
      results.total++;
      results.failed++;

      const result = {
        name: test.name,
        script: test.script,
        exitCode: -1,
        duration,
        success: false,
        error: error.message
      };

      results.details.push(result);
      log.error(`Failed to run ${test.name}: ${error.message}`);
      console.log('');
      resolve(result);
    });
  });
};

// Run all tests sequentially
const runAllTests = async () => {
  const overallStartTime = Date.now();

  log.header('🧪 Weather Endpoint Test Runner');
  log.header('===============================');
  console.log('');

  log.info('Running all weather endpoint tests in sequence...');
  console.log('');

  // Run tests sequentially
  for (const test of tests) {
    await runTest(test);
    // Add a small delay between tests
    await new Promise(resolve => {
      setTimeout(resolve, 1000);
    });
  }

  const totalDuration = Date.now() - overallStartTime;

  // Print summary
  log.header('📊 Test Runner Summary');
  log.header('=====================');
  console.log('');

  log.info(`Total Tests: ${results.total}`);
  log.success(`Passed: ${results.passed}`);
  if (results.failed > 0) {
    log.error(`Failed: ${results.failed}`);
  }
  log.info(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('');

  // Detailed results
  if (results.details.length > 0) {
    log.header('📋 Detailed Results');
    log.header('==================');
    console.log('');

    results.details.forEach(result => {
      const status = result.success
        ? `${colors.green}PASSED${colors.reset}`
        : `${colors.red}FAILED${colors.reset}`;

      console.log(`${result.name}: ${status} (${result.duration}ms)`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      if (result.exitCode !== 0 && result.exitCode !== -1) {
        console.log(`  Exit Code: ${result.exitCode}`);
      }
    });
    console.log('');
  }

  // Final status
  if (results.failed === 0) {
    log.success('🎉 All weather endpoint tests passed!');
    log.info('All weather API endpoints are functioning correctly.');
    process.exit(0);
  } else {
    log.error('❌ Some tests failed. Please check the results above.');
    log.warning('Review failed tests and fix any issues before proceeding.');
    process.exit(1);
  }
};

// Handle process termination
process.on('SIGINT', () => {
  log.warning('Test runner interrupted by user');
  process.exit(130);
});

process.on('SIGTERM', () => {
  log.warning('Test runner terminated');
  process.exit(143);
});

// Run the test suite
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    log.error(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

export default {
  runAllTests,
  runTest,
  tests,
  results
};
