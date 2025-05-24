import chalk from 'chalk';
import ora from 'ora';
import { validateWalletConnection } from '../utils/sui-wallet-integration.js';
import { initializeSuiClient } from '../utils/sui-integration.js';
import { getConfig } from '../utils/config.js';

/**
 * List repositories command
 * @param {import('commander').Command} program - Commander program instance
 */
export const listCommand = (program) => {
  program
    .command('list')
    .alias('ls')
    .description('List accessible repositories')
    .option('-o, --owned', 'Show only owned repositories')
    .option('-c, --collaborating', 'Show only repositories where you are a collaborator')
    .option('-a, --all', 'Show all repositories (default)')
    .option('--format <format>', 'Output format: table, json, or ids', 'table')
    .action(async (options) => {
      try {
        // Ensure wallet is connected
        const wallet = await validateWalletConnection();

        const spinner = ora('Fetching repositories...').start();
        const userAddress = wallet.address;
        const suiClient = await initializeSuiClient();
        const config = getConfig();

        // Fetch owned repositories
        const ownedRepos = await suiClient.getOwnedObjects({
          owner: userAddress,
          filter: {
            StructType: `${config.sui.packageId}::git_repository::Repo`
          },
          options: {
            showContent: true,
            showType: true
          }
        });

        const repositories = [];

        // Process owned repositories
        for (const repoRef of ownedRepos.data) {
          if (repoRef.data?.content && 'fields' in repoRef.data.content) {
            const fields = repoRef.data.content.fields;
            
            repositories.push({
              id: repoRef.data.objectId,
              name: fields.name,
              description: fields.description,
              owner: fields.owner,
              isOwner: true,
              role: 'Owner',
              defaultBranch: fields.default_branch,
              createdAt: new Date(fields.created_at),
              updatedAt: new Date(fields.updated_at),
              sealPolicyId: fields.seal_policy_id
            });
          }
        }

        // TODO: Query for repositories where user is collaborator
        // This would require indexing events or maintaining a separate index

        spinner.succeed('Repositories retrieved');

        // Filter repositories based on options
        let filteredRepos = repositories;
        if (options.owned) {
          filteredRepos = repositories.filter(repo => repo.isOwner);
        } else if (options.collaborating) {
          filteredRepos = repositories.filter(repo => !repo.isOwner);
        }

        // Output in requested format
        if (options.format === 'json') {
          console.log(JSON.stringify(filteredRepos, null, 2));
        } else if (options.format === 'ids') {
          filteredRepos.forEach(repo => {
            console.log(repo.id);
          });
        } else {
          // Table format (default)
          if (filteredRepos.length === 0) {
            console.log(chalk.yellow('No repositories found'));
            console.log(chalk.blue('Run `walgit init <name>` to create your first repository'));
            return;
          }

          console.log(chalk.bold(`\nFound ${filteredRepos.length} repository(ies):\n`));

          filteredRepos.forEach(repo => {
            console.log(`${chalk.cyan('●')} ${chalk.bold(repo.name)}`);
            console.log(`  ${chalk.dim('ID:')} ${repo.id}`);
            console.log(`  ${chalk.dim('Description:')} ${repo.description || 'No description'}`);
            console.log(`  ${chalk.dim('Role:')} ${chalk.green(repo.role)}`);
            console.log(`  ${chalk.dim('Branch:')} ${repo.defaultBranch}`);
            console.log(`  ${chalk.dim('Updated:')} ${repo.updatedAt.toLocaleDateString()}`);
            
            if (repo.sealPolicyId) {
              console.log(`  ${chalk.dim('Encryption:')} ${chalk.yellow('SEAL enabled')}`);
            }
            
            console.log(`  ${chalk.dim('Clone:')} ${chalk.blue(`walgit clone ${repo.id}`)}`);
            console.log('');
          });

          console.log(chalk.blue('Use `walgit clone <repository-id>` to clone any repository'));
        }

      } catch (error) {
        console.error(chalk.red('Failed to list repositories:'), error.message);
        process.exit(1);
      }
    });

  // Search repositories command
  program
    .command('search <query>')
    .description('Search for repositories by name or description')
    .option('--limit <limit>', 'Maximum number of results', parseInt, 10)
    .action(async (query, options) => {
      try {
        const wallet = await validateWalletConnection();

        const spinner = ora(`Searching for "${query}"...`).start();
        
        // This is a simplified search - in production, you'd want a proper indexing service
        const suiClient = await initializeSuiClient();
        const config = getConfig();

        // For now, we'll search through owned repositories
        // In production, this would query an indexing service
        const ownedRepos = await suiClient.getOwnedObjects({
          owner: wallet.address,
          filter: {
            StructType: `${config.sui.packageId}::git_repository::Repo`
          },
          options: {
            showContent: true,
            showType: true
          }
        });

        const results = [];
        const queryLower = query.toLowerCase();

        for (const repoRef of ownedRepos.data) {
          if (repoRef.data?.content && 'fields' in repoRef.data.content) {
            const fields = repoRef.data.content.fields;
            
            if (fields.name.toLowerCase().includes(queryLower) || 
                (fields.description && fields.description.toLowerCase().includes(queryLower))) {
              results.push({
                id: repoRef.data.objectId,
                name: fields.name,
                description: fields.description,
                owner: fields.owner,
                score: fields.name.toLowerCase().includes(queryLower) ? 2 : 1
              });
            }
          }
        }

        // Sort by relevance and limit results
        results.sort((a, b) => b.score - a.score);
        const limitedResults = results.slice(0, options.limit);

        spinner.succeed(`Found ${limitedResults.length} result(s)`);

        if (limitedResults.length === 0) {
          console.log(chalk.yellow(`No repositories found matching "${query}"`));
          return;
        }

        console.log(chalk.bold(`\nSearch results for "${query}":\n`));

        limitedResults.forEach((repo, index) => {
          console.log(`${index + 1}. ${chalk.bold(repo.name)}`);
          console.log(`   ${chalk.dim('ID:')} ${repo.id}`);
          console.log(`   ${chalk.dim('Description:')} ${repo.description || 'No description'}`);
          console.log(`   ${chalk.blue(`walgit clone ${repo.id}`)}`);
          console.log('');
        });

      } catch (error) {
        console.error(chalk.red('Search failed:'), error.message);
        process.exit(1);
      }
    });
};