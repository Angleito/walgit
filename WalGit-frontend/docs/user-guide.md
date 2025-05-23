# WalGit User Guide

![WalGit Logo](/Users/angel/Documents/Projects/walgit/walgit-frontend/public/walgitlogo.png)

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
    - [Account Setup](#account-setup)
    - [Connecting Your Wallet](#connecting-your-wallet)
3. [Repositories](#repositories)
    - [Creating a Repository](#creating-a-repository)
    - [Repository Wizard](#repository-wizard)
    - [Repository Settings](#repository-settings)
4. [Working with Code](#working-with-code)
    - [Viewing Code](#viewing-code)
    - [Creating Commits](#creating-commits)
    - [Managing Branches](#managing-branches)
5. [Pull Requests](#pull-requests)
    - [Creating a Pull Request](#creating-a-pull-request)
    - [Reviewing Pull Requests](#reviewing-pull-requests)
    - [Merging Pull Requests](#merging-pull-requests)
6. [Storage Management](#storage-management)
    - [Storage Quotas](#storage-quotas)
    - [Storage Plans](#storage-plans)
    - [Managing Storage](#managing-storage)
7. [User Interface Features](#user-interface-features)
    - [Guided Tours](#guided-tours)
    - [Onboarding Flow](#onboarding-flow)
    - [Notifications](#notifications)
8. [Troubleshooting](#troubleshooting)

## Introduction

WalGit is a decentralized version control system built on the Sui blockchain. It leverages the Walrus storage protocol to provide secure, immutable code storage with blockchain-level security.

Key features include:
- Decentralized storage of Git repositories
- Blockchain-based authentication and access control
- Permanent and verifiable commit history
- Built-in storage management

## Getting Started

### Account Setup

Before using WalGit, you need to create an account:

1. Navigate to the WalGit homepage at `https://walgit.io`
2. Click the "Sign up" button in the top-right corner
3. You'll need a compatible Sui wallet for authentication

### Connecting Your Wallet

WalGit uses Sui wallets for authentication:

1. Click "Connect Wallet" when prompted
2. Select your wallet provider from the list
3. Follow your wallet's authentication process
4. Once connected, you'll see your wallet address displayed in the header

![Wallet Connection](wallet-connection-screenshot.png)

## Repositories

### Creating a Repository

To create a new repository:

1. Navigate to the "Repositories" page
2. Click the "New Repository" button
3. You'll be presented with two options:
   - Basic Form: A simple form to create a repository
   - Repository Wizard: A step-by-step guide for more advanced setups

#### Basic Repository Form

Fill in the following information:
- **Repository name**: A unique name for your repository
- **Description** (optional): A short description of your project
- **Visibility**: Choose between Public (anyone can see) or Private (only you and collaborators)
- **Initialization options**:
  - Add README: Creates a default README.md file
  - Add .gitignore: Adds a default .gitignore file
  - Add license: Includes a license file (MIT, Apache, GPL, or MPL)

Click "Create Repository" to proceed.

![Repository Creation](repo-creation-screenshot.png)

### Repository Wizard

For more advanced repository setup, use the Repository Wizard:

1. **Repository Type**:
   - Create new repository
   - Import from GitHub
   - Import from Git URL
   - Upload repository

2. **Repository Details**:
   - Repository name
   - Description
   - Visibility (public or private)

3. **Storage Settings**:
   - Basic (100 MB for 30 days - 1 SUI)
   - Standard (1 GB for 180 days - 5 SUI)
   - Premium (10 GB for 365 days - 20 SUI)
   - Custom (Configure your own storage)
   - Enable/disable auto-renewal

4. **Initialize Settings**:
   - Default branch (main, master, development, production)
   - Add README file
   - Choose license (None, MIT, Apache, GPL, BSD)
   - Add .gitignore template (None, Node, Python, Java, Rust, Go)

5. **Review & Create**:
   - Verify all settings before creation

![Repository Wizard](repo-wizard-screenshot.png)

### Repository Settings

To manage repository settings:

1. Navigate to your repository page
2. Click the "Settings" tab
3. Available settings include:
   - General information (name, description)
   - Visibility settings
   - Default branch
   - Collaborators
   - Delete repository

## Working with Code

### Viewing Code

To browse repository code:

1. Navigate to your repository page
2. The default view shows the files in the root directory
3. Click on directories to navigate through the file structure
4. Click on files to view their contents
5. Use the branch selector to switch between branches

![Repository View](repo-view-screenshot.png)

### Creating Commits

To create a new commit:

1. Navigate to your repository
2. Click "Add file" or select an existing file to edit
3. Make your changes in the editor
4. Provide a commit message describing your changes
5. Choose the branch to commit to
6. Click "Commit changes"

### Managing Branches

To work with branches:

1. Navigate to your repository
2. Click the branch selector dropdown
3. Select a branch to view or select "New branch" to create one
4. To create a branch:
   - Enter a branch name
   - Select the source branch
   - Click "Create branch"

## Pull Requests

### Creating a Pull Request

To create a pull request:

1. Navigate to your repository
2. Click the "Pull Requests" tab
3. Click "New Pull Request"
4. Select the source and target branches
5. Add a title and description for your changes
6. Click "Create Pull Request"

![New Pull Request](new-pr-screenshot.png)

### Reviewing Pull Requests

To review a pull request:

1. Navigate to the repository
2. Click the "Pull Requests" tab
3. Select the pull request you want to review
4. Review the changes in the "Files changed" tab
5. Add comments by clicking on specific lines of code
6. Submit your review with one of three options:
   - Comment: General feedback without approval
   - Approve: Accept the changes
   - Request changes: Request modifications before merging

### Merging Pull Requests

To merge an approved pull request:

1. Navigate to the pull request
2. If all requirements are met (approvals, etc.), the "Merge" button will be enabled
3. Click "Merge pull request"
4. Choose a merge method:
   - Create a merge commit
   - Squash and merge
   - Rebase and merge
5. Confirm the merge

## Storage Management

### Storage Quotas

WalGit uses the Sui blockchain for storage, which requires a storage quota:

1. Each repository requires a storage allocation
2. Storage quotas are measured in:
   - Size (MB/GB)
   - Duration (days)

### Storage Plans

WalGit offers several storage plans:

1. **Basic**: 100 MB for 30 days (1 SUI)
2. **Standard**: 1 GB for 180 days (5 SUI)
3. **Premium**: 10 GB for 365 days (20 SUI)
4. **Custom**: Configure your own storage needs

### Managing Storage

To manage repository storage:

1. Navigate to your repository
2. Click on the "Storage" tab
3. View current storage usage and expiration
4. Click "Manage Storage" to:
   - Upgrade your storage plan
   - Extend storage duration
   - Enable auto-renewal

![Storage Management](storage-management-screenshot.png)

## User Interface Features

### Guided Tours

WalGit offers interactive guided tours to help you navigate the interface:

1. Click the help button (question mark icon) in the bottom-right corner
2. Select "Start Tour" to begin a guided walkthrough
3. Follow the prompts to learn about different features

### Onboarding Flow

New users will see an onboarding flow that introduces:

1. Core WalGit concepts
2. How to connect your wallet
3. Creating your first repository
4. Navigation tips

You can skip this at any time, but it's recommended for new users.

### Notifications

WalGit uses a notification system to keep you informed:

1. Success messages (green) - Confirm completed actions
2. Information messages (blue) - Provide helpful information
3. Warning messages (yellow) - Alert about potential issues
4. Error messages (red) - Notify about problems

Click on notifications to dismiss them or take related actions.

## Troubleshooting

Common issues and solutions:

1. **Wallet Connection Issues**
   - Ensure your wallet is installed and configured
   - Try refreshing the page
   - Check that you're using a supported wallet

2. **Repository Creation Failures**
   - Verify you have sufficient SUI for storage allocation
   - Choose a unique repository name
   - Check your wallet connection

3. **Storage Errors**
   - Ensure you have an active storage quota
   - Check if your storage quota has expired
   - Verify you have sufficient SUI for quota renewal

4. **Transaction Failures**
   - Check your wallet has enough SUI for gas fees
   - Ensure network connectivity to the Sui blockchain
   - Try the transaction again if temporary network issues occur

For additional help, contact support at support@walgit.io or join our Discord community.