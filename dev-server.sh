#!/bin/bash

# WalGit Development Server Management Script
# Handles clean startup and shutdown of development servers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[WalGit Dev]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WalGit Dev]${NC} $1"
}

print_error() {
    echo -e "${RED}[WalGit Dev]${NC} $1"
}

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill processes on port
kill_port() {
    local port=$1
    if check_port $port; then
        print_warning "Killing existing process on port $port"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# Function to start frontend
start_frontend() {
    print_status "Starting WalGit Frontend..."
    
    # Check for port 3000
    if check_port 3000; then
        print_warning "Port 3000 is in use. Attempting to free it..."
        kill_port 3000
    fi
    
    cd WalGit-frontend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing frontend dependencies..."
        npm install
    fi
    
    # Start development server
    print_status "Starting frontend development server on port 3000..."
    npm run dev &
    FRONTEND_PID=$!
    
    # Wait for server to start
    sleep 5
    
    if check_port 3000; then
        print_status "Frontend started successfully at http://localhost:3000"
    else
        print_error "Failed to start frontend"
        return 1
    fi
    
    cd ..
}

# Function to start backend services
start_backend() {
    print_status "Starting WalGit Backend Services..."
    
    cd WalGit-Backend
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_status "Installing backend dependencies..."
        npm install
    fi
    
    # Make CLI executable
    chmod +x cli/bin/walgit.js
    
    print_status "Backend services ready"
    cd ..
}

# Function to run tests
run_tests() {
    print_status "Running WalGit test suite..."
    
    # Wait for frontend to be ready
    sleep 3
    
    # Run Playwright tests
    npx playwright test tests/practical-frontend-test-working.spec.js --reporter=line
    
    print_status "Test suite completed"
}

# Function to stop all services
stop_services() {
    print_status "Stopping WalGit development services..."
    
    # Kill frontend processes
    kill_port 3000
    
    # Kill any remaining Next.js processes
    pkill -f "next dev" 2>/dev/null || true
    
    print_status "All services stopped"
}

# Function to show status
show_status() {
    print_status "WalGit Development Environment Status:"
    
    if check_port 3000; then
        echo -e "  Frontend (port 3000): ${GREEN}RUNNING${NC}"
    else
        echo -e "  Frontend (port 3000): ${RED}STOPPED${NC}"
    fi
    
    if [ -f "WalGit-Backend/cli/bin/walgit.js" ]; then
        echo -e "  CLI: ${GREEN}AVAILABLE${NC}"
    else
        echo -e "  CLI: ${RED}NOT FOUND${NC}"
    fi
}

# Main script logic
case "$1" in
    start)
        print_status "Starting WalGit development environment..."
        stop_services  # Clean slate
        start_backend
        start_frontend
        show_status
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        sleep 2
        start_backend
        start_frontend
        show_status
        ;;
    test)
        run_tests
        ;;
    status)
        show_status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|test|status}"
        echo ""
        echo "Commands:"
        echo "  start   - Start all development services"
        echo "  stop    - Stop all development services"
        echo "  restart - Restart all development services"
        echo "  test    - Run the test suite"
        echo "  status  - Show service status"
        exit 1
        ;;
esac