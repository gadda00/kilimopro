#!/bin/bash

# KilimoPRO Development Stop Script
# This script stops all running development services

echo "🛑 Stopping KilimoPRO Development Environment..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to kill process on a port
kill_port() {
    if command_exists lsof; then
        lsof -ti :$1 | xargs kill -9 >/dev/null 2>&1
    elif command_exists fuser; then
        fuser -k $1/tcp >/dev/null 2>&1
    fi
}

# Stop Node.js services
echo "🚀 Stopping Node.js services..."

PORTS=(3000 3001 3002 3003 3004 3005 3006 3007)

for port in "${PORTS[@]}"; do
    if command_exists lsof && lsof -i :$port >/dev/null 2>&1; then
        echo "   Stopping service on port $port..."
        kill_port $port
    fi
done

echo ""

# Stop Docker services
echo "🐳 Stopping Docker services..."

if command_exists docker-compose; then
    if docker-compose -f docker-compose.microservices.yml ps | grep -q "Up"; then
        docker-compose -f docker-compose.microservices.yml down
        echo "   Docker services stopped"
    else
        echo "   No Docker services running"
    fi
else
    echo "${YELLOW}⚠️  Docker Compose not found, skipping Docker services${NC}"
fi

echo ""
echo "${GREEN}✅ All KilimoPRO services have been stopped!${NC}"
echo ""
