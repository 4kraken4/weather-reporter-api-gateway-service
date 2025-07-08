# Bulk Weather API Gateway Documentation

## Overview

The API Gateway service provides a bulk weather endpoint that allows fetching weather data for multiple cities in a single request. This endpoint acts as a proxy to the weather service with additional validation, circuit breaker protection, and proper error handling.

## Implementation Details

### Controller Layer (`weatherController.js`)

The `getBulkWeather` method handles:

- Request validation (cities array, max 50 cities)
- Circuit breaker integration for resilience
- Error handling and response formatting

```javascript
getBulkWeather: async (req, res, next) => {
  try {
    // Validation logic
    const { cities } = req.body;

    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid cities array is required'
      });
    }

    if (cities.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 50 cities allowed per request'
      });
    }

    // Circuit breaker protection
    const breaker = getCircuitBreakerInstance(
      WeatherProxy.getBulkWeather,
      Config.getInstance().services.weather.name
    );

    const response = await breaker.fire(req);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};
```

### Proxy Layer (`WeatherProxy.js`)

The `getBulkWeather` method forwards requests to the weather service:

```javascript
static async getBulkWeather(req) {
  const response = await WeatherProxy.httpClient.post('/bulk', req.body);
  return response.data;
}
```

### Route Layer (`weatherRoutes.js`)

The bulk endpoint is configured with proper middleware:

```javascript
weatherRoutes.post(
  '/bulk',
  injectGrants(RESOURCES.WEATHER, ACTIONS.READANY),
  weatherController.getBulkWeather
);
```

## API Usage

### Endpoint

`POST /api/v1/weather/bulk`

### Request Format

```json
{
  "cities": [
    {
      "city": "London",
      "country": "GB"
    },
    {
      "city": "New York",
      "country": "US"
    }
  ]
}
```

### Response Format

```json
{
  "success": true,
  "data": {
    "london-gb": {
      "temperature": 15,
      "icon": "04d",
      "description": "Overcast clouds"
    },
    "new york-us": {
      "temperature": 22,
      "icon": "01d",
      "description": "Clear sky"
    }
  }
}
```

## Error Handling

The API Gateway implements comprehensive error handling:

### Validation Errors (400)

- Missing cities array
- Empty cities array
- More than 50 cities
- Invalid request format

### Service Errors

- Circuit breaker open (503)
- Downstream service failures (502)
- Timeout errors (504)

## Security & Middleware

### Authentication

- Bearer token authentication required
- Access control via grants system (`RESOURCES.WEATHER`, `ACTIONS.READANY`)

### Rate Limiting

- Applied at gateway level
- Protects downstream services

### Circuit Breaker

- Prevents cascade failures
- Automatic fallback when weather service is unavailable
- Configurable failure thresholds

## Testing

### Unit Tests

The comprehensive unit test suite covers all bulk weather functionality:

```bash
npm test tests/controller/weatherController.test.js
```

The unified test file includes:

- Request validation scenarios
- Success cases with various city configurations
- Error handling and circuit breaker integration
- Console output management

### Integration Testing Script

A dedicated integration test script is available in the `scripts` folder:

```bash
# Run the comprehensive bulk weather test script
npm run test:bulk-weather

# Or run directly
node scripts/test-bulk-weather.js
```

The test script validates:

- **Health Check**: API Gateway connectivity
- **Validation Tests**: All error scenarios (missing data, invalid formats, limits)
- **Success Tests**: Single city, multiple cities, and maximum capacity (50 cities)
- **Performance Tests**: Response time validation

### Manual Integration Testing

Test the complete flow manually:

```bash
curl -X POST "http://localhost:9001/api/v1/weather/bulk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cities": [
      {"city": "London", "country": "GB"},
      {"city": "New York", "country": "US"}
    ]
  }'
```

## Performance Considerations

### Gateway Level Optimizations

- Request validation before proxying
- Circuit breaker prevents wasted requests
- Proper error responses reduce retries

### Monitoring

- Circuit breaker metrics
- Request/response times
- Error rates by endpoint

## Configuration

The bulk weather endpoint uses the same service configuration as other weather endpoints:

```javascript
// Config.js
services: {
  weather: {
    name: 'weather-service',
    host: 'localhost',
    port: 9002,
    protocol: 'http',
    routePrefix: 'api/v1'
  }
}
```

## Dependencies

- **express**: Web framework
- **opossum**: Circuit breaker implementation
- **axios**: HTTP client (via HttpClient)
- **accesscontrol**: Permission management

## Future Enhancements

1. **Response Caching**: Cache responses at gateway level
2. **Request Batching**: Automatically batch individual requests
3. **Metrics Collection**: Detailed analytics on bulk requests
4. **Async Processing**: Queue large bulk requests
5. **Response Streaming**: Stream results as they become available
