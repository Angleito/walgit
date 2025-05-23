# WalGit: Decentralized, Self-Controlled Version Control

<p align="center">
  <img src="walgit-frontend/public/walgitv3.png" alt="WalGit Logo - Cool Walrus with Sunglasses" width="200" style="background: transparent;" />
</p>

## Overview

WalGit is a decentralized, user-controlled version control system built on Sui blockchain and Walrus's distributed storage technology. It empowers developers to maintain full sovereignty over their code while enjoying the benefits of cloud-based collaboration.

## CLI Commands

WalGit provides a comprehensive set of commands for version control:

### Core Commands
- `walgit init [--encryption]` - Initialize a new repository (optionally with encryption)
- `walgit add <files>` - Stage files for commit
- `walgit commit -m <message>` - Create a new commit
- `walgit push` - Push commits to remote
- `walgit pull` - Pull changes from remote
- `walgit clone <repo>` - Clone a repository
- `walgit status` - Show repository status
- `walgit log` - Show commit history

### Encryption Commands (Seal Integration)
- `walgit encryption enable` - Enable encryption for repository
- `walgit encryption disable` - Disable encryption
- `walgit encryption share <user>` - Share access with a user
- `walgit encryption revoke <user>` - Revoke user access
- `walgit encryption list-access` - List users with access
- `walgit encryption rotate-keys` - Rotate encryption keys

### Storage Commands (Tusky Integration)
- `walgit tusky config` - Configure Tusky storage
- `walgit tusky use` - Use Tusky as primary storage
- `walgit tusky status` - Check storage usage and quota
- `walgit tusky migrate` - Migrate existing blobs to Tusky
- `walgit tusky fallback` - Set fallback storage provider

## Enhanced Integrations

### Sui Blockchain
- Content-addressable storage with SHA-256 hashing
- Immutable blob ID references
- Gas-optimized transactions with batching
- BlobIdRegistry for efficient blob management

### Walrus Storage
- RedStuff erasure coding (3/7 configuration)
- Chunked uploads for large files (up to 14GB)
- Parallel operations for better performance
- Automatic retry with exponential backoff

### Seal Encryption
- Threshold encryption (customizable, e.g., 2-of-3)
- End-to-end encryption for private repositories
- Key share management for team collaboration
- Automatic key rotation support

### Tusky Storage
- Free tier: 5GB personal / 50GB WalGit shared
- Automatic fallback to Walrus when quota exceeded
- Seamless migration between storage providers
- Cost-effective storage for open source projects

## Testing

To run the tests for the WalGit CLI:

```bash
cd walgit-backend
npm install
npm test
```

The test suite uses Jest and includes mocks for Sui and Walrus integration to ensure all CLI commands work properly without requiring actual blockchain interaction.

## Local Git Tree Simulation

You can test the basic local commit and push functionality without connecting to the network by using a simulated Git repository structure.

1.  Create a test directory and initialize a local WalGit repository:

    ```bash
    mkdir -p test-repo/.walgit
    cd test-repo
    ```

2.  Create some files and directories within `test-repo`:

    ```bash
    echo "This is the first file." > file1.txt
    mkdir src
    echo "console.log('Hello, WalGit!');" > src/main.js
    ```

3.  Run the local WalGit commit command from within the `test-repo` directory using `npx`:

    ```bash
    npx walgit commit -m "Initial local commit"
    ```

    This will create a simplified Git object structure (commit, tree, and blob files) within the `.walgit` directory.

4.  Run the local WalGit push command from within the `test-repo` directory using `npx`:

    ```bash
    npx walgit push
    ```

    This will simulate a push operation and confirm the latest local commit.

## Why WalGit?

> "Developers should not have to choose between the convenience of cloud-hosted version control and the sovereignty of their own code."

The increasing centralization of code hosting platforms like GitHub—now under Microsoft's control—raises concerns about:
- Data privacy
- Code ownership
- Unauthorized use of open source contributions to train proprietary AI models

WalGit addresses these challenges by leveraging Walrus's decentralized storage capabilities to provide a self-hosted, git-like version control system. With WalGit, developers own their repositories and manage their storage through a decentralized cloud, ensuring both autonomy and security.

## Key Features

### 🌐 Decentralized Storage
WalGit utilizes Walrus's distributed cloud storage with RedStuff erasure coding, allowing users to host their code on infrastructure they control, rather than relying on a single centralized provider. Large files up to 14GB are supported with chunked uploads.

### 🔐 Self-Ownership and Control
Users retain full ownership of their repositories, including how and where their data is stored and who can access it. Integration with Sui blockchain ensures content-addressable storage with immutable references.

### 📖 Open Source and Transparent
WalGit is fully open source, ensuring transparency and community-driven development. Anyone can audit, contribute to, or deploy the platform.

