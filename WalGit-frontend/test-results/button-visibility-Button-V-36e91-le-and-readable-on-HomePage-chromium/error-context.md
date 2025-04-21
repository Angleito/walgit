# Test info

- Name: Button Visibility Tests >> all buttons should be visible and readable on HomePage
- Location: /Users/angle/CascadeProjects/walgit/WalGit-frontend/tests/button-visibility.spec.ts:4:3

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 32
Received:   24
    at /Users/angle/CascadeProjects/walgit/WalGit-frontend/tests/button-visibility.spec.ts:16:34
```

# Page snapshot

```yaml
- region "Notifications (F8)":
  - list
- banner:
  - img "WalGit Logo"
  - heading "WalGit" [level=1]
  - navigation:
    - list:
      - listitem:
        - link "Features":
          - /url: "#features"
      - listitem:
        - link "Why WalGit":
          - /url: "#why-walgit"
      - listitem:
        - link "Docs":
          - /url: "#"
  - link "Explore":
    - /url: /walgit/repositories
    - button "Explore"
  - button "Connect Wallet"
- heading "Decentralized Git for the Web3 Era" [level=1]
- paragraph: WalGit combines the power of Git's version control with Sui blockchain for secure, transparent, and decentralized code collaboration.
- button "Get Started"
- link "View Repositories":
  - /url: /walgit/repositories
  - button "View Repositories"
- heading "Why developers choose WalGit" [level=2]
- img
- heading "Decentralized Repositories" [level=3]
- paragraph: Store your code on the Sui blockchain for increased resilience, transparency, and no single point of failure.
- img
- heading "Wallet-based Authentication" [level=3]
- paragraph: Secure access to repositories using your Web3 wallet. No more password management headaches.
- img
- heading "Transparent Collaboration" [level=3]
- paragraph: All contributions and code changes are permanently recorded on-chain, creating a trustless environment.
- heading "The future of code collaboration" [level=2]
- paragraph: "Traditional version control systems are centralized, requiring trust in a single authority. WalGit leverages blockchain technology to create a decentralized alternative that ensures:"
- list:
  - listitem:
    - img
    - heading "Immutable History" [level=3]
    - paragraph: Once committed, your code history cannot be altered or deleted
  - listitem:
    - img
    - heading "Ownership Authentication" [level=3]
    - paragraph: Cryptographically verify code ownership and contributions
  - listitem:
    - img
    - heading "Censorship Resistance" [level=3]
    - paragraph: Your code remains accessible regardless of political or corporate decisions
