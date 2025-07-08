import authenticate from '../../../src/infrastructure/middleware/authenticate.js';

// Mock dependencies
jest.mock('../../../src/config/Config.js');
jest.mock('../../../src/utils/CircuiteBreaker.js');

describe('Authenticate Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      header: jest.fn(),
      meta: undefined
    };

    // Mock response object
    mockRes = {};

    // Mock next function
    mockNext = jest.fn();
  });

  describe('No-op Authentication (Bypassed)', () => {
    it('should call next without error when authentication is bypassed', async () => {
      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.meta.authBypassed).toBe(true);
    });

    it('should add meta property if it does not exist', async () => {
      await authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toBeDefined();
      expect(mockReq.meta.authBypassed).toBe(true);
    });

    it('should preserve existing meta properties', async () => {
      mockReq.meta = { existingProperty: 'value' };

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockReq.meta.existingProperty).toBe('value');
      expect(mockReq.meta.authBypassed).toBe(true);
    });

    it('should not call next with any error', async () => {
      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should not require Authorization header', async () => {
      mockReq.header.mockReturnValue(undefined);

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.meta.authBypassed).toBe(true);
    });

    it('should handle requests with Authorization header', async () => {
      mockReq.header.mockReturnValue('Bearer token123');

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.meta.authBypassed).toBe(true);
    });

    it('should handle requests with invalid Authorization header', async () => {
      mockReq.header.mockReturnValue('InvalidFormat');

      await authenticate(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.meta.authBypassed).toBe(true);
    });

    it('should work with async/await pattern', async () => {
      const result = authenticate(mockReq, mockRes, mockNext);
      expect(result).toBeInstanceOf(Promise);

      await result;

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockReq.meta.authBypassed).toBe(true);
    });
  });

  describe('Integration with other middleware', () => {
    it('should work correctly in middleware chain', async () => {
      const middleware1 = jest.fn((req, res, next) => {
        req.step1 = true;
        next();
      });

      const middleware3 = jest.fn((req, res, next) => {
        req.step3 = true;
        next();
      });

      // Simulate middleware chain
      await new Promise((resolve) => {
        const nextStep2 = () => {
          middleware3(mockReq, mockRes, resolve);
        };

        const nextStep1 = () => {
          authenticate(mockReq, mockRes, nextStep2);
        };

        middleware1(mockReq, mockRes, nextStep1);
      });

      expect(mockReq.step1).toBe(true);
      expect(mockReq.meta.authBypassed).toBe(true);
      expect(mockReq.step3).toBe(true);
    });
  });
});
