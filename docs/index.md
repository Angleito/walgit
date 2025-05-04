# WalGit Documentation

Welcome to the WalGit documentation! This guide provides detailed information on building and using WalGit, a decentralized version control system powered by Sui blockchain and Walrus storage.

## Table of Contents

### 1. [Architecture Overview](architecture.md)
- System architecture
- Data model
- Workflow
- Benefits and security model

### 2. [Sui Move Implementation](move_implementation.md)
- Module structure
- Data structures
- Core operations
- Walrus integration
- Access control

### 3. [Walrus Integration](walrus_integration.md)
- Overview of hybrid storage approach
- Working with Walrus storage
- Storage lifecycle management
- Optimizations

### 4. [Client Implementation](client_implementation.md)
- CLI commands
- Implementation steps
- Command structure
- Working with objects
- Testing and best practices

### 5. [Git vs WalGit Comparison](comparison.md)
- Conceptual comparison
- Core concepts mapping
- Command comparison
- Technical differences
- Advantages and limitations

### 6. [Implementation Roadmap](implementation_roadmap.md)
- Development phases
- Task breakdown
- Tips for junior engineers
- Deployment checklist
- Resources

## Quick Start

For new developers looking to understand the WalGit system, we recommend starting with the [Architecture Overview](architecture.md) to grasp the big picture, then exploring the [Git vs WalGit Comparison](comparison.md) to understand how it relates to traditional Git.

For implementation details, follow the [Implementation Roadmap](implementation_roadmap.md) and refer to the specific documentation sections as needed.

## Key Components

WalGit consists of three main components:

1. **Sui Smart Contracts** - The blockchain representation of Git objects (repositories, commits, trees, blobs)
2. **Walrus Storage Integration** - Decentralized storage for file content
3. **Client Application** - Command-line interface for interacting with the system

Each component is documented in detail in the respective sections.

## Development Status

WalGit is currently under active development. Refer to the [Implementation Roadmap](implementation_roadmap.md) for the current status and upcoming features.

## Contributing

We welcome contributions to WalGit! Before contributing, please review the architecture documentation to understand the system design principles.

## License

WalGit is released under the [MIT License](../LICENSE). 