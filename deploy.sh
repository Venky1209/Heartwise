#!/bin/bash

# HeartWise ECG System - Deployment Script
# This script sets up the complete HeartWise system

set -e

echo "🏥 Starting HeartWise ECG System Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if Node.js is installed (for local development)
check_nodejs() {
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
    else
        print_warning "Node.js not found. Required for local development."
    fi
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    if [ ! -f .env ]; then
        cat > .env << EOF
# HeartWise ECG System Environment Configuration
DB_PASSWORD=heartwise_secure_password_$(date +%s)
JWT_SECRET=heartwise_jwt_secret_$(openssl rand -hex 32)
NODE_ENV=production
FRONTEND_URL=http://localhost:3000
EOF
        print_success "Environment file created"
    else
        print_warning "Environment file already exists"
    fi
}

# Setup database
setup_database() {
    print_status "Setting up PostgreSQL database..."
    
    # Create database directory if it doesn't exist
    mkdir -p ./database
    
    # Check if schema file exists
    if [ ! -f ./database/schema.sql ]; then
        print_error "Database schema file not found at ./database/schema.sql"
        exit 1
    fi
    
    print_success "Database setup ready"
}

# Build and start services
start_services() {
    print_status "Building and starting HeartWise services..."
    
    # Pull latest images
    docker-compose pull
    
    # Build services
    docker-compose build
    
    # Start services
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for database
    print_status "Waiting for database..."
    timeout 60 bash -c 'until docker-compose exec postgres pg_isready -U heartwise_user -d heartwise_ecg; do sleep 2; done'
    
    # Wait for backend
    print_status "Waiting for backend API..."
    timeout 60 bash -c 'until curl -f http://localhost:5000/api/health; do sleep 2; done'
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    timeout 30 bash -c 'until curl -f http://localhost:3000; do sleep 2; done'
    
    print_success "All services are ready!"
}

# Display system information
show_system_info() {
    echo ""
    echo "🎉 HeartWise ECG System is now running!"
    echo ""
    echo "📊 System URLs:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:5000"
    echo "   API Docs:  http://localhost:5000/api/health"
    echo ""
    echo "🔧 Database Information:"
    echo "   Host:      localhost:5432"
    echo "   Database:  heartwise_ecg"
    echo "   Username:  heartwise_user"
    echo ""
    echo "📱 Hardware Setup:"
    echo "   1. Configure your ESP32 device with WiFi credentials"
    echo "   2. Update server IP in Arduino code to your machine's IP"
    echo "   3. Upload the Arduino sketch to your ESP32"
    echo "   4. Connect AD8232 sensor and ECG electrodes"
    echo ""
    echo "🏥 Getting Started:"
    echo "   1. Open http://localhost:3000 in your browser"
    echo "   2. Add a patient via the Patients page"
    echo "   3. Start ECG monitoring from the Monitor page"
    echo "   4. View real-time ECG data and analysis"
    echo ""
    echo "📋 Useful Commands:"
    echo "   View logs:     docker-compose logs -f"
    echo "   Stop system:   docker-compose down"
    echo "   Update system: docker-compose pull && docker-compose up -d"
    echo ""
}

# Cleanup function
cleanup_on_error() {
    print_error "Deployment failed. Cleaning up..."
    docker-compose down
    exit 1
}

# Set trap for cleanup
trap cleanup_on_error ERR

# Main deployment process
main() {
    echo "🏥 HeartWise ECG System - Automated Deployment"
    echo "=============================================="
    echo ""
    
    check_docker
    check_nodejs
    create_env_file
    setup_database
    start_services
    wait_for_services
    show_system_info
    
    print_success "Deployment completed successfully! 🎉"
}

# Run main function
main "$@"