# URL Utilities Implementation Guide

This document provides a comprehensive guide to the URL utilities implementation in the Weather Reporter API Gateway service.

## Overview

The `UrlUtils` class provides a standardized way to construct, validate, and manipulate URLs across all proxy services. This ensures consistency, security, and maintainability.

## Features

### 🔧 Core Features

- **Consistent URL Construction**: Standardized base URL building for all services
- **Environment-Aware**: Different behavior for development vs production
- **Query Parameter Handling**: Safe handling of query parameters with null/undefined filtering
- **Path Sanitization**: Automatic path cleaning and validation
- **URL Parsing**: Comprehensive URL parsing with validation
- **Security**: URL sanitization for logging to prevent information disclosure

## API Reference

### `buildServiceBaseUrl(serviceConfig, includeName = true)`

Constructs a base URL for a microservice.

**Parameters:**

- `serviceConfig` (Object): Service configuration with protocol, host, port, routePrefix, name
- `includeName` (boolean): Whether to include service name in the URL path

**Returns:** String - Complete base URL

**Examples:**

```javascript
// Development environment
const config = {
  protocol: 'http',
  host: 'localhost',
  port: 8080,
  routePrefix: 'api/v1',
  name: 'weather'
};

// Returns: http://localhost:8080/api/v1/weather
UrlUtils.buildServiceBaseUrl(config, true);

// Production environment (NODE_ENV=production)
// Returns: http://localhost/api/v1/weather
UrlUtils.buildServiceBaseUrl(config, true);
```

### `buildEndpointUrl(baseUrl, endpoint, params = null)`

Constructs a complete URL for a specific endpoint with query parameters.

**Parameters:**

- `baseUrl` (string): The base service URL
- `endpoint` (string): The endpoint path (e.g., '/search', '/current/123')
- `params` (Object): Optional query parameters

**Returns:** String - Complete URL with query parameters

**Examples:**

```javascript
const baseUrl = 'http://localhost:8080/api/v1/weather';

// Returns: http://localhost:8080/api/v1/weather/search?city=London&units=metric
UrlUtils.buildEndpointUrl(baseUrl, '/search', {
  city: 'London',
  units: 'metric',
  nullParam: null // This will be filtered out
});
```

### `sanitizeEndpoint(endpoint)`

Validates and sanitizes endpoint paths.

**Parameters:**

- `endpoint` (string): The endpoint path to sanitize

**Returns:** String - Sanitized endpoint path

**Examples:**

```javascript
// Returns: /search
UrlUtils.sanitizeEndpoint('search');

// Returns: /search/cities/
UrlUtils.sanitizeEndpoint('//search///cities//');
```

### `parseUrl(urlString)`

Parses a URL string and extracts components.

**Parameters:**

- `urlString` (string): URL to parse

**Returns:** Object - Parsed URL components or error information

**Example:**

```javascript
const result = UrlUtils.parseUrl('https://api.example.com:8080/v1/search?city=London');
// Returns:
{
  isValid: true,
  protocol: 'https:',
  hostname: 'api.example.com',
  port: '8080',
  pathname: '/v1/search',
  searchParams: { city: 'London' }
}
```

### `joinPath(...segments)`

Safely joins URL path segments.

**Parameters:**

- `...segments` (string[]): Path segments to join

**Returns:** String - Joined path

**Example:**

```javascript
// Returns: api/v1/weather/search
UrlUtils.joinPath('api', 'v1', 'weather', 'search');
```

### `sanitizeUrlForLogging(urlString)`

Removes sensitive information from URLs for safe logging.

**Parameters:**

- `urlString` (string): URL to sanitize

**Returns:** String - Sanitized URL safe for logging

**Example:**

```javascript
const url = 'https://api.example.com/search?city=London&token=secret123';
// Returns: https://api.example.com/search?city=London&token=[REDACTED]
UrlUtils.sanitizeUrlForLogging(url);
```

## Proxy Implementation

### WeatherProxy

The `WeatherProxy` has been updated to use `UrlUtils` for all URL construction:

