# KilimoPRO Development Guide

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: 20 LTS)
- npm 9+ or yarn 1.22+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+
- NATS 2.10+
- Flutter 3.16+ (for mobile development)
- Python 3.10+ (for ML models)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/gadda00/kilimopro.git
   cd kilimopro
   ```

2. **Install dependencies:**
   ```bash
   # Install root dependencies
   npm install
   
   # Install all workspace dependencies
   npm run build:libs
   ```

3. **Set up environment variables:**
   ```bash
   # Copy example environment files
   cp packages/backend/.env.example packages/backend/.env
   cp packages/backend/services/weather-service/.env.example packages/backend/services/weather-service/.env
   cp packages/backend/services/api-gateway/.env.example packages/backend/services/api-gateway/.env
   
   # Edit the files with your configuration
   ```

4. **Set up database:**
   ```bash
   # Start PostgreSQL (if not already running)
   docker-compose -f docker-compose.microservices.yml up -d db
   
   # Run database migrations
   cd packages/backend
   npm run db:generate
   npm run db:push
   ```

5. **Start services:**
   ```bash
   # Start all services
   npm run dev:services
   
   # Or start individual services
   npm run dev:weather
   npm run dev:market
   npm run dev:user
   npm run dev:api-gateway
   ```

6. **Access the API:**
   - API Gateway: `http://localhost:3001`
   - API Docs: `http://localhost:3001/docs`
   - Weather Service: `http://localhost:3002`
   - Market Service: `http://localhost:3003`
   - User Service: `http://localhost:3004`

## Development Workflow

### Starting Services

```bash
# Start all microservices
npm run dev:services

# Start with hot reload
npm run dev:weather    # Weather service
npm run dev:market     # Market service
npm run dev:user       # User service
npm run dev:api-gateway # API Gateway

# Start frontend
npm run dev:frontend

# Start mobile (requires Flutter)
npm run dev:mobile
```

### Stopping Services

```bash
# Stop all services
npm run docker:down

# Or use Ctrl+C in each terminal
```

### Building for Production

```bash
# Build all services
npm run build

# Build individual components
npm run build:libs      # Build shared libraries
npm run build:services  # Build all services
npm run build:frontend  # Build web frontend
npm run build:mobile    # Build mobile app
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests for specific components
npm run test:libs      # Test shared libraries
npm run test:services   # Test all services
```

### Cleaning Up

```bash
# Remove node_modules
npm run clean

# Remove Docker containers and volumes
docker-compose -f docker-compose.microservices.yml down -v
```

## Service Development

### Creating a New Service

1. **Create service directory:**
   ```bash
   mkdir -p packages/backend/services/new-service/src/{routes,services,connectors,utils,config}
   ```

2. **Create package.json:**
   ```json
   {
     "name": "@kilimopro/new-service",
     "version": "1.0.0",
     "private": true,
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "scripts": {
       "dev": "tsx watch src/index.ts",
       "build": "tsc",
       "start": "node dist/index.js"
     },
     "dependencies": {
       "@kilimopro/shared-types": "workspace:*",
       "@kilimopro/logger": "workspace:*",
       "@kilimopro/db-client": "workspace:*",
       "@kilimopro/cache-client": "workspace:*",
       "@kilimopro/message-queue": "workspace:*",
       "fastify": "^4.28.0"
     }
   }
   ```

3. **Create tsconfig.json:**
   ```json
   {
     "compilerOptions": {
       "target": "ES2022",
       "module": "NodeNext",
       "moduleResolution": "NodeNext",
       "lib": ["ES2022"],
       "declaration": true,
       "outDir": "./dist",
       "rootDir": "./src",
       "strict": true,
       "esModuleInterop": true
     },
     "include": ["src/**/*"],
     "exclude": ["node_modules", "dist"]
   }
   ```

4. **Create main file (src/index.ts):**
   ```typescript
   import Fastify from 'fastify';
   import { getLogger } from '@kilimopro/logger';
   
   const logger = getLogger('new-service');
   
   async function start() {
     const app = Fastify();
     
     app.get('/health', async () => ({
       status: 'healthy',
       service: 'new-service',
       version: '1.0.0',
     }));
     
     await app.listen({ port: 3005 });
     logger.info('New service running on port 3005');
   }
   
   start();
   ```

5. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package.json ./
   COPY tsconfig.json ./
   RUN npm ci --only=production
   COPY src/ ./src/
   RUN npm run build
   
   FROM node:18-alpine
   WORKDIR /app
   COPY --from=builder /app/dist/ ./dist/
   COPY --from=builder /app/node_modules/ ./node_modules/
   USER nodejs
   EXPOSE 3005
   CMD ["node", "dist/index.ts"]
   ```

6. **Add to docker-compose:**
   ```yaml
   new-service:
     build:
       context: ./packages/backend/services/new-service
       dockerfile: Dockerfile
     ports:
       - "3005:3005"
     environment:
       - NODE_ENV=development
       - PORT=3005
     depends_on:
       - db
       - redis
       - nats
     restart: unless-stopped
   ```

7. **Register with API Gateway:**
   - Add service URL to API Gateway config
   - Add proxy routes in API Gateway

### Adding a New Endpoint

1. **Define types (in shared-types):**
   ```typescript
   // packages/backend/libs/shared-types/src/new-type.ts
   export const NewTypeSchema = z.object({
     id: z.string(),
     name: z.string(),
     // ... other fields
   });
   
   export type NewType = z.infer<typeof NewTypeSchema>;
   ```

2. **Create route handler:**
   ```typescript
   // packages/backend/services/new-service/src/routes/new-route.ts
   import { FastifyInstance } from 'fastify';
   import { NewTypeSchema } from '@kilimopro/shared-types';
   
   export async function newRoutes(app: FastifyInstance) {
     app.get('/new-endpoint', {
       schema: {
         response: { 200: NewTypeSchema },
       },
     }, async (request, reply) => {
       return { id: '1', name: 'Example' };
     });
   }
   ```

3. **Register route in service:**
   ```typescript
   // packages/backend/services/new-service/src/index.ts
   import { newRoutes } from './routes/new-route.js';
   
   await app.register(newRoutes);
   ```

4. **Proxy through API Gateway:**
   ```typescript
   // packages/backend/services/api-gateway/src/routes/new.ts
   import { createProxyRoute } from '../utils/proxy.js';
   
   export async function newRoutes(app: FastifyInstance) {
     const proxy = createProxyRoute({
       service: 'new',
       path: '/api/new',
     });
     
     app.get('/new-endpoint', proxy);
   }
   ```

5. **Register in API Gateway:**
   ```typescript
   // packages/backend/services/api-gateway/src/index.ts
   import { newRoutes } from './routes/new.js';
   
   await app.register(newRoutes, { prefix: '/api/new' });
   ```

## Database Development

### Schema Changes

1. **Edit Prisma schema:**
   ```prisma
   // packages/backend/prisma/schema.prisma
   model NewModel {
     id    String @id @default(cuid())
     name  String
     // ... other fields
   }
   ```

2. **Generate migration:**
   ```bash
   cd packages/backend
   npx prisma migrate dev --name add_new_model
   ```

3. **Update Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Push to database:**
   ```bash
   npx prisma db push
   ```

### Using Database in Services

```typescript
import { getDatabaseClient } from '@kilimopro/db-client';

const db = getDatabaseClient('service-name');

// Query examples
const users = await db.prisma.user.findMany();
const user = await db.prisma.user.findUnique({ where: { id: '1' } });
const newUser = await db.prisma.user.create({ data: { name: 'John' } });

// Transaction example
await db.transaction(async (tx) => {
  const user = await tx.user.create({ data: { name: 'John' } });
  const profile = await tx.profile.create({ data: { userId: user.id, bio: '...' } });
  return { user, profile };
});
```

## Cache Development

### Using Cache

```typescript
import { getCacheClient } from '@kilimopro/cache-client';

const cache = getCacheClient('service-name');

// Basic operations
await cache.set('key', { data: 'value' }, 3600); // 1 hour TTL
const value = await cache.get<{ data: string }>('key');

// Batch operations
const values = await cache.getMany(['key1', 'key2']);
await cache.setMany([
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2', ttl: 7200 },
]);

// Pattern matching
const keys = await cache.keys('user:*');

// Cache invalidation
await cache.invalidateByPattern('user:123:*');
```

## Message Queue Development

### Publishing Events

```typescript
import { getMessageQueueClient } from '@kilimopro/message-queue';

const mq = getMessageQueueClient('service-name');

// Publish simple message
await mq.publish('user.created', { userId: '123', name: 'John' });

// Publish typed event
await mq.publishEvent({
  id: 'event-123',
  type: 'user.registered',
  timestamp: new Date().toISOString(),
  version: '1.0',
  source: 'user-service',
});
```

### Subscribing to Events

```typescript
import { getMessageQueueClient } from '@kilimopro/message-queue';
import { UserRegisteredEvent } from '@kilimopro/shared-types';

