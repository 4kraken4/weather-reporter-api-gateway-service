import { jest } from '@jest/globals';

// Mock axios to prevent actual HTTP requests
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(() => Promise.resolve({ data: 'mocked' })),
    post: jest.fn(() => Promise.resolve({ data: 'mocked' })),
    put: jest.fn(() => Promise.resolve({ data: 'mocked' })),
    delete: jest.fn(() => Promise.resolve({ data: 'mocked' }))
  };

  const mockAxios = {
    create: jest.fn(() => mockAxiosInstance)
  };

  return {
    default: mockAxios,
    __esModule: true
  };
});

// Mock retry module
jest.mock('retry', () => {
  const mockOperation = {
    attempt: jest.fn((fn) => {
      try {
        const result = fn();
        if (result && typeof result.then === 'function') {
          return result;
        }
        return Promise.resolve(result);
      } catch (error) {
        return Promise.reject(error);
      }
    })
  };

  const mockRetry = {
    operation: jest.fn(() => mockOperation)
  };

  return {
    default: mockRetry,
    __esModule: true
  };
});

/**
 * Basic HttpClient Test Suite
 * 
 * This test suite covers the basic functionality of the HttpClient class.
 * All HTTP requests are mocked to prevent actual network calls.
 */

describe('HttpClient - Basic Functionality', () => {
  let HttpClient;

  beforeAll(async () => {
    HttpClient = (await import('../../../src/interfaces/http/HttpClient.js')).default;
  });

  describe('Class Structure', () => {
    it('should be a class that can be instantiated', () => {
      expect(typeof HttpClient).toBe('function');
      expect(HttpClient.prototype.constructor).toBe(HttpClient);
    });

    it('should have expected method signatures', () => {
      const instance = new HttpClient('http://test.com');

      expect(typeof instance.get).toBe('function');
      expect(typeof instance.post).toBe('function');
      expect(typeof instance.put).toBe('function');
      expect(typeof instance.delete).toBe('function');
      expect(typeof instance.retryOperation).toBe('function');
    });

    it('should store baseURL configuration', () => {
      const baseURL = 'http://localhost:8080';
      const instance = new HttpClient(baseURL);

      // The client should be created (even if axios is not mocked, the structure should be there)
      expect(instance.client).toBeDefined();
    });
  });

  describe('HTTP Method Signatures', () => {
    let httpClient;

    beforeEach(() => {
      httpClient = new HttpClient('http://test.com');
    });

    it('should accept correct parameters for GET', async () => {
      expect(() => {
        httpClient.get('/test', { headers: { 'Accept': 'application/json' } });
      }).not.toThrow();
    });

    it('should accept correct parameters for POST', async () => {
      expect(() => {
        httpClient.post('/test', { data: 'test' }, { headers: { 'Content-Type': 'application/json' } });
      }).not.toThrow();
    });

    it('should accept correct parameters for PUT', async () => {
      expect(() => {
        httpClient.put('/test/1', { data: 'updated' });
      }).not.toThrow();
    });

    it('should accept correct parameters for DELETE', async () => {
      expect(() => {
        httpClient.delete('/test/1');
      }).not.toThrow();
    });
  });

  describe('Retry Operation Method', () => {
    let httpClient;

    beforeEach(() => {
      httpClient = new HttpClient('http://test.com');
    });

    it('should accept a function as the first parameter', () => {
      const mockFunction = jest.fn();

      expect(() => {
        httpClient.retryOperation(mockFunction);
      }).not.toThrow();
    });

    it('should accept optional options parameter', () => {
      const mockFunction = jest.fn();
      const options = { retries: 3, factor: 2, minTimeout: 1000 };

      expect(() => {
        httpClient.retryOperation(mockFunction, options);
      }).not.toThrow();
    });
  });
});