- text: terminal
- paragraph: $ walgit init
- paragraph: Initializing new repository on Sui blockchain...
- paragraph: "Repository created with ID: 0x3f8a..."
- paragraph: $ walgit commit -m "Initial commit"
- paragraph: Commit 0x2c4f added to blockchain!
- text: repository.move 10 KB
- code: "module walgit::repository { use sui::object::{Self, UID}; use sui::transfer; use sui::tx_context::{Self, TxContext}; struct Repository has key, store { id: UID, name: String, owner: address, // ... other fields } // ... repository functions }"
- text: 100+
- paragraph: Active Repositories
- text: 1,000+
- paragraph: Commits
- text: 50+
- paragraph: Contributors
- text: 24/7
- paragraph: Blockchain Uptime
- heading "Ready to join the decentralized development revolution?" [level=2]
- paragraph: Start building with WalGit today and experience the future of secure, collaborative, decentralized code management.
- button "Connect Wallet"
- contentinfo:
  - img "WalGit Logo"
  - heading "WalGit" [level=1]
  - navigation:
    - list:
      - listitem:
        - link "Features":
          - /url: "#"
      - listitem:
        - link "Documentation":
          - /url: "#"
      - listitem:
        - link "Community":
          - /url: "#"
      - listitem:
        - link "Blog":
          - /url: "#"
  - link:
    - /url: "#"
    - img
  - link:
    - /url: "#"
    - img
  - link:
    - /url: "#"
    - img
  - paragraph: © 2025 WalGit. All rights reserved.
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | test.describe('Button Visibility Tests', () => {
   4 |   test('all buttons should be visible and readable on HomePage', async ({ page }) => {
   5 |     await page.goto('/');
   6 |     
   7 |     // Test primary action buttons
   8 |     const buttons = await page.getByRole('button').all();
   9 |     for (const button of buttons) {
   10 |       // Check if button is visible
   11 |       await expect(button).toBeVisible();
   12 |       
   13 |       // Check if button has sufficient size
   14 |       const boundingBox = await button.boundingBox();
   15 |       expect(boundingBox.width).toBeGreaterThan(32);
>  16 |       expect(boundingBox.height).toBeGreaterThan(32);
      |                                  ^ Error: expect(received).toBeGreaterThan(expected)
   17 |       
   18 |       // Check if button text is readable (has sufficient contrast)
   19 |       const color = await button.evaluate((el) => {
   20 |         const style = window.getComputedStyle(el);
   21 |         return {
   22 |           background: style.backgroundColor,
   23 |           color: style.color,
   24 |           opacity: style.opacity
   25 |         };
   26 |       });
   27 |       
   28 |       // Ensure button is not transparent
   29 |       expect(parseFloat(color.opacity)).toBeGreaterThan(0.5);
   30 |     }
   31 |   });
   32 |
   33 |   test('all buttons should be visible and readable on Repository page', async ({ page }) => {
   34 |     await page.goto('/walgit/decentralized-git');
   35 |     
   36 |     // Test repository action buttons
   37 |     const buttons = await page.getByRole('button').all();
   38 |     for (const button of buttons) {
   39 |       await expect(button).toBeVisible();
   40 |       
   41 |       const boundingBox = await button.boundingBox();
   42 |       expect(boundingBox.width).toBeGreaterThan(32);
   43 |       expect(boundingBox.height).toBeGreaterThan(32);
   44 |       
   45 |       const color = await button.evaluate((el) => {
   46 |         const style = window.getComputedStyle(el);
   47 |         return {
   48 |           background: style.backgroundColor,
   49 |           color: style.color,
   50 |           opacity: style.opacity
   51 |         };
   52 |       });
   53 |       
   54 |       expect(parseFloat(color.opacity)).toBeGreaterThan(0.5);
   55 |     }
   56 |   });
   57 |
   58 |   test('all buttons should have sufficient padding and spacing', async ({ page }) => {
   59 |     await page.goto('/');
   60 |     
   61 |     const buttons = await page.getByRole('button').all();
   62 |     for (const button of buttons) {
   63 |       const computedStyle = await button.evaluate((el) => {
   64 |         const style = window.getComputedStyle(el);
   65 |         return {
   66 |           paddingLeft: parseFloat(style.paddingLeft),
   67 |           paddingRight: parseFloat(style.paddingRight),
   68 |           paddingTop: parseFloat(style.paddingTop),
   69 |           paddingBottom: parseFloat(style.paddingBottom),
   70 |           marginLeft: parseFloat(style.marginLeft),
   71 |           marginRight: parseFloat(style.marginRight)
   72 |         };
   73 |       });
   74 |       
   75 |       // Check for sufficient padding
   76 |       expect(computedStyle.paddingLeft).toBeGreaterThanOrEqual(8);
   77 |       expect(computedStyle.paddingRight).toBeGreaterThanOrEqual(8);
   78 |       expect(computedStyle.paddingTop).toBeGreaterThanOrEqual(4);
   79 |       expect(computedStyle.paddingBottom).toBeGreaterThanOrEqual(4);
   80 |       
   81 |       // Check for sufficient spacing between buttons
   82 |       expect(computedStyle.marginLeft + computedStyle.marginRight).toBeGreaterThanOrEqual(4);
   83 |     }
   84 |   });
   85 |
   86 |   test('buttons should be keyboard accessible', async ({ page }) => {
   87 |     await page.goto('/');
   88 |     
   89 |     const buttons = await page.getByRole('button').all();
   90 |     for (const button of buttons) {
   91 |       // Check if button can receive focus
   92 |       await button.focus();
   93 |       await expect(button).toBeFocused();
   94 |       
   95 |       // Check if button has visible focus indicator
   96 |       const focusStyles = await button.evaluate((el) => {
   97 |         const style = window.getComputedStyle(el);
   98 |         return {
   99 |           outlineWidth: parseFloat(style.outlineWidth),
  100 |           outlineStyle: style.outlineStyle,
  101 |           boxShadow: style.boxShadow
  102 |         };
  103 |       });
  104 |       
  105 |       const hasFocusIndicator = focusStyles.outlineWidth > 0 || 
  106 |                                focusStyles.outlineStyle !== 'none' ||
  107 |                                focusStyles.boxShadow !== 'none';
  108 |       expect(hasFocusIndicator).toBeTruthy();
  109 |     }
  110 |   });
  111 | });
```