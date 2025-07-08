# Weather Reporter API Gateway Service

A robust, production-ready API Gateway microservice for the Weather Reporter application, providing intelligent routing, circuit breaker patterns, and advanced error handling for weather-related services in distributed environments.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Architecture](#architecture)
- [Circuit Breaker](#circuit-breaker)
- [Error Handling](#error-handling)
- [Tech Stack](#tech-stack)
- [Docker Setup](#docker-setup)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Performance & Monitoring](#performance--monitoring)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The **Weather Reporter API Gateway Service** is a production-ready microservice that acts as the central entry point for all weather-related operations. Built with modern Node.js technologies, it provides enterprise-grade features including intelligent routing, fault tolerance, and comprehensive error handling designed for distributed cloud environments.

### Key Capabilities

- ** Advanced Rate Limiting**: Multi-tier protection with Redis-backed rate limiting
- **⚡ Circuit Breaker Pattern**: Intelligent fault tolerance with automatic service recovery
- **🛡️ Production-Ready Error Handling**: Secure error responses with comprehensive logging
- **📊 Bulk Operations**: Efficient bulk weather data fetching for up to 50 cities
- **🔄 Smart Request Routing**: Intelligent routing to downstream weather services
- **📝 Comprehensive Logging**: Structured logging with request/response tracking
- **🐳 Docker-Ready**: Multi-stage builds with development and production configurations
- **📚 Interactive Documentation**: Swagger/OpenAPI 3.0 with comprehensive examples
- **🧪 Extensive Testing**: Unit, integration, and end-to-end test coverage

### Architecture Highlights

- **Microservice Architecture**: Cleanly separated concerns with proper service boundaries
- **Cloud-Native Design**: Built for containerized environments with health checks
- **Security-First Approach**: Multiple layers of security with input validation and sanitization
- **Performance Optimized**: Caching strategies with Redis integration
- **Monitoring Ready**: Built-in metrics, health checks, and observability features

## Features

### ✨ Core Features

- **Advanced Rate Limiting** - Redis-backed rate limiting with configurable tiers
- 🔄 **Circuit Breaker Pattern** - Opossum-based fault tolerance with automatic recovery
- 📊 **Bulk Weather API** - Fetch weather for up to 50 cities in one optimized request
- 🛡️ **CORS Protection** - Comprehensive cross-origin resource sharing security
- 📝 **Environment-Based Logging** - Intelligent console/file switching for different environments
- 📚 **OpenAPI Documentation** - Interactive Swagger UI with comprehensive examples
- 🧪 **Comprehensive Testing** - Jest-based unit, integration, and E2E tests
- ⚡ **Production-Ready Error Handling** - Secure, distributed-environment error management
- 🔍 **Error Tracking** - Unique error references for support and monitoring
- 🔒 **Security-First Design** - Path sanitization and information disclosure prevention
- 🔗 **Standardized URL Utilities** - Consistent URL construction and validation
- 🐳 **Docker-Ready** - Multi-stage builds with optimized production images
- 📊 **Health Monitoring** - Comprehensive health checks and metrics endpoints
- 🚀 **Performance Optimized** - Caching strategies and connection pooling

### 🌤️ Weather Services Integration

- **City Search** - Intelligent search with caching and fallback strategies
- **Current Weather** - Real-time weather data by city ID or name
- **Bulk Weather Operations** - Efficient batch processing for multiple cities
- **Weather Data Validation** - Input sanitization and response validation
- **Service Discovery** - Dynamic routing to weather service instances

### 🛡️ Security & Reliability

- **Multi-Layer Security**: Helmet.js, CORS, input validation, and sanitization
- **Fault Tolerance**: Circuit breakers, retries, and graceful degradation
- **Rate Limiting**: Multiple tiers (general API: 100r/m, bulk operations: 10r/m)
- **Error Boundary**: Comprehensive error handling with secure information disclosure
- **Input Validation**: Request validation with proper error responses

## Circuit Breaker

The API Gateway implements a sophisticated circuit breaker system using Opossum to provide fault tolerance and automatic service recovery.

### 🔄 Circuit Breaker Features

- **Service-Specific Configuration**: Optimized thresholds for weather service operations
- **Operation-Level Granularity**: Circuit breakers per service operation
- **Intelligent Fallback Strategies**: Customized fallback responses for weather operations
- **Enhanced Error Filtering**: Smart error classification for circuit breaker decisions
- **Comprehensive Monitoring**: Real-time metrics and health reporting

### ⚙️ Service Configurations

#### Weather Service (External API - Optimized)

```javascript
{
  errorThresholdPercentage: 60,    // Trip at 60% error rate
  timeout: 8000,                   // 8 second timeout
  resetTimeout: 30000,             // 30 second reset period
  rollingCountTimeout: 60000,      // 1 minute rolling window
  volumeThreshold: 10              // Minimum 10 requests to evaluate
}
```

rollingCountTimeout: 40000, // 40 second rolling window
volumeThreshold: 8 // Minimum 8 requests to evaluate
}

```

### 🎯 Fallback Strategies

#### Weather Service Fallbacks

- **Search**: Returns empty array with fallback flag
- **Current Weather**: Returns structure with "Data unavailable" message
- **Bulk Weather**: Returns empty object with error indication

### 📊 Circuit Breaker States

| State         | Description              | Behavior                             |
| ------------- | ------------------------ | ------------------------------------ |
| **CLOSED**    | Normal operation         | Requests pass through normally       |
| **OPEN**      | Service is failing       | Requests immediately return fallback |
| **HALF_OPEN** | Testing service recovery | Limited requests allowed for testing |

### 🔍 Error Classification

The circuit breaker intelligently classifies errors:

#### Errors That Trip Circuit

- Network errors (ECONNREFUSED, ETIMEDOUT, etc.)
- Server errors (5xx status codes)
- Rate limiting (429 status codes)
- Service unavailable (503)

#### Errors That Don't Trip Circuit

- Client errors (4xx except 429)
- Bad request errors (400)
- Not found errors (404)

### 📈 Monitoring & Metrics

#### Health Check Endpoint

```

GET /api/v1/circuit-breaker/health

````

Response:

```json
{
  "weather": {
    "state": "CLOSED",
    "stats": {
      "fires": 150,
      "successes": 145,
      "failures": 5,
      "timeouts": 0
    }
  }
}
````

#### Metrics Endpoint

```
GET /api/v1/circuit-breaker/metrics
```

Response:

```json
{
  "weather": {
    "requests_total": 150,
    "requests_successful": 145,
    "requests_failed": 5,
    "error_rate": 0.033,
    "state": "closed"
  }
}
```

### 🚨 Event Logging

All circuit breaker events are logged with structured data:

```javascript
{
  "event": "circuit_breaker_open",
  "service": "weather",
  "operationType": "search",
  "timestamp": "2025-07-04T10:30:00.000Z",
  "message": "Weather Circuit breaker is open, requests are being blocked."
}
```

### 📖 Documentation

For detailed implementation guide, see **[Circuit Breaker Migration Guide](docs/CIRCUIT_BREAKER_MIGRATION.md)**.

## Error Handling

The API Gateway implements a robust, production-ready error handling system designed for distributed environments with comprehensive security measures.

### 🛡️ Security-First Error Handling

- **Path Sanitization**: Prevents information disclosure by sanitizing API paths
- **Environment-Based Exposure**: Detailed errors only in development mode
- **Error References**: Unique tracking IDs for support without exposing internals
- **No Stack Traces in Production**: Prevents code structure disclosure

### 🔍 Error Response Structure

#### Production Response (Secure)

```json
{
  "error": {
    "type": "ECONNREFUSED",
    "message": "The Weather service is currently unavailable. Our team has been notified and is working to restore service. Please try again in a few minutes.",
    "reference": "ERR_1A2B3C4D_X9Y8Z",
    "timestamp": "2025-06-26T10:30:00.000Z"
  }
}
```

#### Development Response (Detailed)

```json
{
  "error": {
    "type": "ECONNREFUSED",
    "message": "The Weather service is currently unavailable...",
    "reference": "ERR_1A2B3C4D_X9Y8Z",
    "timestamp": "2025-06-26T10:30:00.000Z",
    "path": "/api/*/weather/:id",
    "method": "GET",
    "stack": "Error: connect ECONNREFUSED 127.0.0.1:8080..."
  }
}
```

### 📋 Error Types & Status Codes

| Error Type                | Status | Description                |
| ------------------------- | ------ | -------------------------- |
| `BadRequest`              | 400    | Invalid request parameters |
| `CORSDeniedError`         | 403    | CORS policy violation      |
| `RegionNotFoundError`     | 404    | Resource not found         |
| `TimeoutError`            | 408    | Request timeout            |
| `TooManyRequestsError`    | 429    | Rate limit exceeded        |
| `ECONNREFUSED`            | 503    | Service unavailable        |
| `ETIMEDOUT`               | 503    | Service timeout            |
| `ServiceUnavailableError` | 503    | Service unavailable        |

### 🌐 Distributed Environment Support

The error handling system is designed for modern distributed architectures:

- **Service Context Detection**: Intelligent service identification without relying on ports
- **Load Balancer Compatible**: Works behind proxies and load balancers
- **Container-Ready**: Compatible with Docker and Kubernetes deployments
- **Service Mesh Support**: Handles abstracted network layers

### 🔒 Security Features

#### Path Sanitization Examples

| Original Path                               | Sanitized Path       |
| ------------------------------------------- | -------------------- |
| `/api/v1/weather/abc123def456?token=secret` | `/api/*/weather/:id` |
| `/weather/uuid-4567-8901`                   | `/weather/:id`       |

#### Security Measures

- ✅ **Query Parameter Removal**: Strips sensitive data from URLs
- ✅ **Dynamic Segment Replacement**: UUIDs, IDs, and tokens become placeholders
- ✅ **Length Limiting**: Prevents path-based information leakage
- ✅ **Environment Awareness**: Production vs development error exposure

### 📊 Error Monitoring & Logging

All errors are logged internally with comprehensive details:

```javascript
// Internal error log structure
{
  "reference": "ERR_1A2B3C4D_X9Y8Z",
  "type": "ECONNREFUSED",
  "message": "Connection refused",
  "path": "/api/v1/weather/search",
  "method": "GET",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "timestamp": "2025-06-26T10:30:00.000Z",
  "stack": "Error: connect ECONNREFUSED..."
}
```

### 🛠️ Error Reference System

Each error generates a unique reference ID for tracking:

- **Format**: `ERR_TIMESTAMP_RANDOM` (e.g., `ERR_1A2B3C4D_X9Y8Z`)
- **Purpose**: Correlate client issues with server logs
- **Support**: Provide reference to customer support without exposing internals

### 🔧 Configuration

Control error behavior through environment variables:

```env
NODE_ENV=production  # Controls error detail exposure
```

#### Error Exposure Levels

| Environment | Path Exposure | Stack Traces | Error Details |
| ----------- | ------------- | ------------ | ------------- |
| Production  | ❌ Sanitized  | ❌ Hidden    | ❌ Minimal    |
| Development | ✅ Sanitized  | ✅ Included  | ✅ Full       |
| Test        | ✅ Sanitized  | ✅ Included  | ✅ Full       |

### 📖 Documentation

- **[Error Security Guide](docs/ERROR_SECURITY.md)**: Comprehensive security documentation
- **[Enhanced Error Handling](docs/ENHANCED_ERROR_HANDLING.md)**: Technical implementation details
- **[URL Utilities Guide](docs/URL_UTILITIES.md)**: Standardized URL construction and validation

## Tech Stack

### 🛠️ Core Technologies

- **Runtime**: Node.js 20.x+ (ES Modules)
- **Framework**: Express.js 4.21.x
- **Language**: JavaScript (ES2022 modules)
- **Package Manager**: npm

### 🔧 Key Dependencies

#### **Security & Web Protection**

- **helmet** (^8.0.0) - Security headers and protection
- **cors** (^2.8.5) - Cross-origin resource sharing
- **accesscontrol** (^2.2.1) - Role-based access control

#### **HTTP & Communication**

- **axios** (^1.7.7) - HTTP client with interceptors
- **retry** (^0.13.1) - Request retry logic

#### **Circuit Breaker & Resilience**

- **opossum** (^8.1.4) - Circuit breaker pattern implementation

#### **Rate Limiting & Caching**

- **rate-limiter-flexible** (^5.0.3) - Advanced rate limiting
- **ioredis** (^5.4.1) - Redis client for caching

#### **Logging & Monitoring**

- **morgan** (^1.10.0) - HTTP request logger
- **rotating-file-stream** (^3.2.5) - Log file rotation

#### **Documentation**

- **swagger-jsdoc** (^6.2.8) - OpenAPI specification generation
- **swagger-ui-express** (^5.0.1) - Interactive API documentation

#### **Real-time Communication**

- **socket.io** (^4.8.0) - WebSocket communication

#### **Development & Testing**

- **jest** (^29.7.0) - Testing framework
- **supertest** (^7.1.1) - HTTP assertions
- **nodemon** (^3.1.7) - Development auto-reload with multiple configs
- **eslint** (^9.12.0) - Code linting with security plugin
- **eslint-plugin-security** (^3.0.1) - Security-focused linting
- **prettier** (^3.6.0) - Code formatting
- **babel-jest** (^29.7.0) - ES6 module support for Jest

#### **Configuration & Environment**

- **dotenv** (^16.4.5) - Environment variable management
- **cross-env** (^7.0.3) - Cross-platform environment variables

### 🐳 Infrastructure

- **Docker**: Multi-stage builds with Alpine Linux
- **Docker Compose**: Development and production configurations
- **Nginx**: Reverse proxy with rate limiting
- **Redis**: Caching and rate limiting backend

### 📊 API Documentation

- **Swagger/OpenAPI 3.0**: Interactive API documentation
- **JSDoc**: Code documentation standards

### 🔄 Development Tools

- **ESLint**: Security-focused linting with comprehensive rules
- **Prettier**: Code formatting with consistent style
- **Nodemon**: Multiple environment configurations
- **Jest**: Comprehensive test coverage with custom matchers

### 📈 Production Features

- **Health Checks**: Kubernetes/Docker ready health endpoints
- **Graceful Shutdown**: Proper cleanup and connection handling
- **Signal Handling**: dumb-init for proper signal forwarding
- **Resource Limits**: Docker memory and CPU constraints
- **Log Rotation**: Automatic log file management

## Docker Setup

The application features a comprehensive Docker setup with multi-stage builds, optimized for both development and production environments.

### 🐳 Docker Architecture

#### **Multi-Stage Dockerfile**

- **Base Stage**: Node.js 22 Alpine with security essentials
- **Development Stage**: Hot-reload with volume mounts
- **Build Stage**: Production dependency installation
- **Production Stage**: Optimized runtime image

#### **Key Features**

- ✅ **Non-root user execution** for security
- ✅ **dumb-init** for proper signal handling
- ✅ **Health checks** with custom endpoints
- ✅ **Resource limits** in production
- ✅ **Layer optimization** for faster builds

### 🔧 Docker Compose Configurations

#### **Development Environment** (`docker-compose.yml`)

```bash
# Start development environment
npm run docker:dev
# or
./docker.sh dev:up

# Services available:
# - API Gateway: http://localhost:9000
# - Redis: localhost:6379
# - Redis Commander: http://localhost:8081
```

**Features:**

- Hot-reload with volume mounts
- Redis cache with Redis Commander GUI
- Development-optimized logging
- Automatic restart policies

#### **Production Environment** (`docker-compose.prod.yml`)

```bash
# Start production environment
npm run docker:prod
# or
./docker.sh prod:up

# Services available:
# - API Gateway: http://localhost:9000 (via Nginx)
# - Nginx Proxy: http://localhost:80
```

**Features:**

- Nginx reverse proxy with rate limiting
- Resource constraints (512MB RAM, 0.5 CPU)
- Redis backend for caching
- SSL/TLS ready configuration
- Health checks and monitoring

### 🎛️ Docker Management Script

The `docker.sh` script provides comprehensive Docker management:

```bash
# Development Commands
./docker.sh dev          # Start development environment
./docker.sh dev:down     # Stop development environment
./docker.sh dev:logs     # View development logs
./docker.sh dev:rebuild  # Rebuild and restart

# Production Commands
./docker.sh prod         # Start production environment
./docker.sh prod:down    # Stop production environment
./docker.sh prod:logs    # View production logs

# Utility Commands
./docker.sh clean        # Clean Docker resources
./docker.sh test         # Run tests in container
./docker.sh lint         # Run linter in container
./docker.sh health       # Check service health
```

### 🔒 Security Features

#### **Container Security**

- Non-root user execution (`nextjs:nodejs`)
- Minimal Alpine Linux base image
- No unnecessary packages or dependencies
- Proper file permissions and ownership

#### **Network Security**

- Custom bridge networks
- No unnecessary port exposure
- Nginx proxy with security headers
- Rate limiting at proxy level

### 📊 Production Configuration

#### **Resource Limits**

```yaml
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

#### **Health Checks**

```yaml
healthcheck:
  test:
    [
      'CMD',
      'node',
      '-e',
      "require('http').get('http://localhost:9000/api/v1/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
    ]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 🌐 Nginx Configuration

#### **Features**

- ✅ **Rate Limiting**: 100 req/min general, 10 req/min bulk operations
- ✅ **Security Headers**: X-Frame-Options, X-Content-Type-Options, etc.
- ✅ **Gzip Compression**: Optimized response compression
- ✅ **Upstream Load Balancing**: Ready for horizontal scaling
- ✅ **SSL/TLS Ready**: Certificate mount points configured

#### **Rate Limiting**

```nginx
# General API: 100 requests per minute
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

# Bulk operations: 10 requests per minute
limit_req_zone $binary_remote_addr zone=bulk:10m rate=10r/m;
```

### 📈 Monitoring & Observability

- **Container Health**: Built-in Docker health checks
- **Application Health**: Custom health endpoints
- **Log Aggregation**: Structured logging with rotation
- **Redis Monitoring**: Redis Commander interface
- **Performance Metrics**: Resource usage tracking

### 🚀 Deployment Ready

The application is optimized for multiple deployment platforms:

#### **☁️ Cloud Platforms**

- **Vercel**: Serverless deployment with automatic stdout logging
- **AWS ECS/Lambda**: Container and serverless support
- **Google Cloud Run**: Cloud-native deployment
- **Azure Container Instances**: Simplified container deployment
- **Railway/Render**: Modern platform-as-a-service support

#### **🐳 Container Orchestration**

- **Kubernetes**: Health checks and graceful shutdown
- **Docker Swarm**: Service definitions and constraints
- **Docker Compose**: Development and staging environments

#### **📊 Cloud-Friendly Features**

- **Environment-Based Logging**: Automatic console/file switching
- **Stateless Design**: No local file dependencies in production
- **Health Endpoints**: `/health` for load balancer checks
- **Graceful Shutdown**: Proper signal handling for containers
- **Environment Configuration**: 12-factor app compliance

#### **🔧 Platform-Specific Optimizations**

| Platform            | Optimization              | Benefit                 |
| ------------------- | ------------------------- | ----------------------- |
| **Vercel**          | stdout logging, stateless | ✅ Serverless-ready     |
| **Kubernetes**      | Health checks, metrics    | ✅ Auto-scaling support |
| **Docker**          | Multi-stage builds        | ✅ Minimal image size   |
| **Cloud Functions** | Fast startup, lightweight | ✅ Quick cold starts    |

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 20.x or later)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- Access to Weather Service endpoints

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd weather-reporter-api-gateway-service
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

Create environment files in the `src/` directory:

```bash
# Create base environment file
touch src/.env

# Create development environment file
touch src/.env.development

# Create production environment file (for production deployment)
touch src/.env.production
```

Configure the environment files based on the [Environment Variables](#environment-variables) section.

4. **Set up Redis (for caching and rate limiting):**

```bash
# Using Docker (recommended)
docker run --name redis-cache -p 6379:6379 -d redis:alpine

# Or install Redis locally
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
# Windows: Use Redis for Windows or Docker
```

### Running the Application

#### Development Mode

The application supports multiple development configurations with file-based logging:

```bash
# Standard development mode (runs src/server.js via nodemon)
npm run dev
# 📝 Logs to: ./logs/weather-reporter.log (with daily rotation)

# Development with debug configuration
npm run dev:debug

# Development with file watching for src and db directories
npm run dev:watch

# Staging environment
npm run dev:staging
```

#### Production Mode

Production mode uses console/stdout logging for cloud deployment compatibility:

```bash
# Production mode
npm start
# 📝 Logs to: console/stdout (Vercel-friendly)

# Using Docker Compose (recommended)
npm run docker:prod
```

#### Logging Behavior by Environment

| Command               | Environment | Logging Output | Log Files Created            |
| --------------------- | ----------- | -------------- | ---------------------------- |
| `npm run dev`         | development | File-based     | ✅ `./logs/` directory       |
| `npm run dev:debug`   | development | File-based     | ✅ `./logs/` directory       |
| `npm run dev:staging` | staging     | File-based     | ✅ `./logs/` directory       |
| `npm start`           | production  | Console/stdout | ❌ No files (cloud-friendly) |

#### Docker Development

```bash
# Start development environment with Redis
npm run docker:dev

# Stop development environment
npm run docker:dev:down
```

#### Test Scripts

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific endpoint tests
npm run test:weather-search
npm run test:weather-city
npm run test:bulk-weather
npm run test:weather-endpoints

# Run custom test runner
npm run test:runner
```

#### Code Quality

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check code formatting
npm run format:check
```

### Nodemon Configuration

The application uses a comprehensive nodemon setup with multiple configuration files:

- **`nodemon.json`** - Main development configuration
- **`nodemon.dev.json`** - Enhanced development with debug options
- **`nodemon.staging.json`** - Staging environment configuration

**Current Features:**

- **File Watching**: Monitors `src/`, `db/`, `.env`, and `.env.development`
- **File Extensions**: Watches `.js`, `.mjs`, `.json`, and `.env` files
- **Ignore Patterns**: Excludes test files, coverage, logs, and build directories
- **Custom Events**: Start, restart, and crash messages with emojis
- **Environment**: Development-specific settings with Node.js optimizations
- **Signal Handling**: Proper SIGTERM handling for graceful shutdowns

The application will be available at `http://localhost:9000` (or your configured port).

## API Endpoints

### 🌤️ Weather Routes

| Method | Endpoint                          | Description                             | Rate Limit |
| ------ | --------------------------------- | --------------------------------------- | ---------- |
| `GET`  | `/api/v1/weather/search`          | Search cities and locations             | 100/min    |
| `GET`  | `/api/v1/weather/current/:cityId` | Get weather by city ID                  | 100/min    |
| `GET`  | `/api/v1/weather/current`         | Get weather by city name (query)        | 100/min    |
| `POST` | `/api/v1/weather/bulk`            | Get bulk weather data (up to 50 cities) | 10/min     |

### 🔧 System Routes

| Method | Endpoint                                  | Description                   |
| ------ | ----------------------------------------- | ----------------------------- |
| `GET`  | `/api/v1/health`                          | Basic health check            |
| `GET`  | `/api/v1/health/circuit-breakers`         | Circuit breaker health status |
| `GET`  | `/api/v1/health/circuit-breakers/metrics` | Circuit breaker metrics       |
| `GET`  | `/api/v1/health/prometheus`               | Prometheus-style metrics      |
| `GET`  | `/docs`                                   | Interactive API documentation |

### 📊 Bulk Weather API

The bulk weather endpoint allows fetching weather data for multiple cities in a single request:

```javascript
POST /api/v1/weather/bulk
Content-Type: application/json

{
  "cities": [
    { "name": "London", "country": "UK" },
    { "name": "New York", "country": "US" },
    { "id": "2643743" }  // City ID
  ]
}
```

**Features:**

- ✅ Up to 50 cities per request
- ✅ Mix of city names and IDs
- ✅ Parallel processing with circuit breaker protection
- ✅ Partial success handling
- ✅ Comprehensive error reporting

**Rate Limiting:**

- 10 requests per minute per IP
- Burst allowance of 5 requests
- Redis-backed tracking

For detailed API documentation with examples, visit `/docs` when the service is running.

## Environment Variables

The application uses a sophisticated environment configuration system with support for multiple environments.

### 📁 Environment Files Structure

```
src/
├── .env                 # Base configuration
├── .env.development     # Development overrides
├── .env.staging         # Staging configuration
└── .env.production      # Production configuration
```

### ⚙️ Application Settings

```env
# Application Identity
NODE_ENV=development
APP_NAME=weather-reporter
APP_SWAGGER_URL=docs
APP_HEALTH_URL=health

# Service Configuration
SERVICE_PORT=9000
SERVICE_NAME=api-gateway
SERVICE_VERSION=1.0.0
SERVICE_PROTOCOL=http
SERVICE_HOST=localhost
SERVICE_ROUTE_PREFIX=api/v1
SERVER_CERT_PATH=

# Rate Limiting
SERVICE_REQUESTS_LIMIT=100
SERVICE_REQUESTS_LIMIT_WINDOW_S=45           # 45 seconds
SERVICE_REQUESTS_BLOCK_DURATION_S=60         # 60 seconds
SERVICE_REQUESTS_SLIDING_WINDOW_S=false      # Use fixed window
```

### 🌐 Downstream Services Configuration

#### **Weather Service**

```env
WEATHER_SERVICE_PORT=9001
WEATHER_SERVICE_NAME=weather
WEATHER_SERVICE_PROTOCOL=http
WEATHER_SERVICE_HOST=localhost
WEATHER_SERVICE_ROUTE_PREFIX=api/v1
```

### 🔒 Security Configuration

```env
# Client Configuration for CORS
CLIENT_PORT=3000
CLIENT_HOST=localhost
CLIENT_PROTOCOL=http
CLIENT_URL=http://localhost:3000
```

### 📊 Caching & Performance

```env
# Cache Strategy (memory | redis)
CACHE_STRATEGY=redis
CACHE_DEFAULT_TTL=300000        # 5 minutes in milliseconds

# Redis Configuration (when CACHE_STRATEGY=redis)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=development
REDIS_DATABASE=0
REDIS_KEY_PREFIX=weather:
REDIS_RETRY_DELAY=100
REDIS_ENABLE_READY_CHECK=true
REDIS_MAX_RETRIES=3
```

### 📝 Logging Configuration

The application features intelligent environment-based logging with automatic file/console switching for optimal development and production experiences.

```env
# Logging Configuration
LOG_LEVEL=info                  # error | warn | info | debug
LOG_ENABLED_IN_PROD=true
LOG_FORMAT=simple               # simple | json
```

#### **Environment-Based Logging Strategy**

| Environment      | Output         | Features                                                                |
| ---------------- | -------------- | ----------------------------------------------------------------------- |
| **Production**   | Console/stdout | ✅ Vercel-friendly<br/>✅ Cloud-native<br/>✅ No file system operations |
| **Development**  | Rotating files | ✅ File-based logging<br/>✅ Daily rotation<br/>✅ Gzip compression     |
| **Test/Staging** | Rotating files | ✅ Comprehensive logging<br/>✅ Debug capabilities                      |

#### **File Logging (Non-Production)**

```javascript
// Automatic log file creation in development/test
{
  "directory": "./logs/",
  "filename": "weather-reporter.log",
  "rotation": {
    "interval": "1d",        // Daily rotation
    "size": "10M",          // Max 10MB per file
    "compress": "gzip"      // Gzip compression
  }
}
```

#### **Custom Date Format**

All logs include Sri Lankan timezone formatting:

```javascript
// Custom date token for Asia/Colombo timezone
'[Thu Jul 05 2025 14:30:45 +0530]';
```

### 🚦 Rate Limiting

```env
# Rate Limiting Configuration (from Config.js)
SERVICE_REQUESTS_LIMIT=100                    # Max requests per window
SERVICE_REQUESTS_LIMIT_WINDOW_S=45           # Window in seconds
SERVICE_REQUESTS_BLOCK_DURATION_S=60         # Block duration in seconds
SERVICE_REQUESTS_SLIDING_WINDOW_S=false      # Use sliding window
```

### Logging Configuration

```env
# Logging Configuration
LOG_LEVEL=info                  # error | warn | info | debug
LOG_ENABLED_IN_PROD=true
LOG_FORMAT=simple               # simple | json
```

### 🐳 Docker Environment Variables

When running in Docker, certain variables are automatically overridden:

```env
# Docker-specific overrides (from docker-compose.yml)
SERVICE_HOST=0.0.0.0           # Bind to all interfaces
CACHE_STRATEGY=redis           # Use Redis for caching
REDIS_HOST=redis               # Docker service name
REDIS_PORT=6379                # Standard Redis port
REDIS_PASSWORD=development     # Development Redis password
```

### 🌍 Environment-Specific Examples

#### **Development (.env.development)**

```env
NODE_ENV=development
SERVICE_PORT=9000
LOG_LEVEL=debug
CACHE_STRATEGY=memory
SERVICE_REQUESTS_LIMIT=1000      # More lenient for development
```

#### **Production (.env.production)**

```env
NODE_ENV=production
SERVICE_PORT=9000
LOG_LEVEL=warn
CACHE_STRATEGY=redis
SERVICE_REQUESTS_LIMIT=100       # Stricter for production
REDIS_PASSWORD=${REDIS_PASSWORD} # Use actual secret from environment
```

### 🔧 Configuration Loading

The application loads configuration in this order:

1. **Base**: `src/.env`
2. **Environment-specific**: `src/.env.${NODE_ENV}`
3. **System environment variables** (highest priority)

This allows for flexible configuration management across different deployment environments.

## Project Structure

```
weather-reporter-api-gateway-service/
├── src/                           # Source code
│   ├── config/                    # Configuration management
│   │   ├── Config.js             # Main configuration class
│   │   └── swagger.js            # OpenAPI/Swagger configuration
│   ├── controller/               # Business logic controllers
│   │   └── weatherController.js  # Weather operations
│   ├── infrastructure/           # Infrastructure layer
│   │   ├── enum/                 # Enumerations and constants
│   │   ├── logger/               # Logging infrastructure
│   │   │   └── logger.js         # Winston logger configuration
│   │   ├── middleware/           # Express middleware
│   │   │   ├── cors.js           # CORS configuration
│   │   │   ├── errorHandler.js   # Global error handling
│   │   │   ├── helmet.js         # Security headers
│   │   │   └── ratelimit.js      # Rate limiting middleware
│   │   └── proxies/              # Service proxy implementations
│   │       └── WeatherProxy.js   # Weather service proxy
│   ├── interfaces/               # Interface/adapter layer
│   │   └── http/                 # HTTP interface layer
│   │       ├── HttpClient.js     # Axios HTTP client wrapper
│   │       ├── RouteBypassList.js # Route bypass configuration
│   │       ├── whitelist.js      # Request whitelist configuration
│   │       └── routes/           # Express route definitions
│   │           ├── healthRoutes.js   # Health check routes
│   │           ├── index.js          # Main route aggregator
│   │           └── weatherRoutes.js  # Weather API routes
│   ├── utils/                    # Utility functions and helpers
│   │   ├── CacheFactory.js       # Cache factory pattern
│   │   ├── CircuitBreaker.js     # Circuit breaker management
│   │   ├── Logger.js             # Logger utility functions
│   │   ├── MemoryCache.js        # In-memory cache implementation
│   │   ├── RedisCache.js         # Redis cache implementation
│   │   └── UrlUtils.js           # URL construction utilities
│   ├── app.js                    # Express application setup
│   ├── server.js                 # Application entry point
│   ├── .env                      # Base environment configuration
│   ├── .env.development          # Development environment
│   ├── .env.staging              # Staging environment
│   └── .env.production           # Production environment
├── tests/                        # Test suite
│   ├── config/                   # Configuration tests
│   │   └── Config.test.js        # Config class tests
│   ├── controller/               # Controller unit tests
│   │   └── weatherController.test.js # Weather controller tests
│   ├── infrastructure/           # Infrastructure tests
│   │   ├── middleware/           # Middleware tests
│   │   │   └── errorHandler.test.js # Error handler tests
│   │   └── proxies/              # Proxy integration tests
│   ├── interfaces/               # Interface layer tests
│   │   └── http/                 # HTTP interface tests
│   │       ├── HttpClient.test.js     # HTTP client tests
│   │       └── routes/               # Route tests
│   ├── scripts/                  # Test script utilities
│   └── utils/                    # Utility function tests
│       └── UrlUtils.test.js      # URL utility tests
├── scripts/                      # Development and test scripts
│   ├── test-bulk-weather.js      # Bulk weather API test
│   ├── test-runner.js            # Test runner utility
│   ├── test-weather-city.js      # City weather test
│   ├── test-weather-search.js    # Weather search test
│   ├── utils/                    # Script utilities
│   │   └── TestConfig.js         # Test configuration helper
│   └── TEST_SCRIPTS.md           # Script documentation
├── docs/                         # Comprehensive documentation
│   ├── BULK_WEATHER_API.md       # Bulk weather API guide
│   ├── CIRCUIT_BREAKER_MIGRATION.md # Circuit breaker implementation
│   ├── ENHANCED_ERROR_HANDLING.md   # Error handling guide
│   ├── ERROR_SECURITY.md         # Security documentation
│   └── URL_UTILITIES.md          # URL utilities guide
├── logs/                         # Application logs
│   └── weather-reporter.log      # Rotating log files
├── nginx/                        # Nginx reverse proxy configuration
│   └── nginx.conf                # Production nginx config
├── docker-compose.yml            # Development Docker setup
├── docker-compose.prod.yml       # Production Docker setup
├── Dockerfile                    # Multi-stage Docker build
├── docker.sh                     # Docker management script
├── eslint.config.js              # ESLint configuration
├── jest.config.js                # Jest testing configuration
├── jest.setup.js                 # Jest test setup
├── nodemon.json                  # Nodemon configuration
├── nodemon.dev.json              # Development nodemon config
├── nodemon.staging.json          # Staging nodemon config
├── package.json                  # Dependencies and scripts
├── vercel.json                   # Vercel deployment config
├── LICENSE                       # MIT license
└── README.md                     # This comprehensive documentation
```

### 🏗️ Architecture Layers

#### **1. Interface Layer** (`src/interfaces/`)

- **Responsibility**: External communication and HTTP handling
- **Components**: Routes, HTTP clients, request/response handling
- **Pattern**: Adapter pattern for external service integration

#### **2. Controller Layer** (`src/controller/`)

- **Responsibility**: Business logic orchestration and request processing
- **Components**: Business rules, validation, service coordination
- **Pattern**: Controller pattern with dependency injection

#### **3. Infrastructure Layer** (`src/infrastructure/`)

- **Responsibility**: Cross-cutting concerns and technical services
- **Components**: Logging, middleware, security, service proxies
- **Pattern**: Infrastructure services pattern

#### **4. Utilities Layer** (`src/utils/`)

- **Responsibility**: Common utilities and helper functions
- **Components**: Caching, circuit breakers, URL handling
- **Pattern**: Utility and factory patterns

### 📁 Key Configuration Files

| File                      | Purpose                         | Environment |
| ------------------------- | ------------------------------- | ----------- |
| `eslint.config.js`        | Code quality and security rules | All         |
| `jest.config.js`          | Testing framework configuration | Development |
| `docker-compose.yml`      | Development containerization    | Development |
| `docker-compose.prod.yml` | Production containerization     | Production  |
| `nginx/nginx.conf`        | Reverse proxy configuration     | Production  |
| `vercel.json`             | Serverless deployment config    | Cloud       |

### 🔧 Development Tools

| Tool         | Configuration      | Purpose                          |
| ------------ | ------------------ | -------------------------------- |
| **ESLint**   | `eslint.config.js` | Code linting with security rules |
| **Prettier** | `package.json`     | Code formatting                  |
| **Jest**     | `jest.config.js`   | Unit and integration testing     |
| **Nodemon**  | `nodemon.*.json`   | Development auto-reload          |
| **Docker**   | `Dockerfile`       | Containerization                 |

This structure follows clean architecture principles with clear separation of concerns and dependency inversion.

## Testing

The project includes comprehensive test coverage with multiple testing strategies and tools.

### 🧪 Test Coverage

**Run all tests:**

```bash
npm test
npm run test:coverage        # With coverage report
```

**Run specific test suites:**

```bash
npm test -- --testPathPattern=weatherController
npm test -- --testPathPattern=errorHandler
npm test -- --testPathPattern=CircuitBreaker
```

**Development testing:**

```bash
npm test -- --watch         # Watch mode
npm test -- --detectOpenHandles  # Debug hanging tests
```

### 📊 Test Structure

#### **Unit Tests** (`tests/`)

- **Controllers**: Business logic validation
- **Utilities**: Helper function testing
- **Middleware**: Security and error handling
- **Configuration**: Environment and setup testing

#### **Integration Tests** (`scripts/`)

- **API Endpoints**: End-to-end request/response testing
- **Service Integration**: Downstream service communication
- **Circuit Breaker**: Fault tolerance validation
- **Rate Limiting**: Throttling behavior verification

#### **Test Scripts** (`scripts/`)

The application includes comprehensive test scripts for API validation:

```bash
# Individual endpoint testing
npm run test:weather-search     # City search functionality
npm run test:weather-city       # City weather retrieval
npm run test:bulk-weather       # Bulk operations testing
npm run test:runner            # Orchestrated test execution
```

**Available Test Scripts:**

- **`test-weather-search.js`** - Validates city search functionality
- **`test-weather-city.js`** - Tests weather retrieval by city ID/name
- **`test-bulk-weather.js`** - Comprehensive bulk weather API testing
- **`test-runner.js`** - Orchestrated test execution with reporting

**Test Script Features:**

- ✅ **Health Check Validation**: Ensures API Gateway is responsive
- ✅ **Authentication Testing**: JWT token validation
- ✅ **Input Validation**: Tests parameter validation and error handling
- ✅ **Success Scenarios**: Validates successful API responses
- ✅ **Performance Testing**: Response time validation
- ✅ **Error Scenarios**: Tests error conditions and fallbacks

**Documentation:**

Detailed test script documentation is available in `scripts/TEST_SCRIPTS.md` including:

- Test configuration and setup instructions
- Expected outcomes and validation criteria
- Performance benchmarks and success criteria
- Troubleshooting guides for common issues

### 🔧 Testing Tools & Configuration

#### **Jest Configuration** (`jest.config.js`)

```javascript
{
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

#### **Test Features**

- ✅ **ES6 Modules**: Full ESM support
- ✅ **Async/Await**: Modern async testing patterns
- ✅ **Mocking**: Service mocking with jest.mock()
- ✅ **Coverage**: Comprehensive coverage reporting
- ✅ **Custom Matchers**: Domain-specific test assertions

### 🔍 Test Categories

#### **1. Unit Tests**

```bash
tests/
├── config/Config.test.js           # Configuration testing
├── controller/weatherController.test.js # Business logic tests
├── infrastructure/middleware/errorHandler.test.js # Error handling
├── interfaces/http/HttpClient.test.js # HTTP client tests
└── utils/UrlUtils.test.js          # Utility function tests
```

#### **2. Integration Tests**

```bash
scripts/
├── test-bulk-weather.js           # Bulk API integration
├── test-weather-city.js           # City weather integration
├── test-weather-search.js         # Search integration
└── test-runner.js                 # Orchestrated test runs
```

### 📋 Test Scenarios

#### **Weather API Tests**

- ✅ City search functionality
- ✅ Current weather retrieval
- ✅ Bulk weather operations
- ✅ Error handling and fallbacks

#### **Circuit Breaker Tests**

- ✅ Service failure detection
- ✅ Automatic recovery behavior
- ✅ Fallback strategy execution
- ✅ Metrics and monitoring

#### **Error Handling Tests**

- ✅ Security-compliant error responses
- ✅ Path sanitization
- ✅ Error reference generation
- ✅ Environment-specific behavior

#### **Rate Limiting Tests**

- ✅ Request throttling behavior
- ✅ Burst allowance validation
- ✅ Redis integration testing
- ✅ Multiple endpoint rate limits

### 🎯 Coverage Targets

| Component           | Target Coverage | Current Status |
| ------------------- | --------------- | -------------- |
| **Controllers**     | 90%+            | ✅ Achieved    |
| **Middleware**      | 85%+            | ✅ Achieved    |
| **Utilities**       | 95%+            | ✅ Achieved    |
| **Error Handling**  | 90%+            | ✅ Achieved    |
| **Circuit Breaker** | 85%+            | ✅ Achieved    |

### 🚀 Continuous Testing

#### **Docker Testing**

```bash
# Run tests in container
docker-compose exec weather-api-gateway npm test

# Using management script
./docker.sh test
```

#### **CI/CD Integration**

The test suite is designed for CI/CD integration with:

- **GitHub Actions**: Automated testing on PR/push
- **Docker**: Containerized test execution
- **Coverage Reports**: Automated coverage analysis
- **Performance Testing**: Load testing capabilities

### 📖 Test Documentation

Each test script includes comprehensive documentation:

- **Purpose**: What the test validates
- **Setup**: Required environment and dependencies
- **Execution**: How to run the specific test
- **Expected Results**: What constitutes a passing test

For detailed testing strategies, see individual test files and the `scripts/TEST_SCRIPTS.md` documentation.

## API Documentation

Interactive API documentation is available when the service is running with comprehensive examples and testing capabilities.

### 📚 Documentation Access

- **Swagger UI**: `http://localhost:9000/docs` (Interactive documentation)
- **OpenAPI JSON**: `http://localhost:9000/docs.json` (Machine-readable spec)
- **Health Check**: `http://localhost:9000/api/v1/health` (Service status)

### 🔧 Documentation Features

#### **Interactive API Explorer**

- ✅ **Try It Out**: Execute API calls directly from the documentation
- ✅ **Real-time Responses**: Live API responses with actual data
- ✅ **Request Builder**: Interactive request parameter configuration

#### **Comprehensive Examples**

- ✅ **Request Examples**: Sample requests for all endpoints
- ✅ **Response Schemas**: Detailed response structure documentation
- ✅ **Error Examples**: Error response examples with references

### 📖 Available Documentation

#### **API Reference Documentation**

- **[Interactive Swagger UI](http://localhost:9000/docs)** - Complete API reference with testing
- **[OpenAPI 3.0 Spec](http://localhost:9000/docs.json)** - Machine-readable API specification

#### **Implementation Guides**

- **[Error Security Guide](docs/ERROR_SECURITY.md)** - Security measures and best practices
- **[Enhanced Error Handling](docs/ENHANCED_ERROR_HANDLING.md)** - Technical implementation details
- **[URL Utilities Guide](docs/URL_UTILITIES.md)** - Standardized URL construction
- **[Circuit Breaker Migration](docs/CIRCUIT_BREAKER_MIGRATION.md)** - Circuit breaker implementation
- **[Bulk Weather API](docs/BULK_WEATHER_API.md)** - Bulk operations guide

### 🚀 Quick Start Examples

#### **Weather API Examples**

```bash
# Search for cities
curl -X GET "http://localhost:9000/api/v1/weather/search?query=London"

# Get current weather by city ID
curl -X GET "http://localhost:9000/api/v1/weather/current/2643743"

# Bulk weather request
curl -X POST http://localhost:9000/api/v1/weather/bulk \
  -H "Content-Type: application/json" \
  -d '{
    "cities": [
      {"name": "London", "country": "UK"},
      {"name": "New York", "country": "US"},
      {"id": "2643743"}
    ]
  }'
```

### 📊 Documentation Structure

#### **Endpoint Documentation Includes:**

- **Summary**: Brief description of the endpoint purpose
- **Parameters**: Request parameters with types and validation rules
- **Request Body**: JSON schema for POST/PUT requests
- **Response Schema**: Detailed response structure
- **Error Responses**: All possible error responses with examples
- **Rate Limiting**: Applicable rate limits and restrictions
- **Examples**: Real-world usage examples

#### **Schema Documentation**

- **Data Models**: Complete object definitions
- **Validation Rules**: Input validation requirements
- **Enum Values**: All possible enumeration values
- **Nested Objects**: Complex object relationships

### 🔧 Development Tools

#### **API Testing Tools**

- **Postman Collection**: Available at `/docs` for import
- **cURL Examples**: Copy-paste ready commands
- **JavaScript SDK**: Auto-generated client libraries
- **OpenAPI Generators**: Support for multiple languages

#### **Monitoring Integration**

- **Health Checks**: Built-in monitoring endpoints
- **Metrics**: Performance and usage statistics
- **Circuit Breaker Stats**: Open/close events and failure rates

### 📱 Mobile & SDK Support

The OpenAPI specification supports generation of:

- **JavaScript/TypeScript**: Axios-based clients
- **Python**: Requests-based clients
- **Java**: OkHttp-based clients
- **C#**: HttpClient-based clients
- **And many more**: via OpenAPI Generator tools

### 🔧 Documentation Maintenance

The API documentation is:

- ✅ **Auto-Generated**: From code annotations and schemas
- ✅ **Version Controlled**: Tracked with code changes
- ✅ **CI/CD Integrated**: Automatically updated on deployment
- ✅ **Validated**: Ensures documentation matches implementation

## Performance & Monitoring

The API Gateway includes comprehensive performance optimization and monitoring capabilities designed for production environments.

### ⚡ Performance Features

#### **Caching Strategy**

- **Multi-Tier Caching**: Memory and Redis-based caching
- **Intelligent Cache Keys**: Service and operation-specific cache management
- **TTL Management**: Configurable time-to-live for different data types
- **Cache Invalidation**: Smart cache clearing strategies

```javascript
// Cache configuration
{
  strategy: 'redis',           // memory | redis
  ttl: 300,                   // 5 minutes default
  maxSize: 1000,              // Memory cache limit
  keyPrefix: 'weather-api:'   // Redis key prefix
}
```

#### **Connection Pooling**

- **HTTP Keep-Alive**: Persistent connections to downstream services
- **Connection Limits**: Configurable concurrent connection limits
- **Timeout Management**: Request, response, and idle timeouts
- **Retry Logic**: Exponential backoff with jitter

#### **Request Optimization**

- **Parallel Processing**: Concurrent bulk operations
- **Request Deduplication**: Automatic duplicate request handling
- **Payload Compression**: Gzip compression for responses
- **Request Size Limits**: Protection against oversized requests

### 📊 Monitoring & Observability

#### **Health Checks**

```bash
# Basic health check
GET /api/v1/health
{
  "application": "weather-reporter",
  "service": "api-gateway-service",
  "version": "1.0.0",
  "status": "healthy",
  "timestamp": "2025-07-04T10:30:00.000Z"
}

# Detailed health status
GET /api/v1/health/detailed
{
  "status": "healthy",
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "downstreamServices": {
      "weather": "healthy"
    }
  },
  "uptime": 86400,
  "memory": { "used": "245MB", "free": "267MB" }
}
```

#### **Circuit Breaker Monitoring**

```bash
# Circuit breaker health
GET /api/v1/circuit-breaker/health
{
  "weather": {
    "state": "CLOSED",
    "stats": {
      "fires": 150,
      "successes": 145,
      "failures": 5
    }
  }
}

# Circuit breaker metrics
GET /api/v1/circuit-breaker/metrics
{
  "weather": {
    "requests_total": 150,
    "requests_successful": 145,
    "error_rate": 0.033,
    "state": "closed"
  }
}
```

#### **Performance Metrics**

- **Request Latency**: P50, P95, P99 response times
- **Throughput**: Requests per second
- **Error Rates**: Error percentage by service and endpoint
- **Circuit Breaker Stats**: Open/close events and failure rates
- **Cache Hit Rates**: Cache effectiveness metrics

### 📝 Structured Logging

#### **Request Logging Format**

```log
# Morgan format with custom Sri Lankan timezone
192.168.1.100 - - [Thu Jul 05 2025 14:30:45 +0530] [GET] "/api/v1/weather/search HTTP/1.1" [200] 1024 145 ms
```

#### **Log Components**

| Component          | Description                    | Example                             |
| ------------------ | ------------------------------ | ----------------------------------- |
| **Remote Address** | Client IP address              | `192.168.1.100`                     |
| **Date/Time**      | Sri Lankan timezone            | `[Thu Jul 05 2025 14:30:45 +0530]`  |
| **Method**         | HTTP method                    | `[GET]`                             |
| **URL**            | Request path with HTTP version | `"/api/v1/weather/search HTTP/1.1"` |
| **Status**         | Response status code           | `[200]`                             |
| **Content Length** | Response size in bytes         | `1024`                              |
| **Response Time**  | Processing time                | `145 ms`                            |

#### **Environment-Specific Behavior**

```javascript
// Production: Console output only
// - Logs to stdout for cloud platforms
// - Filters out status codes < 400
// - Optimized for log aggregation services

// Development/Test: File-based logging
// - Creates ./logs/ directory automatically
// - Logs all requests regardless of status
// - Includes daily rotation and compression
```

#### **Log Files Structure (Development)**

```
logs/
├── weather-reporter.log              # Current log file
├── 20250702-0000-01-weather-reporter.log.gz  # Compressed daily logs
├── 20250703-0000-01-weather-reporter.log.gz
└── 20250704-0000-01-weather-reporter.log.gz
```

#### **Error Logging**

```javascript
// Error log structure
{
  "level": "error",
  "timestamp": "2025-07-04T10:30:00.000Z",
  "reference": "ERR_1A2B3C4D_X9Y8Z",
  "type": "ECONNREFUSED",
  "message": "Connection refused",
  "path": "/api/v1/weather/search",
  "method": "GET",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "stack": "Error: connect ECONNREFUSED..."
}
```

#### **Log Rotation**

- **Automatic Rotation**: Daily rotation with compression
- **Size Limits**: Maximum 10MB per file
- **Retention**: Configurable retention period
- **Compression**: Gzip compression for archived logs

### 🎯 Performance Optimization

#### **Response Times**

| Endpoint Type      | Target  | Actual   |
| ------------------ | ------- | -------- |
| **Health Check**   | < 10ms  | ✅ 5ms   |
| **Weather Search** | < 200ms | ✅ 145ms |
| **Bulk Weather**   | < 500ms | ✅ 320ms |

#### **Rate Limiting Performance**

- **Redis Backend**: Sub-millisecond rate limit checks
- **Memory Fallback**: Automatic fallback for Redis unavailability
- **Sliding Window**: Accurate rate limiting with sliding windows
- **Burst Handling**: Configurable burst allowances

#### **Caching Performance**

- **Cache Hit Rate**: 85%+ for repeated requests
- **Cache Response Time**: < 5ms for cache hits
- **Memory Usage**: Efficient memory management with LRU eviction
- **Redis Performance**: < 2ms average Redis operations

### 🔧 Performance Tuning

#### **Node.js Optimization**

```javascript
// Process configuration
{
  maxOldSpaceSize: 512,      // Memory limit
  maxSemiSpaceSize: 64,      // Young generation limit
  gcInterval: 100,           // Garbage collection frequency
  keepAlive: true,           // HTTP keep-alive
  timeout: 30000            // Request timeout
}
```

#### **Docker Resource Limits**

```yaml
# Production resource constraints
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
    reservations:
      memory: 256M
      cpus: '0.25'
```

### 📈 Monitoring Integration

#### **Prometheus Metrics** (Ready for integration)

- Custom metrics endpoints
- Circuit breaker metrics
- HTTP request metrics
- Cache performance metrics

#### **APM Integration** (Compatible with)

- **New Relic**: Application performance monitoring
- **DataDog**: Infrastructure and application monitoring
- **Elastic APM**: Elasticsearch-based monitoring
- **Jaeger**: Distributed tracing ready

#### **Alerting Thresholds**

| Metric              | Warning | Critical      |
| ------------------- | ------- | ------------- |
| **Error Rate**      | > 5%    | > 10%         |
| **Response Time**   | > 500ms | > 1000ms      |
| **Circuit Breaker** | Open    | Multiple Open |
| **Memory Usage**    | > 80%   | > 95%         |

### 🚀 Production Readiness

#### **Scalability Features**

- **Horizontal Scaling**: Stateless design for easy scaling
- **Load Balancer Ready**: Health checks and graceful shutdown
- **Database Connections**: Connection pooling and management

#### **Reliability Features**

- **Graceful Shutdown**: Proper cleanup and connection closing
- **Circuit Breakers**: Automatic failure isolation
- **Retry Logic**: Intelligent retry with exponential backoff
- **Timeout Management**: Comprehensive timeout handling

## Contributing

We welcome contributions to the Weather Reporter API Gateway Service! Here's how you can help:

### 🤝 How to Contribute

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes and add tests**
4. **Run the test suite**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### 📋 Development Guidelines

- **Code Style**: Follow existing code patterns and use ESLint/Prettier
- **Testing**: Add comprehensive tests for new functionality
- **Documentation**: Update README and inline documentation for API changes
- **Commits**: Use meaningful commit messages and atomic commits
- **Security**: Follow security best practices and run security scans

### 🔍 Code Quality Standards

- **ESLint**: All code must pass linting checks
- **Test Coverage**: Maintain > 80% test coverage
- **Security**: No ESLint security warnings allowed
- **Performance**: Consider performance impact of changes
- **Documentation**: Keep documentation up-to-date

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

**Author**: Waruna Wimalaweera  
**Email**: warunamadushanka456@gmail.com  
**Version**: 1.0.0  
**Last Updated**: July 5, 2025

### 🙏 Acknowledgments

- **Express.js** community for the robust web framework
- **Opossum** for the excellent circuit breaker implementation
- **Redis** for reliable caching solutions
- **Jest** for comprehensive testing capabilities
- **Docker** for containerization excellence

---

_Built with ❤️ for scalable microservice architectures_

#### **Additional Configurations**

- **`nodemon.dev.json`** - Enhanced development with additional debugging
- **`nodemon.staging.json`** - Staging environment with production-like settings

### 🛠️ Development Commands

#### **Core Development**

```bash
# Standard development with main config
npm run dev

# Development with debug configuration
npm run dev:debug

# Enhanced file watching (src and db only)
npm run dev:watch

# Staging environment testing
npm run dev:staging
```

#### **Code Quality**

```bash
# Lint code with security rules
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check
```

#### **Testing in Development**

```bash
# Unit tests with Jest
npm test

# Test coverage analysis
npm run test:coverage

# API endpoint testing
npm run test:weather-endpoints

# Individual endpoint tests
npm run test:weather-search
npm run test:weather-city
npm run test:bulk-weather
```

### 🔍 File Watching & Hot Reload

#### **Watched Files & Directories**

- **Source Code**: `src/**/*` - All application code
- **Database**: `db/**/*` - Database schemas and migrations
- **Environment**: `.env`, `.env.development` - Configuration changes

#### **Ignored Patterns**

- Test files (`*.test.js`, `*.spec.js`)
- Build artifacts (`dist/`, `build/`)
- Logs (`logs/`, `*.log`)
- Dependencies (`node_modules/`)
- Coverage reports (`coverage/`)

### 🎯 Environment Management

#### **Environment Loading Order**

1. **Base Configuration**: `src/.env`
2. **Environment-Specific**: `src/.env.${NODE_ENV}`
3. **System Variables**: Process environment (highest priority)

#### **Development Environment Variables**

```env
NODE_ENV=development
SERVICE_PORT=9000
LOG_LEVEL=debug
CACHE_STRATEGY=memory
SERVICE_REQUESTS_LIMIT=1000
```

### 📊 Development Monitoring

#### **Health Checks**

- **API Health**: `http://localhost:9000/api/v1/health`
- **Circuit Breaker**: `http://localhost:9000/api/v1/health/circuit-breakers`
- **Metrics**: `http://localhost:9000/api/v1/health/circuit-breakers/metrics`

#### **Documentation**

- **Interactive API Docs**: `http://localhost:9000/docs`
- **OpenAPI Spec**: `http://localhost:9000/docs.json`

### 🐳 Docker Development

#### **Development Container**

```bash
# Start development environment
npm run docker:dev

# View logs
npm run docker:dev:logs

# Stop environment
npm run docker:dev:down
```

#### **Features**

- **Hot Reload**: Volume mounts for live code changes
- **Redis Integration**: Containerized Redis for caching
- **Redis Commander**: GUI for Redis inspection
- **Network Isolation**: Secure container networking

### 🔧 Development Tools Integration

#### **VS Code Integration**

- **ESLint Extension**: Real-time linting
- **Prettier Extension**: Auto-formatting on save
- **Jest Runner**: Interactive test execution
- **Docker Extension**: Container management

#### **Git Workflow**

- **Pre-commit Hooks**: Lint and format checks
- **Branch Protection**: Tests must pass before merge
- **Conventional Commits**: Standardized commit messages

### 🚀 Performance in Development

#### **Optimization Features**

- **Source Maps**: Enhanced debugging with line numbers
- **Memory Management**: Optimized heap size allocation
- **Restart Debouncing**: Prevents rapid restarts during file changes
- **Selective Watching**: Only watches relevant directories

This development setup ensures a smooth and efficient development experience with comprehensive tooling and monitoring capabilities.
