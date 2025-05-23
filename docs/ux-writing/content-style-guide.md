# WalGit UX Writing & Content Style Guide

## Overview

This comprehensive style guide defines the voice, tone, and content strategy for WalGit's user interface. It ensures consistent, clear, and accessible communication that helps users understand and navigate decentralized version control concepts without overwhelming them with technical jargon.

## Voice & Tone

### Brand Voice Characteristics

#### **Professional yet Approachable**
- We're experts in decentralized technology, but we speak in human terms
- We respect our users' intelligence without being condescending
- We're confident but not arrogant about our solutions

#### **Empowering**
- We help developers take control of their code
- We emphasize user ownership and sovereignty
- We celebrate developer independence and creativity

#### **Transparent**
- We explain complex processes clearly
- We're honest about limitations and challenges
- We provide context for why things work the way they do

#### **Progressive**
- We introduce advanced concepts gradually
- We meet users where they are in their blockchain journey
- We provide pathways for learning and growth

### Tone Variations by Context

#### **Onboarding & Education**: Encouraging and Supportive
- "Let's get you set up with your first decentralized repository"
- "Don't worry, we'll guide you through each step"
- "You're in control of this process"

#### **Errors & Problems**: Helpful and Solution-Focused
- "We couldn't connect to your wallet. Let's try these solutions:"
- "This usually happens when... Here's how to fix it:"
- "No worries, this is easily resolved"

#### **Success & Achievements**: Celebratory but Not Overwhelming
- "Perfect! Your repository is now encrypted and secure"
- "Great job! You've successfully shared access with your team"
- "You're all set up and ready to go"

#### **Technical Documentation**: Clear and Precise
- "This action requires 2 of 3 key shares to decrypt"
- "Your transaction will be processed on the Sui network"
- "Storage quota consumption: 2.3 MB of 5 GB used"

## Content Principles

### 1. Clarity Over Cleverness
- Use simple, direct language
- Avoid unnecessary technical jargon
- Explain blockchain concepts in familiar terms
- Choose precision over poetry

### 2. Progressive Disclosure
- Start with essential information
- Provide deeper detail on demand
- Use layered explanations (basic → intermediate → advanced)
- Don't overwhelm new users with everything at once

### 3. Context-Aware Help
- Provide relevant information at the right time
- Anticipate user questions and concerns
- Offer just-in-time learning opportunities
- Connect actions to outcomes

### 4. Inclusive Language
- Use gender-neutral pronouns
- Avoid assumptions about technical background
- Consider cultural and linguistic diversity
- Ensure accessibility for screen readers

## UI Text Categories & Guidelines

### 1. Navigation & Labels

#### Main Navigation
```
✅ Good:
- Dashboard
- Repositories
- Settings
- Help

❌ Avoid:
- Repo Management Console
- Configuration Portal
- User Control Panel
```

#### Button Labels
```
✅ Good:
- Connect Wallet
- Create Repository
- Share Access
- View Changes

❌ Avoid:
- Initialize Wallet Connection Protocol
- Instantiate New Code Repository
- Grant Decryption Permissions
```

#### Form Labels
```
✅ Good:
- Repository Name
- Description (optional)
- Encryption Settings
- Team Members

❌ Avoid:
- Repo Identifier String
- Metadata Description Field
- SEAL Policy Configuration
- Collaborator Address List
```

### 2. Onboarding & Instructions

#### Welcome Messages
```
✅ Good:
"Welcome to WalGit! Let's set up your first decentralized repository. 
This will take about 5 minutes, and you'll be in full control of your code."

❌ Avoid:
"Welcome to the WalGit Decentralized Version Control Protocol. 
Please proceed with the mandatory wallet authentication sequence."
```

#### Step-by-Step Instructions
```
✅ Good:
"Step 1 of 4: Connect Your Wallet
Choose your preferred Sui wallet to get started. This will be used to 
sign transactions and manage your repositories."

❌ Avoid:
"Phase 1: Wallet Integration Protocol
Select a compatible Sui network wallet provider to establish 
cryptographic authentication for blockchain interactions."
```

#### Progress Indicators
```
✅ Good:
- "Setting up your repository..."
- "Connecting to Sui network..."
- "Encrypting your files..."
- "Almost done! Just a few more seconds..."

❌ Avoid:
- "Executing repository instantiation protocol..."
- "Establishing blockchain connectivity..."
- "Performing SEAL encryption operations..."
```

### 3. Error Messages & Troubleshooting

#### Error Message Structure
1. **What happened** (clear, non-technical)
2. **Why it happened** (brief explanation)
3. **What to do next** (actionable solution)
4. **Additional help** (optional, for complex issues)

#### Network Errors
```
✅ Good:
"Couldn't connect to the network
This usually happens when there's a temporary network issue or your 
internet connection is unstable.

Try this:
• Check your internet connection
• Refresh the page
• Try again in a few minutes

Still having trouble? Contact support"

❌ Avoid:
"Network connectivity failure
RPC endpoint unreachable. Sui fullnode connection terminated.
Error code: NETWORK_TIMEOUT_EXCEPTION_0x4A7B"
```