const mq = getMessageQueueClient('service-name');

// Subscribe to all user.registered events
await mq.subscribeEvent<UserRegisteredEvent>('user.registered', async (event) => {
  console.log('User registered:', event);
  // Handle event
});

// Subscribe to specific subject
await mq.subscribe({
  subject: 'weather.alert.created',
  queue: 'weather-alerts',
  callback: async (message) => {
    console.log('Weather alert:', message.data);
    // Handle alert
  },
});
```

## Frontend Development

### Next.js Frontend

The frontend is built with Next.js 15 and React 19.

**Key directories:**
- `packages/frontend/src/pages/` - Page components
- `packages/frontend/src/components/` - Reusable components
- `packages/frontend/src/lib/` - Utilities and API client
- `packages/frontend/src/styles/` - CSS and Tailwind config

**Starting the frontend:**
```bash
cd packages/frontend
npm install
npm run dev
```

**API Client Example:**
```typescript
// packages/frontend/src/lib/api.ts
import { WeatherForecast } from '@kilimopro/shared-types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getWeatherForecast(lat: number, lon: number, days = 7): Promise<WeatherForecast[]> {
  const response = await fetch(`${API_BASE}/api/weather/forecast?lat=${lat}&lon=${lon}&days=${days}`);
  const data = await response.json();
  return data.forecasts;
}
```

### Flutter Mobile App

The mobile app is built with Flutter.

**Key directories:**
- `packages/mobile/lib/screens/` - App screens
- `packages/mobile/lib/widgets/` - Reusable widgets
- `packages/mobile/lib/services/` - Services (API, cache, etc.)
- `packages/mobile/lib/models/` - Data models

**Starting the mobile app:**
```bash
cd packages/mobile
flutter pub get
flutter run
```

**API Service Example:**
```dart
// packages/mobile/lib/services/api_service.dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class ApiService {
  static const String baseUrl = 'http://localhost:3001';
  
  Future<Map<String, dynamic>> getWeatherForecast(double lat, double lon) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/weather/forecast?lat=$lat&lon=$lon'),
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load weather forecast');
    }
  }
}
```

## Machine Learning Development

### Training Models

```bash
cd packages/ml
pip install -r requirements.txt
python training/train_disease_model.py
```

### Exporting Models

```bash
# Export to TensorFlow Lite
python inference/export_tflite.py

# Quantize model
python inference/quantize_model.py
```

### Using Models in Mobile

```dart
// packages/mobile/lib/services/disease_service.dart
import 'package:tflite_flutter/tflite_flutter.dart';

class DiseaseService {
  late Interpreter _interpreter;
  
  Future<void> loadModel() async {
    _interpreter = await Interpreter.fromAsset('crop_disease_v1.tflite');
  }
  
  Future<Map<String, dynamic>> detectDisease(Uint8List image) async {
    // Preprocess image
    // Run inference
    // Postprocess results
    return { 'disease': 'Maize Rust', 'confidence': 0.95 };
  }
}
```

## Testing

### Unit Tests

```typescript
// packages/backend/services/weather-service/src/__tests__/weather.test.ts
import { weatherConnector } from '../connectors/weather';
import { Coordinates } from '@kilimopro/shared-types';

describe('Weather Connector', () => {
  it('should return forecast for valid coordinates', async () => {
    const forecast = await weatherConnector.getForecast({
      location: { lat: -1.2921, lon: 36.8219 }, // Nairobi
      days: 7,
    });
    
    expect(forecast.length).toBeGreaterThan(0);
    expect(forecast[0].tempMin).toBeDefined();
    expect(forecast[0].tempMax).toBeDefined();
  });
});
```

### Integration Tests

```typescript
// packages/backend/services/api-gateway/src/__tests__/api.test.ts
import { build } from '../index';

describe('API Gateway', () => {
  let app: any;
  
  beforeAll(async () => {
    app = await build();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('should return health status', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });
    
    expect(response.statusCode).toBe(200);
    expect(response.json().status).toBe('healthy');
  });
});
```

### End-to-End Tests

```typescript
// packages/frontend/src/__tests__/e2e/weather.test.ts
import { test, expect } from '@playwright/test';

