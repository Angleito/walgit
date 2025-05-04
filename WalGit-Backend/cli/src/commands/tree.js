import chalk from 'chalk';
import ora from 'ora';
import { getTreeStructure } from '../utils/repository.js';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';

/**
 * View Git tree structure
 * @param {import('commander').Command} program - Commander program instance
 */
export const treeCommand = (program) => {
  program
    .command('tree')
    .description('View Git tree structure')
    .option('-c, --commit <commit>', 'Commit ID (defaults to HEAD)')
    .option('-r, --recursive', 'Recursively display tree contents', false)
    .option('-p, --path <path>', 'Path within the tree to display')
    .option('-o, --objects', 'Show Sui object IDs', false)
    .action(async (options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if we're in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          console.error(chalk.red('Not in a WalGit repository'));
          process.exit(1);
        }
        
        const treeSpinner = ora('Loading tree structure...').start();
        
        // Get tree structure
        const treeData = await getTreeStructure({
          commit: options.commit,
          path: options.path,
          recursive: options.recursive,
          repository: repository
        });
        
        treeSpinner.succeed('Tree structure loaded');
        
        // Display tree header
        console.log(`Tree for commit: ${chalk.green(treeData.commitId.substring(0, 8))}`);
        if (options.path) {
          console.log(`Path: ${options.path}`);
        }
        console.log('');
        
        // Display tree structure
        displayTree(treeData.tree, '', options.recursive, options.objects);
      } catch (error) {
        console.error(chalk.red('Failed to display tree:'), error.message);
        process.exit(1);
      }
    });
};

/**
 * Recursively display tree structure
 * @param {object} tree - Tree data
 * @param {string} indent - Indentation string
 * @param {boolean} recursive - Whether to recursively display subtrees
 * @param {boolean} showObjects - Whether to show object IDs
 */
function displayTree(tree, indent = '', recursive = false, showObjects = false) {
  if (!tree || !tree.entries) {
    console.log(`${indent}(empty tree)`);
    return;
  }
  
  tree.entries.forEach(entry => {
    const objectInfo = showObjects ? ` (${entry.object_id.substring(0, 8)})` : '';
    
    if (entry.type === 'blob') {
      // Display file
      console.log(`${indent}${chalk.green(entry.name)}${objectInfo}`);
    } else if (entry.type === 'tree') {
      // Display directory
      console.log(`${indent}${chalk.blue(entry.name)}/${objectInfo}`);
      
      // Recursively display subtree if enabled
      if (recursive && entry.subtree) {
        displayTree(entry.subtree, `${indent}  `, recursive, showObjects);
      }
    }
  });
}