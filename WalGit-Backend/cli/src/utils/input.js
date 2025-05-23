/**
 * @fileoverview Input utilities for CLI
 * Provides secure input functions for passwords and user prompts
 */

import readline from 'readline';

/**
 * Get user input from command line
 * @param {string} prompt - Prompt text
 * @returns {Promise<string>} - User input
 */
export function getInput(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Get password input (hidden)
 * @param {string} prompt - Prompt text
 * @returns {Promise<string>} - Password input
 */
export function getPassword(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Hide input
    rl._writeToOutput = function _writeToOutput(stringToWrite) {
      if (stringToWrite.charCodeAt(0) === 13) { // carriage return
        rl.output.write('\n');
      }
    };
    
    rl.question(prompt, (password) => {
      rl.close();
      console.log(); // Add newline after hidden input
      resolve(password);
    });
  });
}