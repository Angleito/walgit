import chalk from 'chalk';
import { validateWalletConnection } from '../utils/auth.js';
import { getCurrentRepository } from '../utils/config.js';
import { createTag, deleteTag, listTags } from '../utils/repository.js';

/**
 * Register the tag command
 * @param {import('commander').Command} program - Commander program instance
 */
export const tagCommand = (program) => {
  program
    .command('tag [tagname] [commit]')
    .description('Create, list, delete or verify a tag object signed with GPG')
    .option('-a, --annotate', 'Create an annotated tag')
    .option('-m, --message <message>', 'Tag message')
    .option('-d, --delete <tag>', 'Delete a tag')
    .option('-l, --list [pattern]', 'List tags with names matching the pattern')
    .action(async (tagname, commit, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        // Check if in a repository
        const repository = await getCurrentRepository();
        if (!repository) {
          throw new Error('Not in a WalGit repository');
        }
        
        // Handle tag deletion
        if (options.delete) {
          console.log(chalk.blue(`Deleting tag '${options.delete}'...`));
          await deleteTag(options.delete);
          console.log(chalk.green(`Deleted tag '${options.delete}'`));
          return;
        }
        
        // Handle tag listing
        if (options.list || (!tagname && !options.delete)) {
          console.log(chalk.blue('Listing tags...'));
          const tags = await listTags(options.list);
          
          if (tags.length === 0) {
            console.log(chalk.yellow('No tags found'));
          } else {
            tags.forEach(tag => {
              if (tag.annotation) {
                console.log(`${tag.name}\t${tag.annotation}`);
              } else {
                console.log(tag.name);
              }
            });
          }
          return;
        }
        
        // Handle tag creation
        if (!tagname) {
          throw new Error('Tag name is required for creating a tag');
        }
        
        console.log(chalk.blue(`Creating tag '${tagname}'...`));
        
        await createTag({
          name: tagname,
          commit: commit || 'HEAD',
          annotate: options.annotate || false,
          message: options.message
        });
        
        console.log(chalk.green(`Created tag '${tagname}'`));
      } catch (error) {
        console.error(chalk.red('Error:'), error.message);
      }
    });
};