#### Wallet Connection Errors
```
✅ Good:
"Wallet connection failed
We couldn't connect to your Sui wallet. Make sure it's installed 
and unlocked.

Quick fixes:
• Unlock your wallet
• Refresh your browser
• Try a different wallet

Need help installing a wallet? See our guide"

❌ Avoid:
"Wallet provider initialization failed
SuiConnector authentication handshake terminated with status: 
UNAUTHORIZED_ACCESS_DENIED"
```

#### Permission Errors
```
✅ Good:
"You don't have permission to edit this repository
Only the repository owner and collaborators with write access 
can make changes.

To get access:
• Ask the repository owner to add you as a collaborator
• Fork the repository to create your own copy

Questions? Learn about permissions"

❌ Avoid:
"Access control violation
Insufficient privileges for write operations on protected resource.
Authorization level: READ_ONLY"
```

### 4. Success Messages & Confirmations

#### Action Confirmations
```
✅ Good:
"Repository created successfully!
Your new repository 'my-project' is ready. You can now start 
adding files and inviting collaborators."

❌ Avoid:
"Repository instantiation completed
New Git object successfully committed to distributed ledger 
with hash: 0x4f7e8c9a2..."
```

#### Status Updates
```
✅ Good:
"Syncing your changes...
We're updating your repository with the latest changes. 
This usually takes 10-30 seconds."

❌ Avoid:
"Executing merkle tree synchronization protocol
Propagating state changes across distributed storage network..."
```

### 5. Tooltips & Help Text

#### Feature Explanations
```
✅ Good:
"Encryption: Protects your repository with SEAL threshold encryption. 
Only you and authorized collaborators can access the content."

❌ Avoid:
"Encryption: Implements SEAL cryptographic protocol with configurable 
threshold signature schemes for access control management."
```

#### Technical Concepts
```
✅ Good:
"Storage Quota: Your available space for repositories and files. 
When you run low, you can purchase more or clean up old files."

❌ Avoid:
"Storage Quota: Allocated byte capacity for blob object persistence 
within the Walrus distributed storage substrate."
```

#### Security Information
```
✅ Good:
"Your private keys never leave your wallet. WalGit only stores 
encrypted data that can't be read without your permission."

❌ Avoid:
"Cryptographic key material remains within user-controlled 
custody solutions. Platform maintains encrypted data objects 
requiring threshold signature validation."
```

### 6. Empty States & Placeholders

#### Empty Repository List
```
✅ Good:
"No repositories yet
Create your first decentralized repository to get started. 
It only takes a few minutes!

[Create Repository]

New to WalGit? Take the tour"

❌ Avoid:
"Repository index empty
No Git objects found in user storage allocation.
Initialize new repository instance to populate dashboard."
```

#### Empty File Browser
```
✅ Good:
"This repository is empty
Add some files to get started:

• Upload files from your computer
• Create a new file
• Clone from another repository

[Add Files] [Create File]"

❌ Avoid:
"Repository contents: null
No blob objects detected in current branch HEAD.
Execute file addition operations to populate tree structure."
```

### 7. Loading States

#### Progressive Loading Messages
```
✅ Good:
"Loading your repositories..." (0-2 seconds)
"Still loading... This might take a moment for large repositories" (2-5 seconds)
"Almost there... Just finishing up" (5+ seconds)

❌ Avoid:
"Querying distributed ledger..."
"Executing repository enumeration protocol..."
"Awaiting blockchain response..."
```

#### Specific Operations
```
✅ Good:
- "Uploading your files... 45% complete"
- "Encrypting repository data..."
- "Syncing with team members..."
- "Backing up to Walrus storage..."

❌ Avoid:
- "Executing blob serialization..."
- "Performing SEAL threshold encryption..."
- "Propagating to storage substrate..."
```

## Blockchain & Technical Terminology

### Translation Guide

#### Instead of Technical Terms, Use Friendly Language

| Technical Term | User-Friendly Alternative |
|---|---|
| Smart Contract | Automated agreement |
| Gas Fee | Network fee |
| Transaction Hash | Transaction ID |
| Wallet Address | Your wallet ID |
| Private Key | Security key |
| Public Key | Sharing address |
| Blockchain | Secure network |
| Distributed Ledger | Shared record |
| Consensus | Network agreement |
| Node | Network computer |
| Fork | Create a copy |
| Merge | Combine changes |
| Commit Hash | Change ID |
| Repository Object | Your repository |
| Storage Quota | Available space |
| Threshold Encryption | Team security |
| Key Shares | Security pieces |
| Decryption Policy | Access rules |

### When to Use Technical Terms

#### Always Include Technical Terms When:
- Users need to interact with external tools
- Debugging or troubleshooting
- Advanced settings or configuration
- Documentation for developers

