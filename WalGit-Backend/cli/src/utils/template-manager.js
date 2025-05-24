import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Template Manager for handling repository templates
 * Provides functionality to list, get, and apply templates
 */
export class TemplateManager {
  constructor() {
    // Find templates directory relative to this module's location
    this.templatesDir = this._findTemplatesDirectory();
    this.manifestPath = path.join(this.templatesDir, 'template-manifest.json');
    this.templates = this._loadTemplates();
  }

  /**
   * Find the templates directory in various possible locations
   * @returns {string} Path to templates directory
   * @private
   */
  _findTemplatesDirectory() {
    // First try to get current working directory safely
    let currentDir;
    try {
      currentDir = process.cwd();
    } catch (error) {
      // If cwd fails, use the module's directory as fallback
      currentDir = path.resolve(__dirname, '..', '..');
    }

    // Possible template locations (in order of preference)
    const possiblePaths = [
      // Current CLI structure: cli/src/utils -> ../../../templates
      path.resolve(__dirname, '..', '..', '..', 'templates'),
      // Alternative: relative to package root
      path.resolve(__dirname, '..', '..', 'templates'),
      // Fallback: in the working directory (if accessible)
      path.join(currentDir, 'templates'),
      // Another fallback: parent of working directory
      path.join(currentDir, '..', 'templates'),
      // Final fallback: create default templates directory
      path.join(__dirname, '..', '..', 'templates')
    ];

    for (const templatePath of possiblePaths) {
      try {
        if (fs.existsSync(templatePath) && fs.existsSync(path.join(templatePath, 'template-manifest.json'))) {
          return templatePath;
        }
      } catch (error) {
        // Continue to next path if this one fails
        continue;
      }
    }

    // If no templates directory found, create a default one
    const defaultPath = possiblePaths[0];
    try {
      if (!fs.existsSync(defaultPath)) {
        fs.mkdirSync(defaultPath, { recursive: true });
        // Create a basic manifest file
        const basicManifest = {
          templates: {
            basic: {
              name: "Basic Repository",
              description: "A basic repository template",
              files: []
            }
          }
        };
        fs.writeFileSync(path.join(defaultPath, 'template-manifest.json'), JSON.stringify(basicManifest, null, 2));
      }
    } catch (error) {
      console.warn('Could not create templates directory:', error.message);
    }
    
    return defaultPath;
  }

  /**
   * Load templates from the manifest file
   * @returns {Array} Array of template objects
   * @private
   */
  _loadTemplates() {
    try {
      if (fs.existsSync(this.manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(this.manifestPath, 'utf-8'));
        return manifest.templates || [];
      }
      // Templates directory or manifest not found
      console.warn(chalk.yellow('Templates not found. Template features will be disabled.'));
      console.warn(chalk.dim(`Searched in: ${this.templatesDir}`));
      return [];
    } catch (error) {
      console.error(chalk.red('Error loading templates:'), error.message);
      console.error(chalk.dim(`Template directory: ${this.templatesDir}`));
      return [];
    }
  }

  /**
   * Get all available templates
   * @param {Object} options - Filter options
   * @param {string} options.category - Filter by category
   * @param {Array} options.tags - Filter by tags
   * @returns {Array} Array of template objects
   */
  getTemplates(options = {}) {
    let result = this.templates;
    
    if (options.category) {
      result = result.filter(t => t.category === options.category);
    }
    
    if (options.tags && options.tags.length > 0) {
      result = result.filter(t => {
        return options.tags.some(tag => t.tags.includes(tag));
      });
    }
    
    return result.map(template => ({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      tags: template.tags,
      recommended: template.recommended || false
    }));
  }

  /**
   * Get a specific template by ID
   * @param {string} templateId - Template ID
   * @returns {Object|null} Template object or null if not found
   */
  getTemplate(templateId) {
    return this.templates.find(t => t.id === templateId) || null;
  }

  /**
   * Apply a template to a directory
   * @param {string} templateId - Template ID
   * @param {string} targetDir - Directory to apply template to
   * @param {Object} variables - Variables to replace in template content
   * @returns {Promise<Object>} Result object with success status and files created
   */
  async applyTemplate(templateId, targetDir, variables = {}) {
    const template = this.getTemplate(templateId);
    if (!template) {
      return { success: false, error: `Template '${templateId}' not found` };
    }

    // Ensure target directory exists and is writable
    try {
      if (!fs.existsSync(targetDir)) {
        return { success: false, error: `Target directory '${targetDir}' does not exist` };
      }
      
      // Test if we can write to the directory
      const testFile = path.join(targetDir, '.walgit-write-test');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
    } catch (error) {
      return { success: false, error: `Cannot write to target directory '${targetDir}': ${error.message}` };
    }

    const filesCreated = [];
    const errors = [];

    try {
      // Process each file in the template
      for (const file of template.files) {
        const filePath = path.resolve(targetDir, file.path);
        const dirPath = path.dirname(filePath);
        
        // Ensure file path is within target directory (security check)
        if (!filePath.startsWith(path.resolve(targetDir))) {
          errors.push(`File path '${file.path}' is outside target directory`);
          continue;
        }
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Replace variables in content
        let content = file.content;
        if (variables) {
          for (const [key, value] of Object.entries(variables)) {
            content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
          }
        }
        
        // Write file
        fs.writeFileSync(filePath, content);
        filesCreated.push(file.path);
      }
      
      if (errors.length > 0) {
        console.warn(chalk.yellow('Some files could not be created:'), errors.join(', '));
      }
      
      return { 
        success: true, 
        templateId, 
        filesCreated,
        errors,
        message: `Applied template '${template.name}' successfully (${filesCreated.length} files created)`
      };
    } catch (error) {
      console.error(chalk.red('Error applying template:'), error.message);
      return { 
        success: false, 
        error: error.message,
        templateId,
        filesCreated,
        errors
      };
    }
  }

  /**
   * Get categories with templates
   * @returns {Array} Array of category objects with counts
   */
  getCategories() {
    const categories = {};
    
    this.templates.forEach(template => {
      const category = template.category || 'other';
      if (!categories[category]) {
        categories[category] = {
          name: category,
          count: 0
        };
      }
      categories[category].count++;
    });
    
    return Object.values(categories);
  }
}

/**
 * Singleton instance of TemplateManager
 */
export const templateManager = new TemplateManager();