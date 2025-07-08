/**
 * Circuit Breaker Health Check and Monitoring Routes
 * Provides observability for circuit breaker status
 */

import express from 'express';

import {
  getCircuitBreakerHealth,
  getCircuitBreakerMetrics
} from '../../../utils/CircuiteBreaker.js';

const router = express.Router();

/**
 * Health check endpoint for circuit breakers
 * GET /health/circuit-breakers
 */
router.get('/circuit-breakers', (req, res) => {
  try {
    const health = getCircuitBreakerHealth();

    // Determine overall health
    const hasOpenCircuits = Object.values(health).some(cb => cb.state === 'OPEN');
    const hasHalfOpenCircuits = Object.values(health).some(
      cb => cb.state === 'HALF_OPEN'
    );

    let status = 'healthy';
    if (hasOpenCircuits) {
      status = 'degraded';
    } else if (hasHalfOpenCircuits) {
      status = 'recovering';
    }

    res.status(status === 'healthy' ? 200 : 503).json({
      status,
      timestamp: new Date().toISOString(),
      circuit_breakers: health,
      summary: {
        total: Object.keys(health).length,
        open: Object.values(health).filter(cb => cb.state === 'OPEN').length,
        half_open: Object.values(health).filter(cb => cb.state === 'HALF_OPEN')
          .length,
        closed: Object.values(health).filter(cb => cb.state === 'CLOSED').length
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve circuit breaker health',
      error: error.message
    });
  }
});

/**
 * Detailed metrics endpoint
 * GET /health/circuit-breakers/metrics
 */
router.get('/circuit-breakers/metrics', (req, res) => {
  try {
    const metrics = getCircuitBreakerMetrics();

    res.json({
      timestamp: new Date().toISOString(),
      metrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve circuit breaker metrics',
      message: error.message
    });
  }
});

/**
 * Prometheus-style metrics endpoint
 * GET /metrics/circuit-breakers
 */
router.get('/prometheus', (req, res) => {
  try {
    const metrics = getCircuitBreakerMetrics();

    let prometheusMetrics = `# HELP circuit_breaker_requests_total Total number of requests through circuit breaker
# TYPE circuit_breaker_requests_total counter
# HELP circuit_breaker_error_rate Error rate for circuit breaker
# TYPE circuit_breaker_error_rate gauge
# HELP circuit_breaker_state Current state of circuit breaker (0=closed, 1=half_open, 2=open)
# TYPE circuit_breaker_state gauge
`;

    Object.entries(metrics).forEach(([service, data]) => {
      let stateValue;
      if (data.state === 'closed') {
        stateValue = 0;
      } else if (data.state === 'half_open') {
        stateValue = 1;
      } else {
        stateValue = 2;
      }

      prometheusMetrics += `circuit_breaker_requests_total{service="${service}",result="total"} ${data.requests_total}
circuit_breaker_requests_total{service="${service}",result="successful"} ${data.requests_successful}
circuit_breaker_requests_total{service="${service}",result="failed"} ${data.requests_failed}
circuit_breaker_requests_total{service="${service}",result="timeout"} ${data.requests_timeout}
circuit_breaker_requests_total{service="${service}",result="rejected"} ${data.requests_rejected}
circuit_breaker_fallbacks_total{service="${service}"} ${data.fallbacks_total}
circuit_breaker_error_rate{service="${service}"} ${data.error_rate}
circuit_breaker_state{service="${service}"} ${stateValue}
`;
    });

    res.set('Content-Type', 'text/plain');
    res.send(prometheusMetrics);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve circuit breaker metrics',
      message: error.message
    });
  }
});

export default router;
