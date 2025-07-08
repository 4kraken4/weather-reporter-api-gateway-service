#!/bin/bash

# Weather Service Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f src/.env ]; then
        log_error "Environment files not found in src/ directory"
        log_info "Make sure you have src/.env, src/.env.development, and src/.env.production files"
        exit 1
    fi
    log_success "Found existing environment files in src/ directory"
}

# Development commands
dev_up() {
    log_info "Starting development environment..."
    check_env
    docker-compose up -d
    log_success "Development environment started!"
    log_info "Services available at:"
    echo "  - Weather API: http://localhost:9000"
    echo "  - MongoDB Express: http://localhost:8082 (admin/admin)"
    echo "  - Redis Commander: http://localhost:8081"
}

dev_down() {
    log_info "Stopping development environment..."
    docker-compose down
    log_success "Development environment stopped!"
}

dev_logs() {
    docker-compose logs -f weather-service
}

dev_rebuild() {
    log_info "Rebuilding development environment..."
    docker-compose down
    docker-compose build --no-cache
    docker-compose up -d
    log_success "Development environment rebuilt!"
}

# Production commands
prod_up() {
    log_info "Starting production environment..."
    check_env
    docker-compose -f docker-compose.prod.yml up -d
    log_success "Production environment started!"
}

prod_down() {
    log_info "Stopping production environment..."
    docker-compose -f docker-compose.prod.yml down
    log_success "Production environment stopped!"
}

prod_logs() {
    docker-compose -f docker-compose.prod.yml logs -f weather-service
}

# Utility commands
clean() {
    log_info "Cleaning up Docker resources..."
    docker-compose down -v
    docker-compose -f docker-compose.prod.yml down -v
    docker system prune -f
    docker volume prune -f
    log_success "Docker cleanup completed!"
}

test() {
    log_info "Running tests in Docker..."
    docker-compose exec weather-service npm test
}

lint() {
    log_info "Running linter in Docker..."
    docker-compose exec weather-service npm run lint
}

health() {
    log_info "Checking service health..."
    curl -f http://localhost:9000/api/v1/health || log_error "Service is not healthy!"
}

# Main script
case "$1" in
    # Development
    "dev:up"|"dev")
        dev_up
        ;;
    "dev:down")
        dev_down
        ;;
    "dev:logs")
        dev_logs
        ;;
    "dev:rebuild")
        dev_rebuild
        ;;
    
    # Production
    "prod:up"|"prod")
        prod_up
        ;;
    "prod:down")
        prod_down
        ;;
    "prod:logs")
        prod_logs
        ;;
    
    # Utilities
    "clean")
        clean
        ;;
    "test")
        test
        ;;
    "lint")
        lint
        ;;
    "health")
        health
        ;;
    
    # Help
    "help"|*)
        echo "Weather Service Docker Management"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Development Commands:"
        echo "  dev, dev:up       Start development environment"
        echo "  dev:down          Stop development environment"
        echo "  dev:logs          Show development logs"
        echo "  dev:rebuild       Rebuild and restart development"
        echo ""
        echo "Production Commands:"
        echo "  prod, prod:up     Start production environment"
        echo "  prod:down         Stop production environment"
        echo "  prod:logs         Show production logs"
        echo ""
        echo "Utility Commands:"
        echo "  clean             Clean up Docker resources"
        echo "  test              Run tests in Docker"
        echo "  lint              Run linter in Docker"
        echo "  health            Check service health"
        echo "  help              Show this help message"
        ;;
esac
