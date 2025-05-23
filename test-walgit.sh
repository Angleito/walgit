#!/bin/bash

# WalGit Testing Script
# Comprehensive testing of CLI and frontend functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TESTS_PASSED=0
TESTS_FAILED=0
TEST_LOG="test-results.log"

# Clear previous test log
> $TEST_LOG

print_header() {
    echo -e "${BLUE}🧪 $1${NC}"
    echo "🧪 $1" >> $TEST_LOG
}

print_test() {
    echo -e "${YELLOW}  ▶ $1${NC}"
    echo "  ▶ $1" >> $TEST_LOG
}

print_success() {
    echo -e "${GREEN}  ✅ $1${NC}"
    echo "  ✅ $1" >> $TEST_LOG
    ((TESTS_PASSED++))
}

print_failure() {
    echo -e "${RED}  ❌ $1${NC}"
    echo "  ❌ $1" >> $TEST_LOG
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${BLUE}  ℹ️  $1${NC}"
    echo "  ℹ️  $1" >> $TEST_LOG
}

# Function to test if command exists and works
test_command() {
    local cmd="$1"
    local desc="$2"
    
    print_test "Testing: $desc"
    
    if command -v $cmd &> /dev/null; then
        if $cmd --help &> /dev/null || $cmd -h &> /dev/null; then
            print_success "$desc command works"
            return 0
        else
            print_failure "$desc command exists but doesn't respond to --help"
            return 1
        fi
    else
        print_failure "$desc command not found"
        return 1
    fi
}

# Function to test URL accessibility
test_url() {
    local url="$1"
    local desc="$2"
    
    print_test "Testing: $desc"
    
    if command -v curl &> /dev/null; then
        if curl -s --max-time 10 "$url" > /dev/null; then
            print_success "$desc is accessible"
            return 0
        else
            print_failure "$desc is not accessible"
            return 1
        fi
    else
        print_info "curl not available, skipping URL test"
        return 0
    fi
}

# Function to test file exists
test_file() {
    local file="$1"
    local desc="$2"
    
    print_test "Testing: $desc"
    
    if [ -f "$file" ]; then
        print_success "$desc exists"
        return 0
    else
        print_failure "$desc not found"
        return 1
    fi
}

echo "🧪 WalGit Testing Suite"
echo "======================"
echo ""

# Test 1: Environment Setup
print_header "Environment Setup Tests"

test_command "node" "Node.js"
test_command "npm" "npm"

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    print_success "Node.js version is compatible ($(node -v))"
else
    print_failure "Node.js version too old ($(node -v)), need 18+"
fi

# Test 2: Project Structure
print_header "Project Structure Tests"

test_file "package.json" "Root package.json"
test_file "walgit-frontend/package.json" "Frontend package.json"
test_file "walgit-backend/package.json" "Backend package.json"
test_file "move/Move.toml" "Move project configuration"

# Test dependencies
print_test "Checking frontend dependencies"
if [ -d "walgit-frontend/node_modules" ]; then
    print_success "Frontend dependencies installed"
else
    print_failure "Frontend dependencies not installed"
fi

print_test "Checking backend dependencies"
if [ -d "walgit-backend/node_modules" ]; then
    print_success "Backend dependencies installed"
else
    print_failure "Backend dependencies not installed"
fi

# Test 3: Configuration Files
print_header "Configuration Tests"

print_test "Checking frontend environment"
if [ -f "walgit-frontend/.env.local" ]; then
    print_success "Frontend environment file exists"
    
    # Check for required variables
    if grep -q "NEXT_PUBLIC_NETWORK" walgit-frontend/.env.local; then
        print_success "NEXT_PUBLIC_NETWORK configured"
    else
        print_failure "NEXT_PUBLIC_NETWORK not configured"
    fi
else
    print_failure "Frontend .env.local not found"
fi

print_test "Checking backend environment"
if [ -f "walgit-backend/.env" ]; then
    print_success "Backend environment file exists"
