# WalGit CLI

Command line interface for interacting with the WalGit decentralized version control system.

## Installation

```bash
# Clone the repository
git clone https://github.com/Angleito/walgit.git
cd walgit/cli

# Install dependencies
npm install

# Link for global use
npm link
```

## Requirements

- Node.js v18 or higher
- Sui wallet (can be generated using the CLI)
- Walrus storage access

## Usage

### Authentication

Before using WalGit, you need to authenticate with your Sui wallet:

```bash
walgit auth
```

You can either generate a new keypair or import an existing private key.

### Repository Commands

#### Initialize a new repository

```bash
walgit init [--name <name>] [--description <desc>] [--private]
```

#### Create a commit

```bash
walgit commit -m "Your commit message" [-a]
```

The `-a` flag will automatically stage all modified files.

#### Push changes

```bash
walgit push [-f] [-b <branch>]
```

#### Pull changes

```bash
walgit pull [-b <branch>]
```

### Repository Management

#### List repositories

```bash
walgit repo list
```

#### Show repository details

```bash
walgit repo show [repo_id]
```

#### Delete a repository

```bash
walgit repo delete <repo_id> [-f]
```

## Configuration

WalGit stores configuration in the following locations:

- Global CLI config: `~/.config/walgit-cli/`
- Repository config: `./.walgit/config.json`

## Development

### Build from source

```bash
npm run build
```

### Run tests

```bash
npm test
```

## License

MIT 