```javascript
export default class WeatherProxy {
  static getBaseUrl() {
    return UrlUtils.buildServiceBaseUrl(WeatherProxy.services.weather, true);
  }

  static buildEndpointUrl(endpoint, params = null) {
    return UrlUtils.buildEndpointUrl(WeatherProxy.getBaseUrl(), endpoint, params);
  }

  static httpClient = new HttpClient(WeatherProxy.getBaseUrl());
}
```

### AuthProxy

Similarly, `AuthProxy` uses the same pattern:

```javascript
export default class AuthProxy {
  static getBaseUrl() {
    return UrlUtils.buildServiceBaseUrl(AuthProxy.services.authentication, false);
  }

  static buildEndpointUrl(endpoint, params = null) {
    return UrlUtils.buildEndpointUrl(AuthProxy.getBaseUrl(), endpoint, params);
  }

  static httpClient = new HttpClient(AuthProxy.getBaseUrl());
}
```

## Benefits

### 🔒 Security

- **Information Disclosure Prevention**: Sensitive URL parameters are redacted in logs
- **Path Validation**: Prevents malformed URLs from being constructed
- **Input Sanitization**: All URL components are properly sanitized

### 🚀 Performance

- **Efficient URL Construction**: Uses native URL constructor for optimal performance
- **Caching**: Base URLs can be cached for repeated use
- **Memory Efficient**: No string concatenation pitfalls

### 🛠️ Maintainability

- **Centralized Logic**: All URL construction logic in one place
- **Consistent API**: Same methods across all proxy services
- **Easy Testing**: Comprehensive test coverage for all utility functions

### 🌐 Environment Support

- **Development/Production Aware**: Automatically handles different environments
- **Port Management**: Includes ports only in development
- **Service Discovery**: Supports dynamic service configuration

## Error Handling

All URL utility methods include comprehensive error handling:

```javascript
// Invalid service configuration
try {
  UrlUtils.buildServiceBaseUrl(null);
} catch (error) {
  // Error: Service configuration is required
}

// Invalid endpoint
try {
  UrlUtils.sanitizeEndpoint(null);
} catch (error) {
  // Error: Invalid endpoint provided
}

// Invalid URL parsing
const result = UrlUtils.parseUrl('invalid-url');
// Returns: { isValid: false, error: 'Invalid URL' }
```

## Migration from Old Implementation

### Before

```javascript
// Old manual URL construction
static httpClient = new HttpClient(
  `${WeatherProxy.services.weather.protocol}://${WeatherProxy.services.weather.host}${process.env.NODE_ENV !== 'development' ? '' : `:${WeatherProxy.services.weather.port}`}/${WeatherProxy.services.weather.routePrefix}${process.env.NODE_ENV !== 'development' ? '' : `/${WeatherProxy.services.weather.name}`}`
);
```

### After

```javascript
// New clean implementation with UrlUtils
static httpClient = new HttpClient(WeatherProxy.getBaseUrl());

static getBaseUrl() {
  return UrlUtils.buildServiceBaseUrl(WeatherProxy.services.weather, true);
}
```

## Testing

The `UrlUtils` class includes comprehensive test coverage:

- ✅ Base URL construction for different environments
- ✅ Endpoint URL building with query parameters
- ✅ Path sanitization and validation
- ✅ URL parsing and component extraction
- ✅ Security features for logging
- ✅ Error handling for invalid inputs

Run tests with:

```bash
npm test tests/utils/UrlUtils.test.js
```

## Configuration

URL utilities work with the existing service configuration structure:

```javascript
// Service configuration example
{
  weather: {
    protocol: 'https',
    host: 'api.weather.com',
    port: 443,
    routePrefix: 'api/v2',
    name: 'weather'
  }
}
```

## Best Practices

1. **Always use UrlUtils** for URL construction instead of string concatenation
2. **Validate inputs** before passing to URL utility methods
3. **Use sanitizeUrlForLogging** when logging URLs that might contain sensitive data
4. **Test URL construction** in both development and production modes
5. **Handle errors** appropriately when URL construction fails

## Future Enhancements

Potential future improvements:

- **URL Templates**: Support for parameterized URL templates
- **Caching**: Base URL caching for improved performance
- **Validation**: Enhanced URL validation with custom rules
- **Monitoring**: URL construction metrics and monitoring
- **Configuration**: Dynamic service discovery integration
