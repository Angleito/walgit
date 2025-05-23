/**
 * Pull Request command implementation for WalGit CLI
 * Implements creating, viewing, reviewing, and merging pull requests
 */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import ora from 'ora';
import { walrusClient } from '../utils/walrus-sdk-integration.js';
import { initializeSuiClient } from '../utils/sui-integration.js';
import { getCurrentBranch } from '../utils/repository.js';
import { getCurrentRepository } from '../utils/config.js';
import { PRTransactionManager } from '../utils/pr-transaction-manager.js';
import { getConfig } from '../utils/config.js';
import { walletManager } from '../utils/wallet-integration.js';
import { 
  PR_STATUS, 
  PR_REVIEW_VERDICT, 
  PR_MERGE_STRATEGY
} from '../utils/constants.js';
import { formatErrorOutput } from '../utils/error-handler.js';

/**
 * Registers the PR command and subcommands to the CLI program
 * @param {Commander.Command} parentCommand - The parent command to attach to
 */
export function registerPRCommand(parentCommand) {
  const prCommand = parentCommand
    .command('pr')
    .description('Manage Pull Requests');
  
  // Create PR
  prCommand
    .command('create')
    .description('Create a new Pull Request')
    .option('-s, --source <branch>', 'Source branch')
    .option('-t, --target <branch>', 'Target branch')
    .option('-m, --message <message>', 'PR title/message')
    .option('-d, --description <description>', 'PR description')
    .option('--draft', 'Create as draft PR')
    .action(async (options) => {
      try {
        await createPullRequest(options);
      } catch (error) {
        console.error(chalk.red(`Error creating pull request: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // List PRs
  prCommand
    .command('list')
    .description('List Pull Requests')
    .option('-s, --status <status>', 'Filter by status (open, closed, merged, draft)', 'open')
    .option('-a, --author <author>', 'Filter by author')
    .option('-l, --limit <number>', 'Limit number of PRs to show', '10')
    .action(async (options) => {
      try {
        await listPullRequests(options);
      } catch (error) {
        console.error(chalk.red(`Error listing pull requests: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Show PR details
  prCommand
    .command('show <id>')
    .description('Show Pull Request details')
    .action(async (id) => {
      try {
        await showPullRequest(id);
      } catch (error) {
        console.error(chalk.red(`Error showing pull request: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Review PR
  prCommand
    .command('review <id>')
    .description('Review a Pull Request')
    .option('-v, --verdict <verdict>', 'Review verdict (approve, request_changes, comment)')
    .option('-m, --message <message>', 'Review message')
    .action(async (id, options) => {
      try {
        await reviewPullRequest(id, options);
      } catch (error) {
        console.error(chalk.red(`Error reviewing pull request: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Comment on PR
  prCommand
    .command('comment <id>')
    .description('Comment on a Pull Request')
    .option('-m, --message <message>', 'Comment message')
    .option('-f, --file <file>', 'File path to comment on')
    .option('-l, --line <line>', 'Line number to comment on')
    .action(async (id, options) => {
      try {
        await commentOnPullRequest(id, options);
      } catch (error) {
        console.error(chalk.red(`Error commenting on pull request: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Merge PR
  prCommand
    .command('merge <id>')
    .description('Merge a Pull Request')
    .option('-s, --strategy <strategy>', 'Merge strategy (merge, squash, rebase)', 'merge')
    .option('-m, --message <message>', 'Custom merge commit message')
    .action(async (id, options) => {
      try {
        await mergePullRequest(id, options);
      } catch (error) {
        console.error(chalk.red(`Error merging pull request: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Close PR
  prCommand
    .command('close <id>')
    .description('Close a Pull Request without merging')
    .option('-m, --message <message>', 'Closing comment')
    .action(async (id, options) => {
      try {
        await closePullRequest(id, options);
      } catch (error) {
        console.error(chalk.red(`Error closing pull request: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  return prCommand;
}

/**
 * Creates a new pull request
 * @param {Object} options - Command options
 */
async function createPullRequest(options) {
  const spinner = ora('Creating pull request...').start();
  
  try {
    // Get repository and branch information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    const currentBranch = await getCurrentBranch();
    const sourceBranch = options.source || currentBranch;
    const config = await getConfig();
    
    // If target branch not specified, use default branch
    const targetBranch = options.target || config.defaultBranch || 'main';
    
    // Validate branches
    if (sourceBranch === targetBranch) {
      spinner.fail('Source and target branches cannot be the same');
      return;
    }
    
    // Get PR title/message and description
    let title = options.message;
    let description = options.description;
    
    if (!title) {
      spinner.stop();
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'title',
          message: 'Enter pull request title:',
          validate: input => input.trim() !== '' ? true : 'Title is required'
        },
        {
          type: 'editor',
          name: 'description',
          message: 'Enter pull request description (optional):'
        }
      ]);
      
      title = answers.title;
      description = answers.description;
      spinner.start('Creating pull request...');
    }
    
    // Create the PR with blockchain-optimized transaction
    const walrusClient = walrusClient;
    const status = options.draft ? PR_STATUS.DRAFT : PR_STATUS.OPEN;
    
    const result = await PRTransactionManager.createPullRequest({
      sourceBranch,
      targetBranch,
      title,
      description,
      status
    }, repo.id);
    
    if (result && result.digest) {
      spinner.succeed(`Pull request created successfully (Transaction: ${result.digest.slice(0, 8)}...)`);
      
      // Extract PR ID from transaction result
      const prId = result.objectChanges?.find(change => 
        change.type === 'created' && 
        change.objectType.includes('git_pull_request::PullRequest')
      )?.objectId;
      
      if (prId) {
        console.log(chalk.green(`\nPull Request ID: ${prId}`));
        console.log(`\nSource: ${chalk.cyan(sourceBranch)}`);
        console.log(`Target: ${chalk.cyan(targetBranch)}`);
        console.log(`Status: ${status === PR_STATUS.DRAFT ? chalk.yellow('Draft') : chalk.green('Open')}`);
        console.log(`\nTitle: ${title}`);
        if (description) {
          console.log(`\nDescription:\n${description}`);
        }
      }
    } else {
      spinner.fail('Failed to create pull request');
    }
  } catch (error) {
    spinner.fail(`Error creating pull request: ${error.message}`);
    throw error;
  }
}

/**
 * Lists pull requests for the current repository
 * @param {Object} options - Command options
 */
async function listPullRequests(options) {
  const spinner = ora('Fetching pull requests...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get PRs from blockchain
    const walrusClient = walrusClient;
    const status = options.status || 'open';
    const limit = parseInt(options.limit, 10) || 10;
    
    const pullRequests = await walrusClient.getPullRequests(repo.id, {
      status,
      author: options.author,
      limit
    });
    
    spinner.succeed(`Found ${pullRequests.length} pull request(s)`);
    
    if (pullRequests.length === 0) {
      console.log(chalk.yellow(`\nNo ${status} pull requests found.`));
      return;
    }
    
    // Create table for displaying PRs
    const table = new Table({
      head: [
        chalk.white.bold('ID'),
        chalk.white.bold('Title'),
        chalk.white.bold('Source'),
        chalk.white.bold('Target'),
        chalk.white.bold('Author'),
        chalk.white.bold('Status'),
        chalk.white.bold('Created')
      ],
      colWidths: [10, 30, 15, 15, 20, 15, 15]
    });
    
    // Add PRs to table
    for (const pr of pullRequests) {
      const statusColor = {
        [PR_STATUS.OPEN]: chalk.green,
        [PR_STATUS.CLOSED]: chalk.red,
        [PR_STATUS.MERGED]: chalk.blue,
        [PR_STATUS.DRAFT]: chalk.yellow
      };
      
      // Format date
      const createdDate = new Date(pr.createdAt);
      const formattedDate = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString().slice(0, 5)}`;
      
      table.push([
        pr.id.slice(0, 8),
        pr.title,
        pr.sourceBranch,
        pr.targetBranch,
        pr.author.slice(0, 8) + '...',
        statusColor[pr.status](pr.status),
        formattedDate
      ]);
    }
    
    console.log(table.toString());
  } catch (error) {
    spinner.fail(`Error listing pull requests: ${error.message}`);
    throw error;
  }
}

/**
 * Shows details of a specific pull request
 * @param {string} id - Pull request ID
 */
async function showPullRequest(id) {
  const spinner = ora(`Fetching pull request ${id}...`).start();
  
  try {
    // Get PR details from blockchain
    const walrusClient = walrusClient;
    const pr = await walrusClient.getPullRequest(id);
    
    if (!pr) {
      spinner.fail(`Pull request ${id} not found`);
      return;
    }
    
    spinner.succeed(`Pull request ${id} fetched successfully`);
    
    // Status color mapping
    const statusColor = {
      [PR_STATUS.OPEN]: chalk.green,
      [PR_STATUS.CLOSED]: chalk.red,
      [PR_STATUS.MERGED]: chalk.blue,
      [PR_STATUS.DRAFT]: chalk.yellow
    };
    
    // Display PR details
    console.log(chalk.bold(`\n# Pull Request: ${pr.title}`));
    console.log(`\nID: ${pr.id}`);
    console.log(`Status: ${statusColor[pr.status](pr.status)}`);
    console.log(`Source: ${chalk.cyan(pr.sourceBranch)}`);
    console.log(`Target: ${chalk.cyan(pr.targetBranch)}`);
    console.log(`Author: ${pr.author}`);
    console.log(`Created: ${new Date(pr.createdAt).toLocaleString()}`);
    
    if (pr.lastUpdated) {
      console.log(`Updated: ${new Date(pr.lastUpdated).toLocaleString()}`);
    }
    
    if (pr.description) {
      console.log(chalk.bold('\nDescription:'));
      console.log(pr.description);
    }
    
    // Display reviews
    if (pr.reviews && pr.reviews.length > 0) {
      console.log(chalk.bold('\nReviews:'));
      
      const reviewTable = new Table({
        head: [
          chalk.white.bold('Reviewer'),
          chalk.white.bold('Verdict'),
          chalk.white.bold('Comment'),
          chalk.white.bold('Date')
        ],
        colWidths: [20, 15, 40, 25]
      });
      
      // Verdict color mapping
      const verdictColor = {
        [PR_REVIEW_VERDICT.APPROVE]: chalk.green,
        [PR_REVIEW_VERDICT.REQUEST_CHANGES]: chalk.red,
        [PR_REVIEW_VERDICT.COMMENT]: chalk.blue
      };
      
      for (const review of pr.reviews) {
        reviewTable.push([
          review.reviewer.slice(0, 16) + '...',
          verdictColor[review.verdict](review.verdict),
          review.comment ? review.comment.slice(0, 36) + (review.comment.length > 36 ? '...' : '') : '',
          new Date(review.timestamp).toLocaleString()
        ]);
      }
      
      console.log(reviewTable.toString());
    }
    
    // Display comments
    if (pr.comments && pr.comments.length > 0) {
      console.log(chalk.bold('\nComments:'));
      
      for (const comment of pr.comments) {
        console.log(chalk.gray('―'.repeat(80)));
        console.log(`${chalk.cyan(comment.author.slice(0, 8) + '...')} at ${new Date(comment.timestamp).toLocaleString()}`);
        
        if (comment.filePath) {
          console.log(`${chalk.yellow(comment.filePath)}${comment.lineNumber ? `:${comment.lineNumber}` : ''}`);
        }
        
        console.log(comment.content);
      }
    }
    
    // Display diff stats if available
    if (pr.diffStats) {
      console.log(chalk.bold('\nDiff Stats:'));
      console.log(`Files changed: ${pr.diffStats.filesChanged}`);
      console.log(`Insertions: ${chalk.green(`+${pr.diffStats.insertions}`)}`);
      console.log(`Deletions: ${chalk.red(`-${pr.diffStats.deletions}`)}`);
    }
  } catch (error) {
    spinner.fail(`Error showing pull request: ${error.message}`);
    throw error;
  }
}

/**
 * Reviews a pull request
 * @param {string} id - Pull request ID
 * @param {Object} options - Command options
 */
async function reviewPullRequest(id, options) {
  const spinner = ora(`Preparing review for pull request ${id}...`).start();
  
  try {
    // Validate PR exists
    const walrusClient = walrusClient;
    const pr = await walrusClient.getPullRequest(id);
    
    if (!pr) {
      spinner.fail(`Pull request ${id} not found`);
      return;
    }
    
    if (pr.status !== PR_STATUS.OPEN) {
      spinner.fail(`Cannot review a ${pr.status} pull request`);
      return;
    }
    
    spinner.stop();
    
    // Get review verdict and message
    let verdict = options.verdict;
    let message = options.message;
    
    if (!verdict) {
      const verdictAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'verdict',
          message: 'Select review verdict:',
          choices: [
            { name: 'Approve', value: PR_REVIEW_VERDICT.APPROVE },
            { name: 'Request Changes', value: PR_REVIEW_VERDICT.REQUEST_CHANGES },
            { name: 'Comment', value: PR_REVIEW_VERDICT.COMMENT }
          ]
        }
      ]);
      
      verdict = verdictAnswer.verdict;
    }
    
    if (!message) {
      const messageAnswer = await inquirer.prompt([
        {
          type: 'editor',
          name: 'message',
          message: 'Enter review message:'
        }
      ]);
      
      message = messageAnswer.message;
    }
    
    spinner.start('Submitting review...');
    
    // Submit the review with blockchain-optimized transaction
    const suiClient = await initializeSuiClient();
    const keypair = walletManager.currentKeypair;
    
    const result = await PRTransactionManager.submitReview(id, {
      verdict,
      description: message
    });
    
    if (result && (result.digest || result.reviewTx?.digest)) {
      const txDigest = result.digest || result.reviewTx.digest;
      spinner.succeed(`Review submitted successfully (Transaction: ${txDigest.slice(0, 8)}...)`);
      
      // Display review details
      const verdictColor = {
        [PR_REVIEW_VERDICT.APPROVE]: chalk.green,
        [PR_REVIEW_VERDICT.REQUEST_CHANGES]: chalk.red,
        [PR_REVIEW_VERDICT.COMMENT]: chalk.blue
      };
      
      console.log(`\nVerdict: ${verdictColor[verdict](verdict)}`);
      console.log(`\nMessage:\n${message}`);
    } else {
      spinner.fail('Failed to submit review');
    }
  } catch (error) {
    spinner.fail(`Error reviewing pull request: ${error.message}`);
    throw error;
  }
}

/**
 * Adds a comment to a pull request
 * @param {string} id - Pull request ID
 * @param {Object} options - Command options
 */
async function commentOnPullRequest(id, options) {
  const spinner = ora(`Adding comment to pull request ${id}...`).start();
  
  try {
    // Validate PR exists
    const walrusClient = walrusClient;
    const pr = await walrusClient.getPullRequest(id);
    
    if (!pr) {
      spinner.fail(`Pull request ${id} not found`);
      return;
    }
    
    if (pr.status !== PR_STATUS.OPEN && pr.status !== PR_STATUS.DRAFT) {
      spinner.warn(`Note: Commenting on a ${pr.status} pull request`);
    }
    
    spinner.stop();
    
    // Get comment message
    let message = options.message;
    const filePath = options.file;
    const lineNumber = options.line ? parseInt(options.line, 10) : null;
    
    if (!message) {
      const messageAnswer = await inquirer.prompt([
        {
          type: 'editor',
          name: 'message',
          message: 'Enter comment:'
        }
      ]);
      
      message = messageAnswer.message;
    }
    
    spinner.start('Adding comment...');
    
    // Submit the comment with blockchain-optimized transaction
    const comment = {
      content: message,
      filePath,
      lineNumber
    };
    
    const result = await PRTransactionManager.batchSubmitComments(id, [comment]);
    
    if (result && result.length > 0 && result[0].digest) {
      spinner.succeed(`Comment added successfully (Transaction: ${result[0].digest.slice(0, 8)}...)`);
      
      // Display comment details
      console.log(`\nComment:\n${message}`);
      
      if (filePath) {
        console.log(`\nFile: ${filePath}${lineNumber ? `:${lineNumber}` : ''}`);
      }
    } else {
      spinner.fail('Failed to add comment');
    }
  } catch (error) {
    spinner.fail(`Error adding comment: ${error.message}`);
    throw error;
  }
}

/**
 * Merges a pull request
 * @param {string} id - Pull request ID
 * @param {Object} options - Command options
 */
async function mergePullRequest(id, options) {
  const spinner = ora(`Preparing to merge pull request ${id}...`).start();
  
  try {
    // Validate PR exists and can be merged
    const walrusClient = walrusClient;
    const pr = await walrusClient.getPullRequest(id);
    
    if (!pr) {
      spinner.fail(`Pull request ${id} not found`);
      return;
    }
    
    if (pr.status !== PR_STATUS.OPEN) {
      spinner.fail(`Cannot merge a ${pr.status} pull request`);
      return;
    }
    
    // Check if PR can be merged
    const mergeCheck = await walrusClient.checkMergeability(id);
    
    if (!mergeCheck.canMerge) {
      spinner.fail(`Cannot merge: ${mergeCheck.reason}`);
      return;
    }
    
    spinner.stop();
    
    // Get merge strategy and message
    let strategy = options.strategy || PR_MERGE_STRATEGY.MERGE;
    let message = options.message;
    
    if (!options.strategy) {
      const strategyAnswer = await inquirer.prompt([
        {
          type: 'list',
          name: 'strategy',
          message: 'Select merge strategy:',
          choices: [
            { name: 'Merge (preserve commits)', value: PR_MERGE_STRATEGY.MERGE },
            { name: 'Squash (combine all commits)', value: PR_MERGE_STRATEGY.SQUASH },
            { name: 'Rebase (reapply commits)', value: PR_MERGE_STRATEGY.REBASE }
          ]
        }
      ]);
      
      strategy = strategyAnswer.strategy;
    }
    
    if (strategy === PR_MERGE_STRATEGY.SQUASH && !message) {
      const messageAnswer = await inquirer.prompt([
        {
          type: 'editor',
          name: 'message',
          message: 'Enter squash commit message:',
          default: `${pr.title}\n\nPull Request #${id}`
        }
      ]);
      
      message = messageAnswer.message;
    }
    
    // Confirm merge
    const confirmAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to merge PR #${id} using ${strategy} strategy?`,
        default: false
      }
    ]);
    
    if (!confirmAnswer.confirm) {
      console.log(chalk.yellow('Merge cancelled'));
      return;
    }
    
    spinner.start(`Merging with ${strategy} strategy...`);
    
    // Execute merge with blockchain-optimized transaction
    const result = await PRTransactionManager.mergePullRequest(id, strategy, {
      message
    });
    
    if (result && result.digest) {
      spinner.succeed(`Pull request merged successfully (Transaction: ${result.digest.slice(0, 8)}...)`);
      
      console.log(`\nStrategy: ${chalk.cyan(strategy)}`);
      console.log(`Source: ${chalk.cyan(pr.sourceBranch)}`);
      console.log(`Target: ${chalk.cyan(pr.targetBranch)}`);
      
      if (message) {
        console.log(`\nCommit message:\n${message}`);
      }
    } else {
      spinner.fail('Failed to merge pull request');
    }
  } catch (error) {
    spinner.fail(`Error merging pull request: ${error.message}`);
    throw error;
  }
}

/**
 * Closes a pull request without merging
 * @param {string} id - Pull request ID
 * @param {Object} options - Command options
 */
async function closePullRequest(id, options) {
  const spinner = ora(`Preparing to close pull request ${id}...`).start();
  
  try {
    // Validate PR exists
    const walrusClient = walrusClient;
    const pr = await walrusClient.getPullRequest(id);
    
    if (!pr) {
      spinner.fail(`Pull request ${id} not found`);
      return;
    }
    
    if (pr.status !== PR_STATUS.OPEN && pr.status !== PR_STATUS.DRAFT) {
      spinner.fail(`Cannot close a ${pr.status} pull request`);
      return;
    }
    
    spinner.stop();
    
    // Confirm close
    const confirmAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `Are you sure you want to close PR #${id} without merging?`,
        default: false
      }
    ]);
    
    if (!confirmAnswer.confirm) {
      console.log(chalk.yellow('Close cancelled'));
      return;
    }
    
    // Get closing comment if provided
    let message = options.message;
    
    if (!message) {
      const messageAnswer = await inquirer.prompt([
        {
          type: 'editor',
          name: 'message',
          message: 'Enter closing comment (optional):'
        }
      ]);
      
      message = messageAnswer.message;
    }
    
    spinner.start('Closing pull request...');
    
    // Execute close with blockchain-optimized transaction
    const result = await PRTransactionManager.updatePRStatus(id, PR_STATUS.CLOSED);
    
    if (result && result.digest) {
      spinner.succeed(`Pull request closed successfully (Transaction: ${result.digest.slice(0, 8)}...)`);
      
      // Add closing comment if provided
      if (message && message.trim() !== '') {
        spinner.start('Adding closing comment...');
        
        const commentResult = await PRTransactionManager.batchSubmitComments(id, [{
          content: message
        }]);
        
        if (commentResult && commentResult.length > 0 && commentResult[0].digest) {
          spinner.succeed('Closing comment added');
        } else {
          spinner.warn('Failed to add closing comment, but PR was closed');
        }
      }
    } else {
      spinner.fail('Failed to close pull request');
    }
  } catch (error) {
    spinner.fail(`Error closing pull request: ${error.message}`);
    throw error;
  }
}

export default {
  registerPRCommand
};