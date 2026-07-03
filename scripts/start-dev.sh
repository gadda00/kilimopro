#!/bin/bash

# KilimoPRO Development Start Script
# This script starts all the necessary services for development

set -e

echo "🚀 Starting KilimoPRO Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
    if command_exists lsof; then
        lsof -i :$1 >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -tuln | grep :$1 >/dev/null 2>&1
    elif command_exists ss; then
        ss -tuln | grep :$1 >/dev/null 2>&1
    else
        return 1
    fi
}

# Function to kill process on a port
kill_port() {
    if command_exists lsof; then
        lsof -ti :$1 | xargs kill -9 >/dev/null 2>&1
    elif command_exists fuser; then
        fuser -k $1/tcp >/dev/null 2>&1
    fi
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists docker; then
    echo "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    echo "   https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command_exists docker-compose; then
    echo "${RED}❌ Docker Compose is not installed. Please install Docker Compose.${NC}"
    echo "   https://docs.docker.com/compose/install/"
    exit 1
fi

if ! command_exists node; then
    echo "${RED}❌ Node.js is not installed. Please install Node.js 18+.${NC}"
    echo "   https://nodejs.org/"
    exit 1
fi

if ! command_exists npm; then
    echo "${RED}❌ npm is not installed. Please install npm.${NC}"
    exit 1
fi

echo "${GREEN}✅ All prerequisites are installed!${NC}"
echo ""

# Start Docker services
echo "🐳 Starting Docker services..."

# Check if services are already running
if docker-compose -f docker-compose.microservices.yml ps | grep -q "Up"; then
    echo "${YELLOW}⚠️  Docker services are already running.${NC}"
    read -p "Do you want to restart them? (y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Restarting Docker services..."
        docker-compose -f docker-compose.microservices.yml down
        sleep 2
    else
        echo "⏭️  Skipping Docker services restart."
    fi
fi

# Start infrastructure services
echo "📦 Starting infrastructure services (PostgreSQL, Redis, NATS)..."
docker-compose -f docker-compose.microservices.yml up -d db redis nats

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are healthy
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    DB_HEALTHY=$(docker-compose -f docker-compose.microservices.yml exec db pg_isready -U kilimopro 2>/dev/null || echo "false")
    REDIS_HEALTHY=$(docker-compose -f docker-compose.microservices.yml exec redis redis-cli ping 2>/dev/null || echo "false")
    NATS_HEALTHY=$(curl -s http://localhost:8222/healthz 2>/dev/null || echo "false")
    
    if [[ "$DB_HEALTHY" == *"accepting connections"* ]] && \
       [[ "$REDIS_HEALTHY" == "PONG" ]] && \
       [[ "$NATS_HEALTHY" == "OK" ]]; then
        echo "${GREEN}✅ All infrastructure services are healthy!${NC}"
        break
    fi
    
    if [ $((ATTEMPT % 5)) -eq 0 ]; then
        echo "⏳ Still waiting... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    fi
    
    sleep 2
done

if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "${RED}❌ Failed to start infrastructure services.${NC}"
    echo "   Please check Docker logs:"
    echo "   docker-compose -f docker-compose.microservices.yml logs"
    exit 1
fi

echo ""

# Install dependencies
echo "📦 Installing dependencies..."

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "🔄 Installing root dependencies..."
    npm install
fi

# Build shared libraries
echo "🔄 Building shared libraries..."
npm run build:libs 2>/dev/null || echo "${YELLOW}⚠️  Failed to build shared libraries, continuing...${NC}"

echo ""

# Start microservices
echo "🚀 Starting microservices..."

# Kill any existing processes
for port in 3001 3002 3003 3004 3005; do
    if port_in_use $port; then
        echo "${YELLOW}⚠️  Port $port is in use. Killing existing process...${NC}"
        kill_port $port
        sleep 1
    fi
done

# Start services in background
SERVICES=()

# Start API Gateway
if [ ! -f "packages/backend/services/api-gateway/dist/index.js" ]; then
    echo "🔄 Building API Gateway..."
    cd packages/backend/services/api-gateway
    npm run build
    cd ../../../..
fi

echo "🚀 Starting API Gateway (Port 3001)..."
npm run dev:api-gateway &
SERVICES+=($!)
echo "   PID: $!"

# Start Weather Service
if [ ! -f "packages/backend/services/weather-service/dist/index.js" ]; then
    echo "🔄 Building Weather Service..."
    cd packages/backend/services/weather-service
    npm run build
    cd ../../../..
fi

echo "🚀 Starting Weather Service (Port 3002)..."
npm run dev:weather &
SERVICES+=($!)
echo "   PID: $!"

echo ""
echo "${GREEN}✅ Development environment is starting up!${NC}"
echo ""
echo "📊 Services:"
echo "   ${BLUE}API Gateway${NC}:   http://localhost:3001"
echo "   ${BLUE}Weather Service${NC}: http://localhost:3002"
echo "   ${BLUE}API Docs${NC}:       http://localhost:3001/docs"
echo ""
echo "🔌 Infrastructure:"
echo "   ${BLUE}PostgreSQL${NC}:     localhost:5432"
echo "   ${BLUE}Redis${NC}:          localhost:6379"
echo "   ${BLUE}NATS${NC}:           localhost:4222"
echo ""
echo "⏳ Waiting for services to be ready..."
echo ""

# Wait for services to be ready
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    ATTEMPT=$((ATTEMPT + 1))
    
    GATEWAY_HEALTHY=$(curl -s http://localhost:3001/health 2>/dev/null | grep -q '"status":"healthy"' && echo "true" || echo "false")
    WEATHER_HEALTHY=$(curl -s http://localhost:3002/health 2>/dev/null | grep -q '"status":"healthy"' && echo "true" || echo "false")
    
    if [[ "$GATEWAY_HEALTHY" == "true" ]] && [[ "$WEATHER_HEALTHY" == "true" ]]; then
        echo "${GREEN}✅ All services are ready!${NC}"
        echo ""
        break
    fi
    
    if [ $((ATTEMPT % 5)) -eq 0 ]; then
        echo "⏳ Still waiting... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
    fi
    
    sleep 2
done

if [ $ATTEMPT -ge $MAX_ATTEMPTS ]; then
    echo "${YELLOW}⚠️  Services took too long to start. Check the logs above.${NC}"
    echo ""
fi

# Test endpoints
echo "🧪 Testing endpoints..."

if curl -s http://localhost:3001/health >/dev/null; then
    echo "${GREEN}✅ API Gateway is responding${NC}"
else
    echo "${RED}❌ API Gateway is not responding${NC}"
fi

if curl -s http://localhost:3002/health >/dev/null; then
    echo "${GREEN}✅ Weather Service is responding${NC}"
else
    echo "${RED}❌ Weather Service is not responding${NC}"
fi

if curl -s "http://localhost:3001/api/weather/forecast?lat=-1.2921&lon=36.8219" >/dev/null; then
    echo "${GREEN}✅ Weather forecast endpoint is working${NC}"
else
    echo "${RED}❌ Weather forecast endpoint is not working${NC}"
fi

echo ""
echo "${GREEN}🎉 KilimoPRO Development Environment is Ready!${NC}"
echo ""
echo "📝 Commands:"
echo "   ${BLUE}View logs${NC}:           docker-compose -f docker-compose.microservices.yml logs -f"
echo "   ${BLUE}Stop services${NC}:       ./scripts/stop-dev.sh"
echo "   ${BLUE}Test API${NC}:            curl http://localhost:3001/api/weather/forecast?lat=-1.2921&lon=36.8219"
echo "   ${BLUE}API Docs${NC}:           http://localhost:3001/docs"
echo ""
echo "💡 Tips:"
echo "   - Press Ctrl+C to stop all services"
echo "   - Use 'npm run dev:services' to start all services"
echo "   - Use 'npm run docker:logs' to view Docker logs"
echo ""

# Clean up on exit
trap "
    echo ''
    echo '🛑 Stopping services...'
    for pid in \"${SERVICES[@]}\"; do
        if kill -0 \$pid 2>/dev/null; then
            kill \$pid 2>/dev/null
        fi
    done
    echo '✅ Services stopped'
" EXIT

# Keep the script running
wait
