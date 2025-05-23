import chalk from 'chalk';
import ora from 'ora';
import { templateManager } from '../utils/template-manager.js';
import { validateWalletConnection } from '../utils/auth.js';
import { createRepository } from '../utils/repository.js';
import fs from 'fs';
import path from 'path';

/**
 * Template command for managing repository templates
 * @param {import('commander').Command} program - Commander program instance
 */
export const templateCommand = (program) => {
  const template = program
    .command('template')
    .description('Manage repository templates');

  template
    .command('list')
    .description('List available templates')
    .option('-c, --category <category>', 'Filter by category')
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .action(async (options) => {
      try {
        // Parse tags if provided
        const tags = options.tags ? options.tags.split(',').map(t => t.trim()) : null;
        
        // Get templates with filters
        const templates = templateManager.getTemplates({
          category: options.category,
          tags: tags
        });
        
        if (templates.length === 0) {
          console.log(chalk.yellow('No templates found matching your criteria'));
          return;
        }
        
        console.log(chalk.bold('Available Templates:'));
        
        // Group templates by category
        const templatesByCategory = {};
        templates.forEach(template => {
          const category = template.category || 'Other';
          if (!templatesByCategory[category]) {
            templatesByCategory[category] = [];
          }
          templatesByCategory[category].push(template);
        });
        
        // Print templates by category
        for (const [category, categoryTemplates] of Object.entries(templatesByCategory)) {
          console.log(chalk.blue(`\n${category.charAt(0).toUpperCase() + category.slice(1)}:`));
          categoryTemplates.forEach(template => {
            const recommended = template.recommended ? chalk.green(' [Recommended]') : '';
            console.log(`  ${chalk.cyan(template.id)}: ${template.name}${recommended}`);
            console.log(`    ${template.description}`);
            if (template.tags && template.tags.length > 0) {
              console.log(`    Tags: ${template.tags.join(', ')}`);
            }
          });
        }
      } catch (error) {
        console.error(chalk.red('Error listing templates:'), error.message);
      }
    });

  template
    .command('info')
    .description('Get detailed information about a template')
    .argument('<templateId>', 'Template ID')
    .action(async (templateId) => {
      try {
        const template = templateManager.getTemplate(templateId);
        
        if (!template) {
          console.error(chalk.red(`Template '${templateId}' not found`));
          return;
        }
        
        console.log(chalk.bold(`Template: ${template.name}`));
        console.log(chalk.dim(`ID: ${template.id}`));
        console.log(chalk.dim(`Category: ${template.category || 'Other'}`));
        console.log(`\nDescription: ${template.description}`);
        
        if (template.tags && template.tags.length > 0) {
          console.log(`\nTags: ${template.tags.join(', ')}`);
        }
        
        if (template.recommended) {
          console.log(chalk.green('\n✓ Recommended for new projects'));
        }
        
        console.log(chalk.blue('\nFiles:'));
        template.files.forEach(file => {
          console.log(`  • ${file.path}`);
        });
        
        console.log(chalk.blue('\nUsage:'));
        console.log(`  walgit template create <name> --template ${template.id}`);
        console.log(`  walgit init <name> --template ${template.id}`);
      } catch (error) {
        console.error(chalk.red('Error getting template info:'), error.message);
      }
    });

  template
    .command('create')
    .description('Create a new repository from a template')
    .argument('<name>', 'Repository name')
    .option('-t, --template <templateId>', 'Template ID to use')
    .option('-d, --description <description>', 'Repository description')
    .option('-p, --private', 'Create a private repository', false)
    .option('--dir <directory>', 'Target directory (defaults to current directory)')
    .action(async (name, options) => {
      try {
        // Validate wallet connection
        await validateWalletConnection();
        
        const spinner = ora('Processing template...').start();
        
        if (!options.template) {
          spinner.fail('No template specified');
          console.log('Use --template to specify a template ID or run "walgit template list" to see available templates');
          return;
        }
        
        // Get template
        const template = templateManager.getTemplate(options.template);
        if (!template) {
          spinner.fail(`Template '${options.template}' not found`);
          return;
        }
        
        // Create target directory if specified, otherwise use current directory
        const targetDir = options.dir ? path.resolve(options.dir, name) : path.join(process.cwd(), name);
        
        // Check if directory already exists
        if (fs.existsSync(targetDir)) {
          spinner.fail(`Directory '${targetDir}' already exists`);
          return;
        }
        
        // Create directory
        fs.mkdirSync(targetDir, { recursive: true });
        
        // Apply template
        spinner.text = `Applying template '${template.name}'...`;
        const result = await templateManager.applyTemplate(options.template, targetDir, {
          repositoryName: name,
          description: options.description || template.description
        });
        
        if (!result.success) {
          spinner.fail(`Failed to apply template: ${result.error}`);
          return;
        }
        
        // Create repository in WalGit
        spinner.text = 'Creating repository in WalGit...';
        const repoData = await createRepository({
          name,
          description: options.description || template.description,
          isPrivate: options.private
        });
        
        spinner.succeed(`Repository '${name}' created from template '${template.name}'`);
        console.log(`\nRepository ID: ${chalk.yellow(repoData.id)}`);
        console.log(`Created ${chalk.green(result.filesCreated.length)} files from template`);
        console.log(chalk.dim('\nNext steps:'));
        console.log(chalk.dim(`  cd ${name}`));
        console.log(chalk.dim('  walgit status'));
      } catch (error) {
        console.error(chalk.red('Error creating repository from template:'), error.message);
      }
    });

  return template;
};