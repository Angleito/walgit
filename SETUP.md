# WalGit Setup and Testing Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Git
- Sui wallet (Sui Wallet or Phantom)

## 🔧 Environment Setup

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Frontend dependencies
cd walgit-frontend
npm install
cd ..

# Backend CLI dependencies  
cd walgit-backend
npm install
cd ..
```

### 2. Environment Configuration

Create environment files:

**walgit-frontend/.env.local:**
```env
NEXT_PUBLIC_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
NEXT_PUBLIC_STORAGE_QUOTA_ID=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
NEXT_PUBLIC_WALRUS_API_ENDPOINT=https://api.walrus.storage
NEXT_PUBLIC_SEAL_API_ENDPOINT=https://api.seal.storage
```

**walgit-backend/.env:**
```env
NODE_ENV=development
SUI_NETWORK=testnet
SUI_RPC_ENDPOINT=https://fullnode.testnet.sui.io:443
WALRUS_API_ENDPOINT=https://api.walrus.storage
SEAL_API_ENDPOINT=https://api.seal.storage
PACKAGE_ID=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
STORAGE_QUOTA_ID=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
```

## 🌐 Starting the Website

### Development Mode

```bash
cd walgit-frontend
npm run dev
```

The website will be available at: **http://localhost:3000**

### Production Build

```bash
cd walgit-frontend
npm run build
npm start
```

## 🛠️ Setting Up the CLI

### 1. Install CLI Globally

```bash
cd walgit-backend/cli
npm install -g .
# OR link for development
npm link
```

### 2. Verify Installation

```bash
walgit --help
```

## 🧪 Testing Workflow

### 1. Frontend Testing

**Test wallet connection:**
1. Visit http://localhost:3000
2. Click "Connect Wallet" 
3. Connect Sui Wallet or Phantom
4. Verify wallet address appears

**Test repository browsing:**
1. Navigate to "/repositories"
2. Should show empty state if no repos
3. Click "New Repository" 
4. Fill out create repository form
5. Submit and verify transaction

### 2. CLI Testing

**Setup wallet:**
```bash
# Create new wallet
walgit wallet create
# Enter secure password when prompted

# OR import existing wallet
walgit wallet import
# Enter private key and password
```

**Test repository operations:**
```bash
# Create test directory
mkdir test-repo
cd test-repo

# Initialize repository
walgit init my-test-repo -d "Test repository for WalGit"

# Add some test files
echo "# Test Project" > README.md
echo "console.log('Hello WalGit');" > index.js

# Commit changes
walgit commit -m "Initial commit with test files"

# List repositories
walgit list
```

### 3. End-to-End Testing

**Repository sharing workflow:**
```bash
# Owner shares repository
walgit share <repo-id> <collaborator-address> writer

# Collaborator clones
walgit clone <repo-id>

# Collaborator makes changes
cd <cloned-repo>
echo "// New feature" >> index.js
walgit commit -m "Add new feature"
```

## 🔍 Troubleshooting

### Common Issues

**1. Wallet Connection Issues**
- Ensure Sui Wallet extension is installed
- Check browser console for errors
- Verify network configuration (testnet vs mainnet)

**2. CLI Authentication**
```bash
# Check wallet status
walgit wallet status

# Unlock wallet if locked
walgit wallet unlock
```

**3. Environment Variables**
```bash
# Verify configuration
walgit config --list
```

**4. Network Issues**
- Verify Sui RPC endpoint is accessible
- Check Walrus storage API availability
- Ensure SEAL service is running

### Debug Mode

**Frontend debug:**
```bash
cd walgit-frontend
npm run dev -- --debug
```

**CLI debug:**
```bash
DEBUG=walgit:* walgit <command>
```

## 📊 Testing Checklist

### Frontend Tests
- [ ] Wallet connection works
- [ ] Repository list loads
- [ ] Create repository form submits
- [ ] Repository details display
- [ ] Collaborator management works
- [ ] Search and filtering functions

### CLI Tests  
- [ ] Wallet creation/import
- [ ] Repository initialization
- [ ] File commitment and upload
- [ ] Repository cloning
- [ ] Collaborator sharing
- [ ] List and search commands

### Integration Tests
- [ ] CLI-created repos appear in frontend
- [ ] Frontend-shared repos accessible via CLI
- [ ] SEAL encryption/decryption works
- [ ] Walrus storage operations succeed
- [ ] Sui blockchain transactions confirm

## 🚨 Known Limitations (MVP)

1. **Mock Data**: Some features use mock data for demo
2. **SEAL Integration**: Requires actual SEAL network setup
3. **Walrus Storage**: Needs real Walrus API keys
4. **Network**: Currently configured for Sui testnet

## 🎯 Next Steps

After basic testing works:
1. Deploy smart contracts to Sui testnet
2. Configure real Walrus storage credentials
3. Set up SEAL encryption network
4. Run comprehensive E2E tests
5. Deploy frontend to production

## 📞 Support

If you encounter issues:
1. Check browser/terminal console for errors
2. Verify all environment variables are set
3. Ensure wallet has sufficient SUI for transactions
4. Check network connectivity to Sui/Walrus/SEAL services