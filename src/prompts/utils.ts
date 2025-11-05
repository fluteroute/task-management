import { stdin, stdout } from 'node:process';
import * as readline from 'node:readline/promises';
import chalk from 'chalk';
import inquirer from 'inquirer';

/**
 * Create a readline interface for user input
 */
export function createInterface() {
  return readline.createInterface({
    input: stdin,
    output: stdout,
  });
}

/**
 * Prompt user for a string input
 */
/* v8 ignore next -- @preserve */
export async function promptString(question: string, required: boolean = true): Promise<string> {
  const result = await inquirer.prompt([
    {
      type: 'input',
      name: 'value',
      message: chalk.yellow(question.endsWith(':') ? question : `${question}:`),
      validate: (value: string) => {
        if (required && !value.trim()) {
          return 'This field is required. Please enter a value.';
        }
        return true;
      },
    },
  ]);
  /* v8 ignore end */

  if (!result.value) {
    process.exit(0);
  }

  return result.value.trim();
}

/**
 * Prompt user for a number input
 */
/* v8 ignore next -- @preserve */
export async function promptNumber(question: string, required: boolean = true): Promise<number> {
  const result = await inquirer.prompt([
    {
      type: 'input',
      name: 'value',
      message: chalk.yellow(question.endsWith(':') ? question : `${question}:`),
      validate: (value: string) => {
        if (!required && (!value || value.trim() === '')) {
          return true;
        }
        const num = parseFloat(value);
        if (Number.isNaN(num)) {
          return 'Please enter a valid number.';
        }
        if (num <= 0) {
          return 'Please enter a positive number.';
        }
        return true;
      },
      filter: (value: string) => {
        const num = parseFloat(value);
        return Number.isNaN(num) ? (required ? 0 : undefined) : num;
      },
    },
  ]);
  /* v8 ignore end */

  if (!required && (result.value === undefined || result.value === null)) {
    return 0;
  }

  if (!result.value) {
    process.exit(0);
  }

  return result.value;
}

/**
 * Prompt user for optional string input
 */
/* v8 ignore next -- @preserve */
export async function promptOptionalString(question: string): Promise<string | undefined> {
  const result = await inquirer.prompt([
    {
      type: 'input',
      name: 'value',
      message: chalk.yellow(question.endsWith(':') ? question : `${question}:`),
      default: '',
    },
  ]);
  /* v8 ignore end */

  if (!result.value) {
    return undefined;
  }

  const trimmed = result.value.trim();
  return trimmed || undefined;
}

/**
 * Prompt user to select from a list of options (no custom value)
 * Uses radio button style with purple color and arrow key navigation
 */
/* v8 ignore next -- @preserve */
export async function promptSelect(
  question: string,
  options: readonly string[],
  _optionLabel: string
): Promise<string> {
  // Format choices - inquirer will add its own indicator, but we'll include radio buttons
  // The first option will be shown as selected (purple), others as unselected (gray)
  const choices = options.map((option) => ({
    name: option,
    value: option,
  }));

  const result = await inquirer.prompt([
    {
      type: 'list',
      name: 'value',
      message: chalk.yellow(question.endsWith(':') ? question : `${question}:`),
      choices,
      loop: false,
      pageSize: options.length,
      // Use custom theme to override the indicator
      theme: {
        icon: {
          cursor: '●',
        },
      },
    },
  ]);

  if (!result.value) {
    process.exit(0);
  }

  return result.value;
}

/**
 * Prompt user to select from a list of options or enter custom value
 * Uses radio button style with purple color and arrow key navigation
 */
/* v8 ignore next -- @preserve */
export async function promptSelectOrCustom(
  question: string,
  options: readonly string[],
  optionLabel: string
): Promise<string> {
  // Format choices
  const choices = [
    ...options.map((option) => ({
      name: option,
      value: option,
    })),
    {
      name: 'Enter custom value',
      value: '__CUSTOM__',
    },
  ];

  const result = await inquirer.prompt([
    {
      type: 'list',
      name: 'value',
      message: chalk.yellow(question.endsWith(':') ? question : `${question}:`),
      choices,
      loop: false,
      pageSize: choices.length,
      theme: {
        icon: {
          cursor: '●',
        },
      },
    },
  ]);

  if (!result.value) {
    process.exit(0);
  }

  if (result.value === '__CUSTOM__') {
    // User selected custom value, prompt for input
    const customResult = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message: chalk.yellow(`Enter ${optionLabel.toLowerCase()}`),
        validate: (value: string) => value.trim().length > 0 || 'Custom value cannot be empty.',
      },
    ]);

    if (!customResult.value) {
      process.exit(0);
    }

    return customResult.value.trim();
  }

  return result.value;
}