else
    print_failure "Backend .env not found"
fi

# Test 4: CLI Functionality
print_header "CLI Tests"

# Test if CLI is accessible
print_test "Testing CLI accessibility"
if [ -f "walgit-backend/cli/bin/walgit.js" ]; then
    print_success "CLI entry point exists"
    
    # Test CLI help
    print_test "Testing CLI help command"
    cd walgit-backend/cli
    if node bin/walgit.js --help &> /dev/null; then
        print_success "CLI help command works"
    else
        print_failure "CLI help command failed"
    fi
    cd ../..
else
    print_failure "CLI entry point not found"
fi

# Test wallet commands (basic structure)
print_test "Testing wallet command structure"
cd walgit-backend/cli
if node bin/walgit.js wallet --help &> /dev/null; then
    print_success "Wallet command structure works"
else
    print_failure "Wallet command structure failed"
fi
cd ../..

# Test 5: Frontend Build
print_header "Frontend Build Tests"

print_test "Testing frontend build process"
cd walgit-frontend

# Test if Next.js can compile
if npm run build &> /tmp/build.log; then
    print_success "Frontend builds successfully"
else
    print_failure "Frontend build failed (check /tmp/build.log)"
fi

cd ..

# Test 6: Smart Contract Structure  
print_header "Smart Contract Tests"

print_test "Checking Move project structure"
if [ -f "move/sources/git_repository.move" ]; then
    print_success "Main repository contract exists"
else
    print_failure "Main repository contract not found"
fi

print_test "Checking Move compilation"
cd move
if sui move build &> /tmp/move_build.log; then
    print_success "Move contracts compile successfully"
else
    print_failure "Move contracts compilation failed (check /tmp/move_build.log)"
fi
cd ..

# Test 7: Development Server (optional, requires manual intervention)
print_header "Development Server Tests (Optional)"

print_test "Checking if development server can start"
cd walgit-frontend

# Start dev server in background and test if it responds
timeout 30s npm run dev &
DEV_PID=$!
sleep 10

if test_url "http://localhost:3000" "Frontend development server"; then
    print_success "Development server starts and responds"
else
    print_failure "Development server failed to start or respond"
fi

# Clean up
kill $DEV_PID 2>/dev/null || true
cd ..

# Test 8: Integration Tests
print_header "Integration Tests"

# Test file imports and dependencies
print_test "Testing TypeScript compilation"
cd walgit-frontend
if npx tsc --noEmit &> /tmp/tsc.log; then
    print_success "TypeScript compilation passes"
else
    print_failure "TypeScript compilation failed (check /tmp/tsc.log)"
fi
cd ..

# Test 9: Security and Best Practices
print_header "Security Tests"

print_test "Checking for sensitive files"
if [ -f "walgit-frontend/.env.local" ] && ! git check-ignore walgit-frontend/.env.local &> /dev/null; then
    print_failure ".env.local should be in .gitignore"
else
    print_success "Environment files properly ignored"
fi

print_test "Checking for package vulnerabilities"
cd walgit-frontend
if npm audit --audit-level moderate &> /dev/null; then
    print_success "No moderate/high vulnerabilities found in frontend"
else
    print_failure "Package vulnerabilities found in frontend"
fi
cd ..

# Final Report
echo ""
echo "📊 Test Results Summary"
echo "======================="
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! WalGit is ready for development.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run './start-dev.sh' to start the development environment"
    echo "2. Visit http://localhost:3000 to test the web interface"
    echo "3. Use 'walgit' commands to test CLI functionality"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please address the issues before proceeding.${NC}"
    echo ""
    echo "Check the test log: $TEST_LOG"
    echo "Common fixes:"
    echo "- Run 'npm install' in frontend and backend directories"
    echo "- Create environment files (.env.local and .env)"
    echo "- Ensure Node.js 18+ is installed"
    exit 1
fi