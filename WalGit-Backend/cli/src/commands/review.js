/**
 * Code Review command implementation for WalGit CLI
 * Handles inline comments, review threads, and diff viewing
 */

import { program } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import Table from 'cli-table3';
import { CodeReviewManager } from '../utils/code-review-manager.js';
import { getCurrentBranch } from '../utils/repository.js';
import { getCurrentRepository } from '../utils/config.js';
import { getConfig } from '../utils/config.js';
import { walletManager } from '../utils/wallet-integration.js';
import { formatErrorOutput } from '../utils/error-handler.js';

/**
 * Registers the Review command and subcommands to the CLI program
 * @param {Commander.Command} parentCommand - The parent command to attach to
 */
export function registerReviewCommand(parentCommand) {
  const reviewCommand = parentCommand
    .command('review')
    .description('Manage code reviews and inline comments');
  
  // Comment on a specific file and line number
  reviewCommand
    .command('comment')
    .description('Add an inline comment to a specific file and line')
    .option('-p, --pr <id>', 'Pull request ID')
    .option('-f, --file <path>', 'File path')
    .option('-l, --line <number>', 'Line number', parseInt)
    .option('-m, --message <message>', 'Comment message')
    .action(async (options) => {
      try {
        await addInlineComment(options);
      } catch (error) {
        console.error(chalk.red(`Error adding comment: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Create a new review thread
  reviewCommand
    .command('thread')
    .description('Start a new review thread')
    .option('-p, --pr <id>', 'Pull request ID')
    .option('-f, --file <path>', 'File path')
    .option('-l, --line <number>', 'Line number', parseInt)
    .option('-m, --message <message>', 'Initial comment message')
    .action(async (options) => {
      try {
        await createReviewThread(options);
      } catch (error) {
        console.error(chalk.red(`Error creating review thread: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Reply to an existing thread
  reviewCommand
    .command('reply <threadId>')
    .description('Reply to an existing review thread')
    .option('-m, --message <message>', 'Reply message')
    .action(async (threadId, options) => {
      try {
        await replyToThread(threadId, options);
      } catch (error) {
        console.error(chalk.red(`Error replying to thread: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Resolve or reopen a thread
  reviewCommand
    .command('resolve <threadId>')
    .description('Resolve a review thread')
    .action(async (threadId) => {
      try {
        await resolveThread(threadId);
      } catch (error) {
        console.error(chalk.red(`Error resolving thread: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  reviewCommand
    .command('reopen <threadId>')
    .description('Reopen a resolved review thread')
    .action(async (threadId) => {
      try {
        await reopenThread(threadId);
      } catch (error) {
        console.error(chalk.red(`Error reopening thread: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Show threads for a PR
  reviewCommand
    .command('threads')
    .description('List all review threads for a pull request')
    .option('-p, --pr <id>', 'Pull request ID')
    .action(async (options) => {
      try {
        await listThreads(options);
      } catch (error) {
        console.error(chalk.red(`Error listing threads: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Show thread details
  reviewCommand
    .command('show <threadId>')
    .description('Show details of a review thread')
    .action(async (threadId) => {
      try {
        await showThreadDetails(threadId);
      } catch (error) {
        console.error(chalk.red(`Error showing thread: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  // Show file diff with comments
  reviewCommand
    .command('diff')
    .description('Show file diff with comments')
    .option('-p, --pr <id>', 'Pull request ID')
    .option('-f, --file <path>', 'File path')
    .action(async (options) => {
      try {
        await showFileDiff(options);
      } catch (error) {
        console.error(chalk.red(`Error showing diff: ${formatErrorOutput(error)}`));
        process.exit(1);
      }
    });
  
  return reviewCommand;
}

/**
 * Adds an inline comment to a specific file and line
 * @param {Object} options - Command options
 */
async function addInlineComment(options) {
  const spinner = ora('Adding inline comment...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get PR ID, file path, and line number
    let prId = options.pr;
    let filePath = options.file;
    let lineNumber = options.line;
    let message = options.message;
    
    // Prompt for missing information
    if (!prId || !filePath || !lineNumber || !message) {
      spinner.stop();
      
      const prompts = [];
      
      if (!prId) {
        prompts.push({
          type: 'input',
          name: 'prId',
          message: 'Enter pull request ID:',
          validate: input => input.trim() !== '' ? true : 'Pull request ID is required'
        });
      }
      
      if (!filePath) {
        prompts.push({
          type: 'input',
          name: 'filePath',
          message: 'Enter file path:',
          validate: input => input.trim() !== '' ? true : 'File path is required'
        });
      }
      
      if (!lineNumber) {
        prompts.push({
          type: 'number',
          name: 'lineNumber',
          message: 'Enter line number:',
          validate: input => !isNaN(input) && input > 0 ? true : 'Line number must be a positive number'
        });
      }
      
      if (!message) {
        prompts.push({
          type: 'editor',
          name: 'message',
          message: 'Enter comment:',
          validate: input => input.trim() !== '' ? true : 'Comment message is required'
        });
      }
      
      const answers = await inquirer.prompt(prompts);
      
      prId = prId || answers.prId;
      filePath = filePath || answers.filePath;
      lineNumber = lineNumber || answers.lineNumber;
      message = message || answers.message;
      
      spinner.start('Adding inline comment...');
    }
    
    // Get review summary ID for the repository
    const reviewSummaryId = repo.reviewSummaryId;
    
    // Add the comment
    const result = await CodeReviewManager.createInlineComment(
      prId,
      filePath,
      lineNumber,
      message,
      { reviewSummaryId }
    );
    
    if (result && result.digest) {
      spinner.succeed(`Comment added successfully (Transaction: ${result.digest.slice(0, 8)}...)`);
      
      // Show comment details
      console.log(chalk.bold('\nComment Details:'));
      console.log(`File: ${chalk.cyan(filePath)}:${chalk.yellow(lineNumber)}`);
      console.log(`\n${message}`);
    } else {
      spinner.fail('Failed to add comment');
    }
  } catch (error) {
    spinner.fail(`Error adding comment: ${error.message}`);
    throw error;
  }
}

/**
 * Creates a new review thread
 * @param {Object} options - Command options
 */
async function createReviewThread(options) {
  const spinner = ora('Creating review thread...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get PR ID, file path, and line number
    let prId = options.pr;
    let filePath = options.file;
    let lineNumber = options.line;
    let message = options.message;
    
    // Prompt for missing information
    if (!prId || !filePath || !lineNumber || !message) {
      spinner.stop();
      
      const prompts = [];
      
      if (!prId) {
        prompts.push({
          type: 'input',
          name: 'prId',
          message: 'Enter pull request ID:',
          validate: input => input.trim() !== '' ? true : 'Pull request ID is required'
        });
      }
      
      if (!filePath) {
        prompts.push({
          type: 'input',
          name: 'filePath',
          message: 'Enter file path:',
          validate: input => input.trim() !== '' ? true : 'File path is required'
        });
      }
      
      if (!lineNumber) {
        prompts.push({
          type: 'number',
          name: 'lineNumber',
          message: 'Enter line number:',
          validate: input => !isNaN(input) && input > 0 ? true : 'Line number must be a positive number'
        });
      }
      
      if (!message) {
        prompts.push({
          type: 'editor',
          name: 'message',
          message: 'Enter initial comment:',
          validate: input => input.trim() !== '' ? true : 'Comment message is required'
        });
      }
      
      const answers = await inquirer.prompt(prompts);
      
      prId = prId || answers.prId;
      filePath = filePath || answers.filePath;
      lineNumber = lineNumber || answers.lineNumber;
      message = message || answers.message;
      
      spinner.start('Creating review thread...');
    }
    
    // Get review summary ID for the repository
    const reviewSummaryId = repo.reviewSummaryId;
    
    // Create the thread
    const result = await CodeReviewManager.createReviewThread(
      prId,
      filePath,
      lineNumber,
      message,
      { reviewSummaryId }
    );
    
    if (result && result.digest) {
      spinner.succeed(`Review thread created successfully (Transaction: ${result.digest.slice(0, 8)}...)`);
      
      // Extract thread ID from transaction result
      const threadId = result.objectChanges?.find(change => 
        change.type === 'created' && 
        change.objectType.includes('git_code_review::ReviewThread')
      )?.objectId;
      
      if (threadId) {
        console.log(chalk.bold('\nThread Details:'));
        console.log(`Thread ID: ${chalk.cyan(threadId)}`);
        console.log(`File: ${chalk.cyan(filePath)}:${chalk.yellow(lineNumber)}`);
        console.log(`\nInitial Comment:\n${message}`);
      }
    } else {
      spinner.fail('Failed to create review thread');
    }
  } catch (error) {
    spinner.fail(`Error creating review thread: ${error.message}`);
    throw error;
  }
}

/**
 * Replies to an existing review thread
 * @param {string} threadId - Thread ID
 * @param {Object} options - Command options
 */
async function replyToThread(threadId, options) {
  const spinner = ora(`Replying to thread ${threadId}...`).start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get message
    let message = options.message;
    
    // Prompt for message if not provided
    if (!message) {
      spinner.stop();
      
      const answers = await inquirer.prompt([
        {
          type: 'editor',
          name: 'message',
          message: 'Enter reply:',
          validate: input => input.trim() !== '' ? true : 'Reply message is required'
        }
      ]);
      
      message = answers.message;
      
      spinner.start(`Replying to thread ${threadId}...`);
    }
    
    // Get review summary ID for the repository
    const reviewSummaryId = repo.reviewSummaryId;
    
    // Reply to the thread
    const result = await CodeReviewManager.replyToThread(
      threadId,
      message,
      { reviewSummaryId }
    );
    
    if (result && result.digest) {
      spinner.succeed(`Reply added successfully (Transaction: ${result.digest.slice(0, 8)}...)`);
      console.log(`\n${message}`);
    } else {
      spinner.fail('Failed to add reply');
    }
  } catch (error) {
    spinner.fail(`Error replying to thread: ${error.message}`);
    throw error;
  }
}

/**
 * Resolves a review thread
 * @param {string} threadId - Thread ID
 */
async function resolveThread(threadId) {
  const spinner = ora(`Resolving thread ${threadId}...`).start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Resolve the thread
    const result = await CodeReviewManager.resolveThread(threadId);
    
    if (result && result.digest) {
      spinner.succeed(`Thread resolved successfully (Transaction: ${result.digest.slice(0, 8)}...)`);
    } else {
      spinner.fail('Failed to resolve thread');
    }
  } catch (error) {
    spinner.fail(`Error resolving thread: ${error.message}`);
    throw error;
  }
}

/**
 * Reopens a resolved review thread
 * @param {string} threadId - Thread ID
 */
async function reopenThread(threadId) {
  const spinner = ora(`Reopening thread ${threadId}...`).start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Reopen the thread
    const result = await CodeReviewManager.reopenThread(threadId);
    
    if (result && result.digest) {
      spinner.succeed(`Thread reopened successfully (Transaction: ${result.digest.slice(0, 8)}...)`);
    } else {
      spinner.fail('Failed to reopen thread');
    }
  } catch (error) {
    spinner.fail(`Error reopening thread: ${error.message}`);
    throw error;
  }
}

/**
 * Lists all threads for a pull request
 * @param {Object} options - Command options
 */
async function listThreads(options) {
  const spinner = ora('Fetching review threads...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get PR ID
    let prId = options.pr;
    
    // Prompt for PR ID if not provided
    if (!prId) {
      spinner.stop();
      
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'prId',
          message: 'Enter pull request ID:',
          validate: input => input.trim() !== '' ? true : 'Pull request ID is required'
        }
      ]);
      
      prId = answers.prId;
      
      spinner.start('Fetching review threads...');
    }
    
    // Get review summary ID for the repository
    const reviewSummaryId = repo.reviewSummaryId;
    
    // Get threads for the PR
    const threadIds = await CodeReviewManager.getThreadsForPullRequest(prId, reviewSummaryId);
    
    if (threadIds.length === 0) {
      spinner.succeed('No review threads found');
      return;
    }
    
    spinner.succeed(`Found ${threadIds.length} review thread(s)`);
    
    // Fetch details for each thread
    const threads = await Promise.all(
      threadIds.map(threadId => CodeReviewManager.getThreadDetails(threadId))
    );
    
    // Create table for display
    const table = new Table({
      head: [
        chalk.white.bold('ID'),
        chalk.white.bold('File'),
        chalk.white.bold('Line'),
        chalk.white.bold('Status'),
        chalk.white.bold('Creator'),
        chalk.white.bold('Comments'),
        chalk.white.bold('Updated')
      ],
      colWidths: [10, 30, 8, 12, 12, 12, 20]
    });
    
    // Add threads to table
    for (const thread of threads) {
      const statusText = {
        0: chalk.green('Open'),
        1: chalk.blue('Resolved'),
        2: chalk.yellow('Outdated')
      }[thread.status];
      
      // Find latest comment time
      const latestComment = thread.comments.sort((a, b) => 
        parseInt(b.createdAt) - parseInt(a.createdAt)
      )[0];
      
      const lastUpdated = latestComment 
        ? new Date(parseInt(latestComment.createdAt) * 1000).toLocaleString() 
        : new Date(parseInt(thread.createdAt) * 1000).toLocaleString();
      
      table.push([
        thread.id.slice(0, 8),
        thread.filePath.length > 28 ? '...' + thread.filePath.slice(-25) : thread.filePath,
        thread.lineNumber,
        statusText,
        thread.creator.slice(0, 8) + '...',
        thread.comments.length.toString(),
        lastUpdated
      ]);
    }
    
    console.log(table.toString());
  } catch (error) {
    spinner.fail(`Error listing threads: ${error.message}`);
    throw error;
  }
}

/**
 * Shows details of a specific review thread
 * @param {string} threadId - Thread ID
 */
async function showThreadDetails(threadId) {
  const spinner = ora(`Fetching thread ${threadId}...`).start();
  
  try {
    // Get thread details
    const thread = await CodeReviewManager.getThreadDetails(threadId);
    
    spinner.succeed(`Thread ${threadId.slice(0, 8)} fetched successfully`);
    
    // Display thread information
    console.log(chalk.bold(`\nReview Thread: ${thread.id.slice(0, 8)}...`));
    console.log(`File: ${chalk.cyan(thread.filePath)}:${chalk.yellow(thread.lineNumber)}`);
    console.log(`Status: ${
      thread.status === 0 ? chalk.green('Open') :
      thread.status === 1 ? chalk.blue('Resolved') :
      chalk.yellow('Outdated')
    }`);
    console.log(`Created by: ${thread.creator}`);
    console.log(`Created at: ${new Date(parseInt(thread.createdAt) * 1000).toLocaleString()}`);
    
    if (thread.status === 1) {
      console.log(`Resolved by: ${thread.resolvedBy}`);
      console.log(`Resolved at: ${new Date(parseInt(thread.resolvedAt) * 1000).toLocaleString()}`);
    }
    
    // Display comments
    console.log(chalk.bold('\nComments:'));
    
    thread.comments.forEach((comment, index) => {
      console.log(chalk.gray('―'.repeat(80)));
      console.log(`${chalk.cyan(comment.commenter.slice(0, 8) + '...')} at ${
        new Date(parseInt(comment.createdAt) * 1000).toLocaleString()
      }`);
      
      console.log(comment.content);
    });
    
    console.log(chalk.gray('―'.repeat(80)));
  } catch (error) {
    spinner.fail(`Error showing thread: ${error.message}`);
    throw error;
  }
}

/**
 * Shows file diff with comments
 * @param {Object} options - Command options
 */
async function showFileDiff(options) {
  const spinner = ora('Fetching file diff...').start();
  
  try {
    // Get repository information
    const repo = await getCurrentRepository();
    
    if (!repo) {
      spinner.fail('Not in a WalGit repository');
      return;
    }
    
    // Get PR ID and file path
    let prId = options.pr;
    let filePath = options.file;
    
    // Prompt for missing information
    if (!prId || !filePath) {
      spinner.stop();
      
      const prompts = [];
      
      if (!prId) {
        prompts.push({
          type: 'input',
          name: 'prId',
          message: 'Enter pull request ID:',
          validate: input => input.trim() !== '' ? true : 'Pull request ID is required'
        });
      }
      
      if (!filePath) {
        prompts.push({
          type: 'input',
          name: 'filePath',
          message: 'Enter file path:',
          validate: input => input.trim() !== '' ? true : 'File path is required'
        });
      }
      
      const answers = await inquirer.prompt(prompts);
      
      prId = prId || answers.prId;
      filePath = filePath || answers.filePath;
      
      spinner.start('Fetching file diff...');
    }
    
    // Get review summary ID for the repository
    const reviewSummaryId = repo.reviewSummaryId;
    
    // Get the file diff and comments in parallel
    const [fileDiff, comments] = await Promise.all([
      CodeReviewManager.getFileDiff(prId, filePath),
      CodeReviewManager.getCommentsForFile(prId, filePath, reviewSummaryId)
    ]);
    
    if (!fileDiff) {
      spinner.fail(`File diff not found for ${filePath}`);
      return;
    }
    
    spinner.succeed(`File diff loaded: ${filePath}`);
    
    // Display diff stats
    console.log(chalk.bold(`\nDiff for ${filePath}`));
    console.log(`${chalk.green('+')}${fileDiff.stats.added} ${chalk.red('-')}${fileDiff.stats.removed} lines changed`);
    
    // Display the diff with comments
    console.log(chalk.gray('―'.repeat(100)));
    
    // Map comments by line number for quick lookup
    const commentsByLine = {};
    comments.forEach(comment => {
      if (!commentsByLine[comment.lineNumber]) {
        commentsByLine[comment.lineNumber] = [];
      }
      commentsByLine[comment.lineNumber].push(comment);
    });
    
    // Display diff hunks
    for (const hunk of fileDiff.hunks) {
      // Display hunk header
      console.log(chalk.cyan(`@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`));
      
      // Display context before
      for (const line of hunk.contextBefore) {
        console.log(` ${line}`);
      }
      
      // Display diff lines
      for (const line of hunk.lines) {
        let linePrefix;
        let lineNumber;
        
        if (line.changeType === 0) { // Added
          linePrefix = chalk.green('+');
          lineNumber = line.lineNumberNew;
        } else if (line.changeType === 1) { // Removed
          linePrefix = chalk.red('-');
          lineNumber = line.lineNumberOld;
        } else if (line.changeType === 2) { // Modified
          linePrefix = chalk.yellow('~');
          lineNumber = line.lineNumberNew;
        } else { // Unchanged
          linePrefix = ' ';
          lineNumber = line.lineNumberNew;
        }
        
        // Display the line
        console.log(`${linePrefix}${line.content}`);
        
        // Display comments for this line
        if (commentsByLine[lineNumber]) {
          for (const comment of commentsByLine[lineNumber]) {
            console.log(chalk.yellow(`┆ ${comment.commenter.slice(0, 8)}... commented:`));
            console.log(chalk.yellow(`┆ ${comment.content.replace(/\n/g, '\n┆ ')}`));
          }
        }
      }
      
      // Display context after
      for (const line of hunk.contextAfter) {
        console.log(` ${line}`);
      }
      
      console.log(chalk.gray('―'.repeat(100)));
    }
  } catch (error) {
    spinner.fail(`Error showing diff: ${error.message}`);
    throw error;
  }
}

export default {
  registerReviewCommand
};