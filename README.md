# WalGit: Decentralized, Self-Controlled Version Control

<p align="center">
  <img src="WalGit-frontend/public/walgit-logo.png" alt="WalGit Logo" width="200" />
</p>

## Overview

WalGit is a decentralized, user-controlled version control system built on Sui blockchain and Walrus's distributed storage technology. It empowers developers to maintain full sovereignty over their code while enjoying the benefits of cloud-based collaboration.

## Why WalGit?

> "Developers should not have to choose between the convenience of cloud-hosted version control and the sovereignty of their own code."

The increasing centralization of code hosting platforms like GitHub—now under Microsoft's control—raises concerns about:
- Data privacy
- Code ownership
- Unauthorized use of open source contributions to train proprietary AI models

WalGit addresses these challenges by leveraging Walrus's decentralized storage capabilities to provide a self-hosted, git-like version control system. With WalGit, developers own their repositories and manage their storage through a decentralized cloud, ensuring both autonomy and security.

## Key Features

### 🌐 Decentralized Storage
WalGit utilizes Walrus's distributed cloud storage, allowing users to host their code on infrastructure they control, rather than relying on a single centralized provider.

### 🔐 Self-Ownership and Control
Users retain full ownership of their repositories, including how and where their data is stored and who can access it.

### 📖 Open Source and Transparent
WalGit is fully open source, ensuring transparency and community-driven development. Anyone can audit, contribute to, or deploy the platform.

### 🛡️ End-to-End Encryption
Code is protected using Seal's encryption and native wallet-based encryption, providing robust security for sensitive projects and intellectual property.

### 💰 Affordable and Accessible
By leveraging Walrus's cost-effective and widely available storage, WalGit offers a scalable solution for individuals and teams without the high costs of traditional cloud services.

### 🔄 Familiar Git-Like Experience
WalGit maintains a workflow and interface similar to GitHub, making it easy for developers to transition without sacrificing usability or productivity.

## Project Structure

- **WalGit-frontend**: React-based frontend interface for interacting with repositories
- **smart-contracts**: Sui Move contracts that manage repository permissions and storage pointers

## Getting Started

### Prerequisites
- Node.js v18+
- Sui wallet (Sui Wallet, Ethos Wallet, or other compatible wallets)
- Access to Walrus storage

### Installation
```bash
# Clone the repository
git clone https://github.com/Angleito/walgit.git
cd walgit

# Install frontend dependencies
cd WalGit-frontend
npm install

# Run the development server
npm run dev
```

### Deployment
The project is automatically deployed to GitHub Pages using GitHub Actions.
Visit: [https://angleito.github.io/walgit/](https://angleito.github.io/walgit/)

## Contributing

We welcome contributions to WalGit! Feel free to fork the repository, make your changes, and submit a pull request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Built on [Sui](https://sui.io/) blockchain
- Utilizes Walrus decentralized storage technology
- Inspired by the need for developer sovereignty in the age of AI and centralized control
