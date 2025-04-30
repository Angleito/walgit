import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { getCommitHistory } from '../utils/repository.js';

/**
 * Register the log command
 * @param {import('commander').Command} program - Commander program instance
 */
export const logCommand = (program) => {
  program
    .command('log')
    .description('Show commit logs')
    .option('-n, --max-count <number>', 'Limit the number of commits to output')
    .option('--skip <number>', 'Skip number commits before starting to show the commit output')
    .option('--since <date>', 'Show commits more recent than a specific date')
    .option('--until <date>', 'Show commits older than a specific date')
    .option('--author <pattern>', 'Only show commits from a specific author')
    .option('--grep <pattern>', 'Only show commits with a message that matches the pattern')
    .option('--oneline', 'Show each commit as a single line')
    .option('--graph', 'Draw a text-based graphical representation of the commit history')
    .action(async (options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Get commit history
        const commits = await getCommitHistory({
          maxCount: options.maxCount ? parseInt(options.maxCount) : undefined,
          skip: options.skip ? parseInt(options.skip) : undefined,
          since: options.since,
          until: options.until,
          author: options.author,
          grep: options.grep,
          oneline: options.oneline || false,
          graph: options.graph || false
        });
        
        if (commits.length === 0) {
          console.log(chalk.yellow('No commits found'));
          return;
        }
        
        // Display commits
        if (options.oneline) {
          commits.forEach(commit => {
            console.log(`${chalk.yellow(commit.id.substring(0, 7))} ${commit.message.split('\n')[0]}`);
          });
        } else {
          commits.forEach((commit, index) => {
            console.log(chalk.yellow(`commit ${commit.id}`));
            console.log(`Author: ${commit.author} <${commit.email}>`);
            console.log(`Date:   ${commit.date}`);
            console.log('');
            console.log(`    ${commit.message.replace(/\n/g, '\n    ')}`);
            
            if (index < commits.length - 1) {
              console.log('\n');
            }
          });
        }
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
