import injectGrants from '../../../src/infrastructure/middleware/injectGrants.js';

describe('InjectGrants Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = {};
    mockRes = {};
    mockNext = jest.fn();
  });

  describe('Basic Functionality', () => {
    it('should be a function that returns a middleware function', () => {
      expect(typeof injectGrants).toBe('function');

      const middleware = injectGrants('testResource', 'testAction');
      expect(typeof middleware).toBe('function');
    });

    it('should return an async function', () => {
      const middleware = injectGrants('testResource', 'testAction');
      expect(middleware).toBeInstanceOf(Function);
      expect(middleware.constructor).toBe((async () => { }).constructor);
    });
  });

  describe('Meta Data Injection', () => {
    it('should inject resource and action into request meta', async () => {
      const resource = 'weather';
      const action = 'read';

      const middleware = injectGrants(resource, action);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: 'weather',
        action: 'read'
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle string resource and action parameters', async () => {
      const middleware = injectGrants('users', 'create');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: 'users',
        action: 'create'
      });
    });

    it('should handle different resource and action combinations', async () => {
      const testCases = [
        { resource: 'weather', action: 'read' },
        { resource: 'weather', action: 'write' },
        { resource: 'users', action: 'create' },
        { resource: 'users', action: 'delete' },
        { resource: 'reports', action: 'generate' }
      ];

      for (const testCase of testCases) {
        const middleware = injectGrants(testCase.resource, testCase.action);
        const req = {};

        await middleware(req, mockRes, mockNext);

        expect(req.meta).toEqual({
          resource: testCase.resource,
          action: testCase.action
        });
      }
    });
  });

  describe('Parameter Handling', () => {
    it('should handle undefined resource parameter', async () => {
      const middleware = injectGrants(undefined, 'testAction');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: undefined,
        action: 'testAction'
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle undefined action parameter', async () => {
      const middleware = injectGrants('testResource', undefined);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: 'testResource',
        action: undefined
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle null parameters', async () => {
      const middleware = injectGrants(null, null);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: null,
        action: null
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle empty string parameters', async () => {
      const middleware = injectGrants('', '');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: '',
        action: ''
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle numeric parameters', async () => {
      const middleware = injectGrants(123, 456);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: 123,
        action: 456
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle boolean parameters', async () => {
      const middleware = injectGrants(true, false);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: true,
        action: false
      });
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle object parameters', async () => {
      const resourceObj = { type: 'weather', id: 123 };
      const actionObj = { operation: 'read', level: 'public' };

      const middleware = injectGrants(resourceObj, actionObj);
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: resourceObj,
        action: actionObj
      });
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('Request State Management', () => {
    it('should not overwrite existing request properties', async () => {
      mockReq.existingProperty = 'existingValue';
      mockReq.id = 'request123';

      const middleware = injectGrants('weather', 'read');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.existingProperty).toBe('existingValue');
      expect(mockReq.id).toBe('request123');
      expect(mockReq.meta).toEqual({
        resource: 'weather',
        action: 'read'
      });
    });

    it('should overwrite existing meta property', async () => {
      mockReq.meta = { oldResource: 'old', oldAction: 'old' };

      const middleware = injectGrants('weather', 'read');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: 'weather',
        action: 'read'
      });
      expect(mockReq.meta.oldResource).toBeUndefined();
      expect(mockReq.meta.oldAction).toBeUndefined();
    });

    it('should preserve other request properties when meta exists', async () => {
      mockReq.meta = { oldData: 'preserve' };
      mockReq.user = { id: 123 };

      const middleware = injectGrants('weather', 'read');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: 'weather',
        action: 'read'
      });
      expect(mockReq.user).toEqual({ id: 123 });
    });
  });

  describe('Middleware Chain Integration', () => {
    it('should call next function once', async () => {
      const middleware = injectGrants('weather', 'read');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should not call next with any arguments', async () => {
      const middleware = injectGrants('weather', 'read');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should work in middleware chain', async () => {
      const middleware1 = injectGrants('weather', 'read');
      const middleware2 = injectGrants('user', 'authenticate');

      const next1 = jest.fn();
      const next2 = jest.fn();

      await middleware1(mockReq, mockRes, next1);
      expect(mockReq.meta).toEqual({ resource: 'weather', action: 'read' });
      expect(next1).toHaveBeenCalled();

      await middleware2(mockReq, mockRes, next2);
      expect(mockReq.meta).toEqual({ resource: 'user', action: 'authenticate' });
      expect(next2).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should not throw errors with valid parameters', async () => {
      const middleware = injectGrants('weather', 'read');

      await expect(middleware(mockReq, mockRes, mockNext)).resolves.not.toThrow();
    });

    it('should not throw errors with undefined parameters', async () => {
      const middleware = injectGrants(undefined, undefined);

      await expect(middleware(mockReq, mockRes, mockNext)).resolves.not.toThrow();
    });

    it('should handle errors in next function gracefully', async () => {
      mockNext.mockImplementation(() => {
        throw new Error('Next function error');
      });

      const middleware = injectGrants('weather', 'read');

      await expect(middleware(mockReq, mockRes, mockNext)).rejects.toThrow('Next function error');
      expect(mockReq.meta).toEqual({ resource: 'weather', action: 'read' });
    });
  });

  describe('Function Signature and Type Safety', () => {
    it('should accept exactly three parameters in returned middleware', async () => {
      const middleware = injectGrants('weather', 'read');
      expect(middleware.length).toBe(3); // req, res, next
    });

    it('should work with different request object types', async () => {
      const customReq = {
        method: 'GET',
        url: '/weather',
        headers: {},
        body: null
      };

      const middleware = injectGrants('weather', 'read');
      await middleware(customReq, mockRes, mockNext);

      expect(customReq.meta).toEqual({
        resource: 'weather',
        action: 'read'
      });
      expect(customReq.method).toBe('GET');
      expect(customReq.url).toBe('/weather');
    });
  });

  describe('Real-world Use Cases', () => {
    it('should handle weather service grants', async () => {
      const middleware = injectGrants('weather', 'read');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: 'weather',
        action: 'read'
      });
    });

    it('should handle user management grants', async () => {
      const middleware = injectGrants('user', 'manage');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: 'user',
        action: 'manage'
      });
    });

    it('should handle admin grants', async () => {
      const middleware = injectGrants('admin', 'full-access');
      await middleware(mockReq, mockRes, mockNext);

      expect(mockReq.meta).toEqual({
        resource: 'admin',
        action: 'full-access'
      });
    });

    it('should handle API endpoint specific grants', async () => {
      const testCases = [
        { resource: 'weather-search', action: 'execute' },
        { resource: 'weather-bulk', action: 'process' },
        { resource: 'user-profile', action: 'update' },
        { resource: 'system-health', action: 'monitor' }
      ];

      for (const testCase of testCases) {
        const middleware = injectGrants(testCase.resource, testCase.action);
        const req = {};

        await middleware(req, mockRes, mockNext);

        expect(req.meta).toEqual({
          resource: testCase.resource,
          action: testCase.action
        });
      }
    });
  });
});