#### Format: Friendly Name (Technical Name)
```
✅ Good:
"Network fee (gas): 0.001 SUI"
"Transaction ID (hash): 0x4f7e..."
"Your wallet ID (address): 0x1234..."
```

## Content Patterns & Templates

### 1. Modal Dialog Content

#### Structure:
1. **Clear title** (what's happening)
2. **Brief explanation** (why this matters)
3. **Action options** (what user can do)
4. **Additional context** (optional details)

```
✅ Template:
[Icon] Modal Title
Brief explanation of what this action will do and why it matters.

[Primary Action] [Secondary Action]

Additional context or help link (if needed)
```

### 2. Form Validation Messages

#### Real-time Validation:
```
✅ Good:
- "✓ This name is available"
- "⚠ Name must be 3-50 characters"
- "⚠ Only letters, numbers, and hyphens allowed"

❌ Avoid:
- "Invalid input format"
- "Validation failed"
- "Regex pattern mismatch"
```

#### Submission Errors:
```
✅ Good:
"Couldn't create repository
The name 'my-repo' is already taken. Try:
• my-repo-2024
• my-awesome-repo
• alice-my-repo"

❌ Avoid:
"Repository creation failed
Unique constraint violation on name field"
```

### 3. Settings & Configuration

#### Setting Descriptions:
```
✅ Good:
"Auto-backup
Automatically save your work to Walrus storage every 10 minutes. 
This protects against data loss but uses more storage."

❌ Avoid:
"Automatic persistence
Configure periodic blob synchronization to distributed storage 
substrate with specified interval threshold."
```

#### Confirmation Dialogs:
```
✅ Good:
"Delete repository 'my-project'?
This will permanently delete all files, history, and collaborator 
access. This action cannot be undone.

Type 'my-project' to confirm:
[Text input]

[Cancel] [Delete Repository]"

❌ Avoid:
"Confirm repository deletion
Execute irreversible object destruction protocol?
[Confirm] [Abort]"
```

### 4. Notification Messages

#### Success Notifications:
```
✅ Good:
"✓ Repository shared with alice@example.com"
"✓ Files uploaded successfully"
"✓ Encryption enabled for this repository"

❌ Avoid:
"✓ Collaborator permission grant executed"
"✓ Blob objects persisted to storage"
"✓ SEAL encryption protocol activated"
```

#### Warning Notifications:
```
✅ Good:
"⚠ Low storage space
You're using 4.8 GB of your 5 GB quota. Consider purchasing 
more space or cleaning up old files."

❌ Avoid:
"⚠ Storage quota threshold exceeded
Available allocation: 0.2 GB remaining of 5 GB maximum capacity"
```

## Accessibility Considerations

### Screen Reader Optimization

#### Use Descriptive Link Text:
```
✅ Good:
"Download repository backup (2.3 MB ZIP file)"
"View alice's profile and contact information"

❌ Avoid:
"Click here"
"Download"
"View profile"
```

#### Provide Context for Icons:
```
✅ Good:
<button aria-label="Delete repository my-project">
  <TrashIcon />
</button>

❌ Avoid:
<button>
  <TrashIcon />
</button>
```

#### Use Clear Headings:
```
✅ Good:
<h1>Repository Settings</h1>
<h2>General Settings</h2>
<h3>Repository Name and Description</h3>

❌ Avoid:
<h1>Settings</h1>
<h3>General</h3>
<h5>Name</h5>
```

### Internationalization Ready

#### Avoid Text in Images:
- Use proper alt text
- Provide text alternatives
- Consider right-to-left languages

#### Use Relative Time Formats:
```
✅ Good:
"2 hours ago"
"Last week"
"Yesterday at 3:42 PM"

❌ Avoid:
"01/15/2024 15:42"
"2024-01-15T15:42:00Z"
```

## Implementation Guidelines

### Content Management

#### Version Control for Content:
- Store all UI text in JSON files
- Use keys for easy translation
- Version control content changes
- Track content performance

#### Content Review Process:
1. **Draft**: Writer creates initial content
2. **Review**: UX team reviews for clarity
3. **Test**: User testing with content
4. **Implement**: Developer integration
5. **Monitor**: Track user feedback

### Testing Content

#### Content Testing Methods:
- **A/B testing** for critical flows
- **User interviews** for comprehension
- **Analytics** for completion rates
- **Support tickets** for confusion points

#### Success Metrics:
- Task completion rates
- Time to completion
- Support ticket volume
- User satisfaction scores

## Conclusion

This style guide ensures WalGit communicates clearly, consistently, and inclusively with all users. By following these guidelines, we create an interface that empowers developers to embrace decentralized version control without being overwhelmed by technical complexity.

Remember: Our goal is to make blockchain technology accessible and approachable while maintaining the power and flexibility that makes WalGit unique. Every word should bring users closer to achieving their goals, not further from understanding how to get there.