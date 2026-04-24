#!/bin/bash

# ============================================
# EnergyGrid Pro - Startup Script
# Grid Stability & Social Equity Platform
# ============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}⚡ ============================================${NC}"
echo -e "${CYAN}⚡  EnergyGrid Pro - Starting Platform         ${NC}"
echo -e "${CYAN}⚡  Grid Stability & Social Equity             ${NC}"
echo -e "${CYAN}⚡ ============================================${NC}"
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

BACKEND_PORT=${BACKEND_PORT:-3001}
FRONTEND_PORT=${FRONTEND_PORT:-3000}
DB_NAME=${DB_NAME:-energy_grid_db}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

# ============================================
# Step 1: Clean up used ports
# ============================================
echo -e "${YELLOW}🧹 Cleaning up used ports...${NC}"

cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "${YELLOW}   Killing processes on port $port...${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 2
    # Double-check port is actually free
    local remaining=$(lsof -ti :$port 2>/dev/null || true)
    if [ -n "$remaining" ]; then
      echo -e "${RED}   Port $port still in use, retrying...${NC}"
      echo "$remaining" | xargs kill -9 2>/dev/null || true
      sleep 2
    fi
  fi
}

cleanup_port $BACKEND_PORT
cleanup_port $FRONTEND_PORT

echo -e "${GREEN}   Ports $BACKEND_PORT and $FRONTEND_PORT are free${NC}"

# ============================================
# Step 2: Check PostgreSQL
# ============================================
echo ""
echo -e "${YELLOW}🐘 Checking PostgreSQL...${NC}"

if command -v pg_isready &> /dev/null; then
  if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
    echo -e "${GREEN}   PostgreSQL is running${NC}"
  else
    echo -e "${YELLOW}   Starting PostgreSQL...${NC}"
    if command -v brew &> /dev/null; then
      brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
    fi
    sleep 2
    if pg_isready -h $DB_HOST -p $DB_PORT > /dev/null 2>&1; then
      echo -e "${GREEN}   PostgreSQL started successfully${NC}"
    else
      echo -e "${RED}   ⚠ PostgreSQL may not be running. Please start it manually.${NC}"
    fi
  fi
else
  echo -e "${YELLOW}   pg_isready not found, assuming PostgreSQL is running${NC}"
fi

# ============================================
# Step 3: Create database if not exists
# ============================================
echo ""
echo -e "${YELLOW}📦 Setting up database...${NC}"

if ! PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1; then
  echo -e "${YELLOW}   Creating database '$DB_NAME'...${NC}"
  PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME 2>/dev/null || \
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
fi
echo -e "${GREEN}   Database '$DB_NAME' ready${NC}"

# ============================================
# Step 4: Install dependencies
# ============================================
echo ""
echo -e "${YELLOW}📥 Installing dependencies...${NC}"

cd backend
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo -e "${BLUE}   Installing backend dependencies...${NC}"
  npm install --silent 2>&1 | tail -1
fi
cd ..

cd frontend
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
  echo -e "${BLUE}   Installing frontend dependencies...${NC}"
  npm install --silent 2>&1 | tail -1
fi
cd ..

echo -e "${GREEN}   Dependencies installed${NC}"

# ============================================
# Step 5: Seed database
# ============================================
echo ""
echo -e "${YELLOW}🌱 Seeding database with sample data...${NC}"

cd backend
node seed.js
cd ..

# Small delay to ensure seed file writes are fully flushed
sleep 2

# ============================================
# Step 6: Start services with hot reload
# ============================================
echo ""
echo -e "${PURPLE}🚀 Starting services with hot reload...${NC}"
echo ""

# Start backend with nodemon (hot reload, ignore seed.js)
echo -e "${BLUE}   Starting backend on port $BACKEND_PORT (nodemon)...${NC}"
npx nodemon --watch backend --ignore backend/seed.js --ext js,json backend/server.js &
BACKEND_PID=$!

# Wait for backend to start
sleep 2

# Start frontend with Vite (hot reload built-in)
echo -e "${BLUE}   Starting frontend on port $FRONTEND_PORT (vite)...${NC}"
(cd frontend && npx vite --port $FRONTEND_PORT --host) &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}⚡ EnergyGrid Pro is running!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${CYAN}   Frontend:  http://localhost:$FRONTEND_PORT${NC}"
echo -e "${CYAN}   Backend:   http://localhost:$BACKEND_PORT${NC}"
echo -e "${CYAN}   API Docs:  http://localhost:$BACKEND_PORT/api/health${NC}"
echo ""
echo -e "${YELLOW}   Login Credentials:${NC}"
echo -e "${YELLOW}   Email:    admin@energygrid.com${NC}"
echo -e "${YELLOW}   Password: admin123${NC}"
echo ""
echo -e "${PURPLE}   Hot reload is enabled for both frontend and backend.${NC}"
echo -e "${PURPLE}   Press Ctrl+C to stop all services.${NC}"
echo ""

# Trap cleanup
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down EnergyGrid Pro...${NC}"
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  cleanup_port $BACKEND_PORT
  cleanup_port $FRONTEND_PORT
  echo -e "${GREEN}Goodbye! ⚡${NC}"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for any process to exit
wait
