#!/bin/bash

# WalGit Development Startup Script
# This script starts both frontend and backend services for development

set -e

echo "🚀 Starting WalGit Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) detected"

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "walgit-frontend" ] || [ ! -d "walgit-backend" ]; then
    print_error "Please run this script from the WalGit root directory"
    exit 1
fi

# Install root dependencies if needed
if [ ! -d "node_modules" ]; then
    print_step "Installing root dependencies..."
    npm install
    print_success "Root dependencies installed"
fi

# Install frontend dependencies
print_step "Setting up frontend..."
cd walgit-frontend

if [ ! -d "node_modules" ]; then
    print_step "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
fi

# Check for environment file
if [ ! -f ".env.local" ]; then
    print_warning "Creating .env.local template..."
    cat > .env.local << EOL
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
NEXT_PUBLIC_STORAGE_QUOTA_ID=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
NEXT_PUBLIC_WALRUS_API_ENDPOINT=https://api.walrus.storage
NEXT_PUBLIC_SEAL_API_ENDPOINT=https://api.seal.storage
EOL
    print_warning "Please update .env.local with actual values before production use"
fi

cd ..

# Install backend dependencies
print_step "Setting up backend CLI..."
cd walgit-backend

if [ ! -d "node_modules" ]; then
    print_step "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
fi

# Check for environment file
if [ ! -f ".env" ]; then
    print_warning "Creating .env template..."
    cat > .env << EOL
NODE_ENV=development
SUI_NETWORK=testnet
SUI_RPC_ENDPOINT=https://fullnode.testnet.sui.io:443
WALRUS_API_ENDPOINT=https://api.walrus.storage
SEAL_API_ENDPOINT=https://api.seal.storage
PACKAGE_ID=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
STORAGE_QUOTA_ID=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
EOL
    print_warning "Please update .env with actual values before production use"
fi

cd ..

# Function to handle cleanup on script exit
cleanup() {
    print_step "Shutting down services..."
    jobs -p | xargs -r kill
    print_success "Development environment stopped"
}

# Set up cleanup trap
trap cleanup EXIT INT TERM

print_success "Setup complete! Starting development servers..."
echo ""
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🛠️  CLI tools available via: walgit <command>"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start frontend development server
print_step "Starting frontend development server..."
cd walgit-frontend
npm run dev &
FRONTEND_PID=$!

# Give frontend time to start
sleep 3

# Check if frontend started successfully
if ps -p $FRONTEND_PID > /dev/null; then
    print_success "Frontend server started (PID: $FRONTEND_PID)"
else
    print_error "Frontend server failed to start"
    exit 1
fi

cd ..

# Link CLI for development (optional)
print_step "Setting up CLI for development..."
cd walgit-backend/cli
if npm link 2>/dev/null; then
    print_success "CLI linked globally - you can now use 'walgit' command"
else
    print_warning "CLI global link failed - you can still test with 'node bin/walgit.js'"
fi
cd ../..

print_success "🎉 WalGit development environment is ready!"
echo ""
echo "Quick test commands:"
echo "  walgit --help              # Show CLI help"
echo "  walgit wallet create       # Create a new wallet"
echo "  walgit init my-repo        # Initialize a repository"
echo ""
echo "Visit http://localhost:3000 to use the web interface"
echo ""

# Keep script running to maintain services
wait $FRONTEND_PID