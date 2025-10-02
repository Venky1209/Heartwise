#!/bin/bash

# HeartWise ECG System - Simple Local Setup
# This script sets up HeartWise without Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🏥 HeartWise ECG System - Local Setup"
echo "====================================="
echo ""

# Check if PostgreSQL is installed
print_status "Checking PostgreSQL installation..."
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install it first."
    exit 1
fi
print_success "PostgreSQL found"

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install it first."
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

# Create database if it doesn't exist
print_status "Setting up database..."
export PGPASSWORD='gugan@2022'

# Check if database exists
if psql -U gugank -d postgres -lqt | cut -d \| -f 1 | grep -qw heartwise_ecg; then
    print_warning "Database 'heartwise_ecg' already exists"
else
    print_status "Creating database..."
    psql -U gugank -d postgres -c "CREATE DATABASE heartwise_ecg;"
    print_success "Database created"
fi

# Import schema
print_status "Importing database schema..."
psql -U gugank -d heartwise_ecg -f database/schema.sql > /dev/null 2>&1 || true
print_success "Database schema loaded"

# Setup backend
print_status "Setting up backend..."
cd backend

if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm install
else
    print_warning "Backend dependencies already installed"
fi

if [ ! -f ".env" ]; then
    print_status "Creating backend .env file..."
    cat > .env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=heartwise_ecg
DB_USER=gugank
DB_PASSWORD=gugan@2022
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
JWT_SECRET=heartwise_jwt_secret_$(date +%s)
EOF
    print_success "Backend .env created"
else
    print_warning "Backend .env already exists"
fi

cd ..

# Setup frontend
print_status "Setting up frontend..."
cd frontend

if [ ! -d "node_modules" ]; then
    print_status "Installing frontend dependencies..."
    npm install
else
    print_warning "Frontend dependencies already installed"
fi

if [ ! -f ".env" ]; then
    print_status "Creating frontend .env file..."
    echo "REACT_APP_BACKEND_URL=http://localhost:5000" > .env
    print_success "Frontend .env created"
else
    print_warning "Frontend .env already exists"
fi

cd ..

print_success "Setup completed successfully! 🎉"
echo ""
echo "🚀 To start the system:"
echo ""
echo "1. Start the backend (Terminal 1):"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "2. Start the frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm start"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo ""
print_warning "Note: You'll need to run backend and frontend in separate terminals"