/* eslint-disable no-console */
import CircuitBreaker from 'opossum';

import Config from '../config/Config.js';

const breakerInstances = {};
Object.keys(Config.getInstance().services).forEach(service => {
  breakerInstances[service] = null;
});

export function getCircuitBreakerInstance(action = null, service) {
  if (service) {
    const serviceLabel = service.charAt(0).toUpperCase() + service.slice(1);
    if (!breakerInstances[service]) {
      const options = {
        errorThresholdPercentage: 80,
        timeout: 4000,
        resetTimeout: 10000,
        rollingCountTimeout: 10000,
        rollingCountBuckets: 10,
        name: service,
        errorFilter: error => {
          const err = !error?.response ? error?.code : error?.response?.status;
          if (
            err === 'ECONNABORTED' ||
            err === 'ECONNREFUSED' ||
            err === 'EOPENBREAKER' ||
            err >= 500 ||
            err === 429
          ) {
            return false;
          }
          return true;
        }
      };
      breakerInstances[service] = new CircuitBreaker(action, options);

      breakerInstances[service].on('open', () => {
        console.log(
          `${serviceLabel} Circuit breaker is open, requests are being blocked.`
        );
      });

      breakerInstances[service].on('halfOpen', () => {
        console.log(
          `${serviceLabel} Circuit breaker is half-open, requests are being tested.`
        );
      });

      breakerInstances[service].on('close', () => {
        console.log(
          `${serviceLabel} Circuit breaker is closed, requests are allowed.`
        );
      });

      breakerInstances[service].on('fire', () => {
        if (breakerInstances[service].opened) {
          throw new Error('CircuitBreakerOpenError');
        }
      });

      breakerInstances[service].on('failure', error => {
        const errorResponse =
          error?.response?.data?.error?.error ||
          error?.response?.data?.error ||
          error.code;
        const finalError = errorResponse || error;
        console.error(`${serviceLabel} Circuit breaker failure:`, finalError);
      });
    }

    breakerInstances[service].action = action
      ? action
      : breakerInstances[service].action;
    return breakerInstances[service];
  } else {
    throw new Error('Service name is required to get a circuit breaker instance.');
  }
}