### 🛡️ End-to-End Encryption
Code is protected using Seal's threshold encryption and native wallet-based encryption, providing robust security for sensitive projects and intellectual property. Supports customizable encryption thresholds (e.g., 2-of-3 shares) for team collaboration.

### 💰 Affordable and Accessible
By leveraging Walrus's cost-effective storage and integrating with Tusky's free tier (5GB personal, 50GB WalGit shared), WalGit offers a scalable solution for individuals and teams without the high costs of traditional cloud services.

### 🔄 Familiar Git-Like Experience
WalGit maintains a workflow and interface similar to GitHub, making it easy for developers to transition without sacrificing usability or productivity. Uses 'walgit' command prefix for all operations.

### 🎨 Customizable User Experience
WalGit offers a fully customizable interface with theme switching (light/dark mode and accent colors), guided tours, and an intuitive onboarding process for new users.

### 🚀 Enhanced Performance
Features parallel operations, batch processing, automatic retries, and storage provider fallback mechanisms for optimal performance and reliability.

## Technology Stack

- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Blockchain**: Sui Network
- **Storage**: 
  - Walrus Decentralized Storage (primary)
  - Tusky Storage (free tier option)
- **Encryption**: Seal Network (threshold encryption)
- **Build Tool**: Next.js
- **Key Dependencies**:
  - @mysten/dapp-kit: Sui dApp development kit
  - @mysten/sui.js: Sui blockchain interaction
  - Next.js: Routing and rendering framework
  - TanStack Query: Data fetching and caching
  - next-themes: Theme management system
  - Lucide React: Icon library for the UI
  - axios: HTTP client for API integrations
  - form-data: File upload support
  - crypto-js: Cryptographic utilities

## Project Structure

- **walgit-frontend/**: React-based frontend interface
  - `src/`: Source code
    - `app/`: Next.js application routes
    - `components/`: React components
      - `ui/`: UI components including theme-switcher, notification-system, and guided-tour
      - `onboarding/`: Onboarding flow components
      - `repository/`: Repository-specific components including wizard
    - `hooks/`: Custom React hooks
    - `services/`: Service layer for API interactions
  - `public/`: Static assets
  - `.next/`: Production build output
- **walrus-sites/**: Integration with Walrus Sites for storage
- **.github/workflows/**: CI/CD automation
  - `deploy.yml`: GitHub Pages deployment
- **move/**: Sui Move contracts

## Getting Started

### Prerequisites
- Node.js v18+
- Sui wallet (Sui Wallet, Ethos Wallet, or other compatible wallets)
- Access to Walrus storage
- Git

### Installation
```bash
# Clone the repository and submodules
git clone https://github.com/Angleito/walgit.git --recursive
cd walgit

# Install root dependencies
npm install

# Install frontend dependencies
cd walgit-frontend
npm install

# Start the development server
npm run dev
```

### Environment Setup
Create a `.env.local` file in the walgit-frontend directory:
```env
NEXT_PUBLIC_NETWORK=devnet  # or testnet/mainnet
NEXT_PUBLIC_WALRUS_API_KEY=your_api_key
NEXT_PUBLIC_SEAL_API_KEY=your_seal_api_key
NEXT_PUBLIC_TUSKY_API_KEY=your_tusky_api_key
```

Configure the WalGit CLI:
```bash
# Configure Sui network
walgit config sui-network devnet
walgit config sui-rpc https://fullnode.devnet.sui.io:443

# Configure storage providers
walgit config walrus-api-key <your-walrus-key>
walgit config seal-api-key <your-seal-key>
walgit config tusky-api-key <your-tusky-key>

# Optional: Enable Tusky as primary storage
walgit tusky use
```

### Deployment
The project is automatically deployed to GitHub Pages using GitHub Actions whenever changes are pushed to the main branch. The deployment process includes:

1. Building the frontend application
2. Deploying to GitHub Pages
3. Generating Walrus Sites provenance data

Visit: [https://angleito.github.io/walgit/](https://angleito.github.io/walgit/)

## Development

### Available Scripts
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start the production server
- `npm run lint`: Run ESLint on the codebase

### Frontend Configuration
- Next.js configuration is in `next.config.js` using JSDoc for TypeScript type checking
- Do not use `next.config.ts` as it is not supported by Next.js
- Access the frontend at http://localhost:3000 when running the dev server

### Code Style
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting

### User Experience Features
- **Theme System**: Light/dark mode with customizable accent colors
- **Notification System**: Centralized notification management with different types (info, success, error, warning)
- **Guided Tours**: Interactive step-by-step guides for onboarding new users
- **Onboarding Flow**: Multi-step onboarding process for new users
- **Repository Wizard**: Step-by-step process for creating new repositories

## Contributing

We welcome contributions to WalGit! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgements

- Built on [Sui](https://sui.io/) blockchain
- Utilizes Walrus decentralized storage technology
- Integrates with Walrus Sites for provenance and verification
- Inspired by the need for developer sovereignty in the age of AI and centralized control