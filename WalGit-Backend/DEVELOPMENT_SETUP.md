# WalGit Development Environment Setup Guide

This document provides comprehensive instructions for setting up the development environment for WalGit, a decentralized version control system built on Sui blockchain and Walrus storage technology.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Smart Contracts Setup](#smart-contracts-setup)
6. [Configuration](#configuration)
7. [Running the Project](#running-the-project)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js**: v18 or higher
  ```bash
  # Check Node.js version
  node --version
  ```

- **Git**: Latest version
  ```bash
  # Check Git version
  git --version
  ```

- **Sui CLI**: For smart contract development
  ```bash
  # Install Sui CLI (if not installed)
  cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
  
  # Check Sui version
  sui --version
  ```

- **Sui Wallet**: Either through browser extension or CLI

- **IDE**: Visual Studio Code or similar with extensions for:
  - JavaScript/TypeScript
  - Move (Sui Move)
  - ESLint

## Project Setup

### Clone the Repository

```bash
# Clone the repository with submodules
git clone https://github.com/Angleito/walgit.git --recursive
cd walgit

# Install root dependencies
npm install
```

### Project Structure

The WalGit project consists of three main components:

1. **WalGit Backend**: Node.js CLI for Git operations
2. **WalGit Frontend**: React/Next.js web interface
3. **Smart Contracts**: Sui Move contracts for blockchain functionality

## Backend Setup

### Install Backend Dependencies

```bash
# Navigate to the backend directory
cd walgit-backend

# Install dependencies
npm install

# Make the CLI executable
npm run pretest

# Link for global development use (optional)
npm link
```

### Backend Configuration

Create a configuration file in your home directory:

```bash
# Create the config directory if it doesn't exist
mkdir -p ~/.config/walgit-cli

# Create a basic configuration file
cat > ~/.config/walgit-cli/config.json << EOF
{
  "network": "devnet",
  "walrusEndpoint": "https://api.walrus.storage/v1",
  "suiRpcUrl": "https://fullnode.devnet.sui.io:443",
  "simulationEnabled": true
}
EOF
```

## Frontend Setup

### Install Frontend Dependencies

```bash
# Navigate to the frontend directory
cd walgit-frontend

# Install dependencies
npm install
```

### Frontend Configuration

Create a `.env.local` file in the frontend directory:

```bash
# Create environment configuration
cat > .env.local << EOF
NEXT_PUBLIC_NETWORK=devnet
NEXT_PUBLIC_WALRUS_API_KEY=your_walrus_api_key
NEXT_PUBLIC_SUI_RPC_URL=https://fullnode.devnet.sui.io:443
EOF
```

## Smart Contracts Setup

### Install Sui Move CLI

If you haven't installed the Sui CLI already:

```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
```

### Build Smart Contracts

```bash
# Navigate to the smart contracts directory
cd move

# Build the Move package
sui move build

# Run the Move tests
sui move test
```

## Configuration

### Setting Up Sui Wallet

#### Using CLI

```bash
# Generate a new keypair for development
sui client new-address ed25519

# Fund the address on devnet
sui client faucet --address <your-address>
```

#### Import Wallet to WalGit CLI

```bash
# Start the authentication process
walgit auth

# Follow the prompts to import your private key or create a new wallet
```

### Walrus Storage Configuration

1. Register for a Walrus account at [https://walrus.storage](https://walrus.storage)
2. Create an API key in the Walrus dashboard
3. Add the API key to your configuration:

```bash
# For the CLI
cat >> ~/.config/walgit-cli/config.json << EOF
{
  "walrusApiKey": "your_walrus_api_key"
}
EOF

# For the frontend (update .env.local)
echo "NEXT_PUBLIC_WALRUS_API_KEY=your_walrus_api_key" >> walgit-frontend/.env.local
```

## Running the Project

### Backend CLI

```bash
# Run from project root with npm
npm start -- <command>

# Or if globally linked
walgit <command>

# Examples:
npm start -- init --name MyRepo --description "My first WalGit repository"
npm start -- commit -m "Initial commit"
npm start -- push
```

### Frontend Development Server

```bash
# Navigate to frontend directory
cd walgit-frontend

# Start development server
npm run dev

# The app will be available at http://localhost:3000
```

### Publishing Smart Contracts

```bash
# Navigate to move directory
cd move

# Publish the package to devnet
sui client publish --gas-budget 100000000
```

## Testing

### Backend Tests

```bash
# Run tests from the project root
npm test

# Run a specific test
node --experimental-vm-modules node_modules/jest/bin/jest.js walgit-backend/tests/specific.test.js
```

### Frontend Tests

```bash
# Navigate to frontend directory
cd walgit-frontend

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

### Smart Contract Tests

```bash
# Navigate to move directory
cd move

# Run tests
sui move test
```

## Troubleshooting

### Common Issues and Solutions

#### Backend Issues

1. **CLI Not Found**
   ```
   Error: Command not found: walgit
   ```
   Solution: Ensure you've run `npm link` in the walgit-backend directory or use `npm start -- <command>` from the project root.

2. **Authentication Issues**
   ```
   Error: Not authenticated. Run 'walgit auth' first.
   ```
   Solution: Run `walgit auth` to set up your wallet credentials.

3. **Sui RPC Connection Failed**
   ```
   Error: Failed to connect to Sui RPC endpoint
   ```
   Solution: Check your network connection and verify the RPC URL in your config file.

#### Frontend Issues

1. **Dependencies Installation Failure**
   ```
   Error: npm ERR! code ERESOLVE
   ```
   Solution: Try clearing npm cache with `npm cache clean --force` and then reinstall.

2. **Wallet Connection Issues**
   ```
   Error: Failed to connect wallet
   ```
   Solution: Ensure you have a wallet extension installed and the correct network selected.

#### Smart Contract Issues

1. **Build Failures**
   ```
   Error: Compilation error in module...
   ```
   Solution: Check for syntax errors in your Move code and ensure you have the correct Sui CLI version.

2. **Publication Failures**
   ```
   Error: Insufficient gas
   ```
   Solution: Request more gas from the faucet using `sui client faucet`.

### Getting Help

If you encounter issues not covered here:

1. Check the project [issue tracker](https://github.com/Angleito/walgit/issues)
2. Join the community Discord/Telegram (links in README)
3. Search for similar issues in the Sui and Walrus documentation

## Additional Resources

- [Sui Documentation](https://docs.sui.io/)
- [Walrus Storage Documentation](https://docs.walrus.storage/)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://reactjs.org/docs)
- [Git Internals](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)