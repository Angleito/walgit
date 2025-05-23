import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

/**
 * Template Manager for handling repository templates
 * Provides functionality to list, get, and apply templates
 */
export class TemplateManager {
  constructor() {
    this.templatesDir = path.join(process.cwd(), '..', 'templates');
    this.manifestPath = path.join(this.templatesDir, 'template-manifest.json');
    this.templates = this._loadTemplates();
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
      return [];
    } catch (error) {
      console.error(chalk.red('Error loading templates:'), error.message);
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

    const filesCreated = [];
    const errors = [];

    try {
      // Process each file in the template
      for (const file of template.files) {
        const filePath = path.join(targetDir, file.path);
        const dirPath = path.dirname(filePath);
        
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
      
      return { 
        success: true, 
        templateId, 
        filesCreated,
        message: `Applied template '${template.name}' successfully`
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