test('weather forecast page', async ({ page }) => {
  await page.goto('/weather');
  await page.fill('[data-testid="latitude"]', '-1.2921');
  await page.fill('[data-testid="longitude"]', '36.8219');
  await page.click('[data-testid="submit"]');
  
  await expect(page.locator('[data-testid="forecast"]')).toBeVisible();
});
```

## Debugging

### Logging

```typescript
import { getLogger } from '@kilimopro/logger';

const logger = getLogger('my-service');

logger.debug('Debug message', { data: 'value' });
logger.info('Info message', { data: 'value' });
logger.warn('Warning message', { data: 'value' });
logger.error('Error message', { error: new Error('Something went wrong') });
```

### Debugging Services

1. **Check logs:**
   ```bash
   docker-compose -f docker-compose.microservices.yml logs -f weather-service
   ```

2. **Health check:**
   ```bash
   curl http://localhost:3002/health
   ```

3. **API docs:**
   ```bash
   # Open in browser
   http://localhost:3002/docs
   ```

4. **Test endpoints:**
   ```bash
   curl -X GET http://localhost:3002/api/weather/forecast?lat=-1.2921&lon=36.8219
   ```

### Debugging Database

1. **Connect to PostgreSQL:**
   ```bash
   psql postgresql://kilimopro:kilimopro@localhost:5432/kilimopro
   ```

2. **Run queries:**
   ```sql
   SELECT * FROM users;
   SELECT * FROM weather_forecasts LIMIT 10;
   ```

3. **Prisma Studio:**
   ```bash
   cd packages/backend
   npx prisma studio
   ```

### Debugging Cache

1. **Connect to Redis:**
   ```bash
   redis-cli -h localhost -p 6379
   ```

2. **Run commands:**
   ```bash
   KEYS *
   GET weather:forecast:-1.2921,36.8219:7
   FLUSHALL
   ```

### Debugging Message Queue

1. **Connect to NATS:**
   ```bash
   nats --server nats://localhost:4222
   ```

2. **Subscribe to messages:**
   ```bash
   nats sub 'weather.alert.created'
   ```

3. **Publish test message:**
   ```bash
   nats pub 'test.message' '{"hello": "world"}'
   ```

## Performance Optimization

### Caching Strategies

1. **Request Caching:**
   ```typescript
   // Cache API responses
   const cacheKey = `weather:forecast:${lat},${lon}:${days}`;
   const cached = await cache.get(cacheKey);
   if (cached) return cached;
   
   const data = await fetchData();
   await cache.set(cacheKey, data, 3600); // 1 hour
   return data;
   ```

2. **Database Query Caching:**
   ```typescript
   // Cache database query results
   const cacheKey = `db:users:${userId}`;
   const cached = await cache.get(cacheKey);
   if (cached) return cached;
   
   const user = await db.prisma.user.findUnique({ where: { id: userId } });
   await cache.set(cacheKey, user, 300); // 5 minutes
   return user;
   ```

3. **Rate Limiting:**
   ```typescript
   // Per-user rate limiting
   await app.register(rateLimit, {
     max: 100,
     timeWindow: '1 minute',
     keyGenerator: (req) => (req as any).user?.id || req.ip,
   });
   ```

### Database Optimization

1. **Add Indexes:**
   ```prisma
   model User {
     id    String @id @default(cuid())
     phone String @unique
     name  String?
     
     @@index([phone])
     @@index([name])
   }
   ```

2. **Use Pagination:**
   ```typescript
   const users = await db.prisma.user.findMany({
     skip: (page - 1) * limit,
     take: limit,
   });
   ```

3. **Select Only Needed Fields:**
   ```typescript
   const users = await db.prisma.user.findMany({
     select: {
       id: true,
       name: true,
       // Don't select sensitive fields
     },
   });
   ```

## Security Best Practices

### Authentication

1. **Always authenticate:**
   ```typescript
   app.get('/protected', { preHandler: authenticate }, async (req, reply) => {
     // Only authenticated users can access this
   });
   ```

2. **Use HTTPS:**
   ```typescript
   // In production, always use HTTPS
   const config = {
     schemes: ['https'],
   };
   ```

### Authorization

1. **Check permissions:**
   ```typescript
   if (!request.user.permissions.includes('admin')) {
     throw createForbiddenError('Admin access required');
   }
   ```

2. **Resource ownership:**
   ```typescript
   const userId = request.user.id;
   const farm = await db.prisma.farm.findFirst({
     where: { id: farmId, userId },
   });
   
   if (!farm) {
     throw createForbiddenError('Access denied');
   }
   ```

### Input Validation

1. **Validate all inputs:**
   ```typescript
   const schema = z.object({
     lat: z.number().min(-90).max(90),
     lon: z.number().min(-180).max(180),
   });
   
   const input = schema.parse(request.query);
   ```

2. **Sanitize outputs:**
   ```typescript
   function sanitizeUser(user: any) {
     const { password, ...sanitized } = user;
     return sanitized;
   }
   ```

### Secure Headers

```typescript
import helmet from '@fastify/helmet';

