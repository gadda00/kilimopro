# KilimoPRO Architecture

## Overview

KilimoPRO is built on a **microservices architecture** with the following key components:

- **API Gateway**: Single entry point for all client requests
- **Microservices**: Independent services for each domain (weather, market, user, etc.)
- **Message Queue**: NATS for event-driven communication
- **Cache**: Redis for performance optimization
- **Database**: PostgreSQL with Prisma ORM
- **Shared Libraries**: Common utilities and types

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│  Web (Next.js)   │  Mobile (Flutter)│  SMS/USSD        │  Voice        │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY (Port 3001)                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  • Authentication & Authorization                                ││
│  │  • Request Routing                                               ││
│  │  • Rate Limiting                                                 ││
│  │  • Request/Response Transformation                              ││
│  │  • Caching (Redis)                                               ││
│  │  • Circuit Breaking                                              ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                      │
          ┌───────────────────────┬───────────────────────┬───────────┐
          ▼                       ▼                       ▼           ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐   ┌───────┐
│ WEATHER SERVICE  │   │  MARKET SERVICE  │   │  USER SERVICE    │   │ ...   │
│ (Port 3002)      │   │ (Port 3003)      │   │ (Port 3004)      │   │       │
├─────────────────┤   ├─────────────────┤   ├─────────────────┤   ├───────┤
│ • Forecast      │   │ • Prices        │   │ • Profiles      │   │       │
│ • Alerts        │   │ • Trends        │   │ • Auth          │   │       │
│ • NDVI          │   │ • Forecast      │   │ • Sessions      │   │       │
│ • Rainfall      │   │ • Markets       │   │ • Permissions   │   │       │
└─────────────────┘   └─────────────────┘   └─────────────────┘   └───────┘
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           SHARED SERVICES                               │
├─────────────────┬─────────────────┬─────────────────┬───────────────┤
│  PostgreSQL     │  Redis           │  NATS            │  Monitoring    │
│  (Port 5432)    │  (Port 6379)     │  (Port 4222)     │  (Prometheus)  │
└─────────────────┴─────────────────┴─────────────────┴───────────────┘
```

## Service Structure

### API Gateway (`packages/backend/services/api-gateway/`)

The API Gateway is the single entry point for all client requests. It handles:

- **Authentication & Authorization**: JWT validation, role-based access control
- **Request Routing**: Routes requests to appropriate microservices
- **Rate Limiting**: Per-user and per-endpoint rate limiting
- **Caching**: Response caching with Redis
- **Request/Response Transformation**: Data formatting, validation
- **Circuit Breaking**: Prevents cascading failures
- **API Documentation**: Swagger/OpenAPI documentation

**Endpoints:**
- `/api/auth/*` - Authentication
- `/api/weather/*` - Weather data
- `/api/market/*` - Market data
- `/api/users/*` - User management
- `/api/advisory/*` - Advisory services
- `/api/disease/*` - Disease detection
- `/api/farm/*` - Farm management

### Weather Service (`packages/backend/services/weather-service/`)

Provides weather-related data and forecasts.

**Endpoints:**
- `GET /api/weather/forecast` - Get weather forecast
- `GET /api/weather/alerts` - Get weather alerts
- `GET /api/weather/ndvi` - Get NDVI (crop health) data
- `GET /api/weather/rainfall` - Get historical rainfall data

**Data Sources:**
- KAOP (Kenya Agricultural Observatory Platform)
- OpenWeatherMap (fallback)
- CHIRPS (satellite rainfall)
- Google Earth Engine (NDVI)

### Market Service (`packages/backend/services/market-service/`)

Provides market price data and analysis.

**Endpoints:**
- `GET /api/market/prices` - Get market prices
- `GET /api/market/trend` - Get price trends
- `GET /api/market/forecast` - Get price forecasts
- `GET /api/market/markets` - Get market information

**Data Sources:**
- AIRC (Agricultural Information and Resource Centre)
- FAOSTAT
- Crowdsourced data

### User Service (`packages/backend/services/user-service/`)

Manages user profiles, authentication, and authorization.

**Endpoints:**
- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## Shared Libraries

### `@kilimopro/shared-types` (`packages/backend/libs/shared-types/`)

Central type definitions used across all services:

- Common types (pagination, location, etc.)
- Error types and error handling
- Weather types
- Market types
- User types
- Disease types
- Advisory types

### `@kilimopro/logger` (`packages/backend/libs/logger/`)

Structured logging with:

- Multiple log levels (debug, info, warn, error)
- Request context tracking
- Structured JSON output
- File and console transports

### `@kilimopro/db-client` (`packages/backend/libs/db-client/`)

Database client wrapper with:

- Connection pooling
- Transaction support
- Query helpers
- Health checks
- Metrics

### `@kilimopro/cache-client` (`packages/backend/libs/cache-client/`)

Redis cache client with:

- Basic operations (get, set, delete)
- Batch operations
- Pattern matching
- TTL management
- Cache invalidation
- Statistics

### `@kilimopro/message-queue` (`packages/backend/libs/message-queue/`)

NATS message queue client with:

- Connection management
- Publishing messages
- Subscribing to topics
- JetStream support (for persistence)
- Event-driven patterns
- Statistics

## Communication Patterns

### 1. Request-Response (Synchronous)

```
Client → API Gateway → Microservice → API Gateway → Client
```

Used for:
- REST API endpoints
- Direct service-to-service communication
- Real-time requests

### 2. Event-Driven (Asynchronous)

```
Service A → Message Queue → Service B
                 ↓
            Service C
```

Used for:
- Weather alerts
- Market price updates
- User registration
- Any event that multiple services need to know about

### 3. Cache-Aside Pattern

```
Client → API Gateway → Cache → Microservice
                     ↓
                (if cache miss)
```

Used for:
- Weather forecasts
- Market prices
- Any data that changes infrequently

## Data Flow

### Weather Forecast Request

1. Client sends request to `/api/weather/forecast?lat=X&lon=Y`
2. API Gateway:
   - Validates request
   - Checks rate limit
   - Checks cache
   - Forwards request to Weather Service
3. Weather Service:
   - Checks cache
   - Fetches from KAOP (if available)
   - Falls back to OpenWeatherMap
   - Caches response
   - Returns forecast
4. API Gateway:
   - Caches response
   - Returns to client

### Weather Alert Generation

1. Weather Service fetches new forecast data
2. Weather Service analyzes forecast for alerts (frost, heavy rain, etc.)
3. Weather Service publishes `weather.alert.created` event to Message Queue
4. API Gateway subscribes to `weather.alert.created` events
5. API Gateway pushes alerts to relevant users via:
   - Push notifications
   - SMS
   - Email
   - In-app notifications

## Deployment

### Development

```bash
# Start all services
npm run dev:services

# Or start individual services
npm run dev:weather
npm run dev:market
npm run dev:user
npm run dev:api-gateway
```

### Production (Docker)

```bash
# Build images
docker-compose -f docker-compose.microservices.yml build

# Start services
docker-compose -f docker-compose.microservices.yml up -d

# View logs
docker-compose -f docker-compose.microservices.yml logs -f
```

### Kubernetes

For production deployments, use the Kubernetes manifests in `infra/k8s/`.

## Service Discovery

Services communicate with each other using environment variables:

```
WEATHER_SERVICE_URL=http://weather-service:3002
MARKET_SERVICE_URL=http://market-service:3003
USER_SERVICE_URL=http://user-service:3004
NATS_SERVERS=nats://nats:4222
REDIS_HOST=redis
REDIS_PORT=6379
DATABASE_URL=postgresql://kilimopro:kilimopro@db:5432/kilimopro
```

## Monitoring

### Metrics

Each service exposes:
- Health check endpoint (`/health`)
- Prometheus metrics (to be added)
- Request/response logging

### Logging

Structured logs are written to:
- Console (stdout)
- Files (`logs/error.log`, `logs/combined.log`)

### Tracing

Request IDs are propagated through all services for tracing.

## Scaling

### Horizontal Scaling

Each microservice can be scaled independently:

```bash
# Scale weather service to 3 instances
docker-compose -f docker-compose.microservices.yml up -d --scale weather-service=3
```

### Database Scaling

- **Read replicas** for read-heavy workloads
- **Connection pooling** (PgBouncer)
- **Database sharding** by region (future)

### Cache Scaling

- **Redis Cluster** for horizontal scaling
- **Cache sharding** by data type

## Security

### Authentication

- **JWT** for stateless authentication
- **Refresh tokens** for long-lived sessions
- **Token blacklisting** for logout/invalidation

### Authorization

- **Role-based access control (RBAC)**
- **Permission-based** for fine-grained control
- **Resource-level permissions**

### Data Protection

- **HTTPS** for all external communication
- **Encryption at rest** for sensitive data
- **Input validation** for all API endpoints
- **Rate limiting** to prevent abuse

## Error Handling

### Error Types

- **4xx Client Errors**: Invalid requests, authentication failures
- **5xx Server Errors**: Internal errors, service unavailable

### Error Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error message",
    "details": { ... },
    "timestamp": "2024-01-01T00:00:00.000Z",
    "requestId": "unique-request-id"
  },
  "meta": {
    "requestId": "unique-request-id",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/endpoint",
    "method": "GET"
  }
}
```

### Error Codes

- `BAD_REQUEST`: Invalid request data
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Data validation failed
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error
- `SERVICE_UNAVAILABLE`: Service temporarily unavailable

## Performance Optimization

### Caching Strategy

| Data Type | TTL | Cache Key Pattern |
|-----------|-----|-------------------|
| Weather Forecast | 1 hour | `forecast:{lat},{lon}:{days}` |
| Weather Alerts | 30 minutes | `alerts:{lat},{lon}:{days}` |
| NDVI | 24 hours | `ndvi:{lat},{lon}` |
| Rainfall | 1 hour | `rainfall:{lat},{lon}:{days}` |
| Market Prices | 15 minutes | `market:prices:{filters}` |
| Market Trends | 1 hour | `market:trend:{commodity}:{period}` |
| User Sessions | 5 minutes | `session:{token}` |

### Database Optimization

- **Indexes** on frequently queried columns
- **Partitioning** for time-series data
- **Materialized views** for common aggregations
- **Connection pooling** for database connections

### API Optimization

- **Pagination** for all list endpoints
- **Field selection** to return only requested data
- **Compression** (gzip/brotli) for responses
- **Edge caching** for static assets

## Future Architecture Improvements

### 1. Service Mesh

Implement Istio or Linkerd for:
- Service-to-service authentication
- Traffic management
- Observability
- Policy enforcement

### 2. Event Sourcing

Implement event sourcing for:
- Audit trails
- Time travel debugging
- Event replay

### 3. CQRS

Separate read and write models for:
- Better performance
- Scalability
- Flexibility

### 4. Multi-Region Deployment

Deploy services in multiple regions for:
- Lower latency
- Disaster recovery
- Compliance

### 5. Edge Computing

Deploy services at the edge for:
- Lower latency
- Reduced origin load
- Global scalability

## Directory Structure

```
kilimopro/
├── packages/
│   ├── backend/
│   │   ├── libs/                    # Shared libraries
│   │   │   ├── shared-types/       # Type definitions
│   │   │   ├── logger/             # Logging
│   │   │   ├── db-client/          # Database client
│   │   │   ├── cache-client/       # Cache client
│   │   │   └── message-queue/      # Message queue client
│   │   └── services/               # Microservices
│   │       ├── api-gateway/        # API Gateway
│   │       ├── weather-service/    # Weather Service
│   │       ├── market-service/     # Market Service
│   │       ├── user-service/       # User Service
│   │       ├── advisory-service/   # Advisory Service
│   │       ├── disease-service/    # Disease Service
│   │       └── farm-service/       # Farm Service
│   ├── frontend/                   # Web application (Next.js)
│   ├── mobile/                     # Mobile application (Flutter)
│   └── ml/                         # Machine learning models
└── infra/
    ├── docker/                    # Dockerfiles
    └── k8s/                       # Kubernetes manifests
```

## Best Practices

### 1. Service Design

- **Single Responsibility**: Each service should do one thing well
- **Loose Coupling**: Services should be independent
- **High Cohesion**: Related functionality should be together
- **Stateless**: Services should be stateless where possible

### 2. API Design

- **RESTful**: Use REST conventions for endpoints
- **Consistent**: Use consistent naming and patterns
- **Versioned**: Version APIs for backward compatibility
- **Documented**: Document all endpoints with Swagger/OpenAPI

### 3. Data Management

- **Ownership**: Each service owns its data
- **Isolation**: Services should not access each other's databases directly
- **Eventual Consistency**: Use events for cross-service data updates
- **Idempotency**: Design APIs to be idempotent

### 4. Error Handling

- **Consistent**: Use consistent error formats
- **Informative**: Provide useful error messages
- **Actionable**: Include information to help clients recover
- **Logged**: Log all errors for debugging

### 5. Performance

- **Cache**: Cache frequently accessed data
- **Optimize**: Optimize database queries
- **Compress**: Compress responses
- **Monitor**: Monitor performance metrics

### 6. Security

- **Validate**: Validate all inputs
- **Sanitize**: Sanitize outputs
- **Authenticate**: Authenticate all requests
- **Authorize**: Authorize access to resources
- **Encrypt**: Encrypt sensitive data

## Troubleshooting

### Common Issues

1. **Service not starting**: Check logs, verify dependencies, check environment variables
2. **Connection refused**: Verify service is running, check network connectivity
3. **Authentication failures**: Verify JWT secret, check token expiration
4. **Rate limiting**: Check rate limit configuration, verify client IP
5. **Cache misses**: Verify Redis is running, check cache TTL

### Debugging Tools

- **Logs**: `docker-compose logs -f <service>`
- **Health checks**: `curl http://localhost:<port>/health`
- **API docs**: `http://localhost:<port>/docs`
- **Database**: `psql postgresql://kilimopro:kilimopro@localhost:5432/kilimopro`
- **Redis**: `redis-cli -h localhost -p 6379`
- **NATS**: `nats --server nats://localhost:4222`

## Contributing

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** your changes
5. **Submit** a pull request

### Code Review Checklist

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance considerations addressed

## License

MIT License - see [LICENSE](LICENSE) for details.