await app.register(helmet);
```

## Deployment

### Docker Deployment

1. **Build images:**
   ```bash
   npm run docker:build
   ```

2. **Start services:**
   ```bash
   npm run docker:up
   ```

3. **Stop services:**
   ```bash
   npm run docker:down
   ```

4. **View logs:**
   ```bash
   npm run docker:logs
   ```

### Kubernetes Deployment

1. **Apply manifests:**
   ```bash
   kubectl apply -f infra/k8s/
   ```

2. **Check status:**
   ```bash
   kubectl get pods
   kubectl get services
   ```

3. **View logs:**
   ```bash
   kubectl logs <pod-name>
   ```

### Environment Variables

Create `.env` files for each service:

```bash
# packages/backend/services/weather-service/.env
NODE_ENV=production
PORT=3002
DATABASE_URL=postgresql://kilimopro:kilimopro@db:5432/kilimopro
REDIS_HOST=redis
REDIS_PORT=6379
NATS_SERVERS=nats://nats:4222
OPENWEATHER_API_KEY=your_api_key
```

## Monitoring

### Health Checks

Each service exposes a health check endpoint:

```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
```

### Metrics

Services expose Prometheus metrics (to be added):

```bash
curl http://localhost:3001/metrics
```

### Logging

Logs are written to:
- Console (stdout)
- Files (`logs/error.log`, `logs/combined.log`)

View logs:

```bash
docker-compose logs -f
```

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   lsof -i :3001
   kill -9 <PID>
   ```

2. **Database connection failed:**
   ```bash
   # Check if database is running
   docker ps
   
   # Check database logs
   docker logs db
   
   # Test connection
   psql postgresql://kilimopro:kilimopro@localhost:5432/kilimopro
   ```

3. **Redis connection failed:**
   ```bash
   # Check if Redis is running
   docker ps
   
   # Check Redis logs
   docker logs redis
   
   # Test connection
   redis-cli -h localhost -p 6379 ping
   ```

4. **NATS connection failed:**
   ```bash
   # Check if NATS is running
   docker ps
   
   # Check NATS logs
   docker logs nats
   
   # Test connection
   nats --server nats://localhost:4222
   ```

5. **TypeScript errors:**
   ```bash
   # Build to check for TypeScript errors
   npm run build
   
   # Or use tsx for development
   npm run dev
   ```

### Debugging Tips

1. **Check service logs:**
   ```bash
   docker-compose logs -f <service-name>
   ```

2. **Test API endpoints:**
   ```bash
   curl -v http://localhost:3001/api/weather/forecast?lat=-1.2921&lon=36.8219
   ```

3. **Check database:**
   ```bash
   psql postgresql://kilimopro:kilimopro@localhost:5432/kilimopro
   ```

4. **Check cache:**
   ```bash
   redis-cli -h localhost -p 6379
   KEYS *
   ```

5. **Check message queue:**
   ```bash
   nats --server nats://localhost:4222
   nats sub '>'
   ```

## Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Make** your changes
4. **Test** your changes (`npm test`)
5. **Lint** your code (`npm run lint`)
6. **Commit** your changes (`git commit -m 'Add amazing feature'`)
7. **Push** to the branch (`git push origin feature/amazing-feature`)
8. **Open** a Pull Request

### Pull Request Checklist

- [ ] Code follows project conventions
- [ ] All tests pass
- [ ] No breaking changes
- [ ] Documentation updated
- [ ] Security considerations addressed
- [ ] Performance considerations addressed

### Code Review Process

1. **Self-review**: Check your own code before requesting review
2. **Request review**: Assign reviewers and request review
3. **Address feedback**: Make requested changes
4. **Merge**: Once approved, merge the PR

## Resources

- [Fastify Documentation](https://www.fastify.io/docs/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [NATS Documentation](https://nats.io/documentation/)
- [Redis Documentation](https://redis.io/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Flutter Documentation](https://docs.flutter.dev/)
- [TensorFlow Lite Documentation](https://www.tensorflow.org/lite)

## License

MIT License - see [LICENSE](LICENSE) for details.
