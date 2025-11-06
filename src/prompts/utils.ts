import { stdin, stdout } from 'node:process';
import * as readline from 'node:readline/promises';
import chalk from 'chalk';
import inquirer from 'inquirer';

/**
 * Create a readline interface for user input.
 *
 * @returns A readline interface configured for stdin/stdout
 */
export function createInterface() {
  return readline.createInterface({
    input: stdin,
    output: stdout,
  });
}

/**
 * Prompt user for a string input.
 *
 * @param question - The question to display to the user
 * @param required - Whether the input is required (default: true)
 * @returns A promise that resolves to the trimmed string input
 * @example
 * ```typescript
 * // Required input (default)
 * const name = await promptString('Enter your name');
 * // User sees: "? Enter your name: "
 * // Returns: "John Doe" (trimmed)
 *
 * // Optional input
 * const comment = await promptString('Enter a comment', false);
 * // User can press Enter to skip, returns empty string if skipped
 * ```
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
 * Prompt user for a number input. Validates that the input is a positive number.
 *
 * @param question - The question to display to the user
 * @param required - Whether the input is required (default: true)
 * @returns A promise that resolves to the parsed number
 * @example
 * ```typescript
 * // Required number input
 * const hours = await promptNumber('Hours worked');
 * // User sees: "? Hours worked: "
 * // User enters: "2.5"
 * // Returns: 2.5
 *
 * // Invalid input shows error and re-prompts:
 * // User enters: "abc"
 * // Error: "Please enter a valid number."
 * // User enters: "-5"
 * // Error: "Please enter a positive number."
 * ```
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
 * Prompt user for optional string input. Returns undefined if empty.
 *
 * @param question - The question to display to the user
 * @returns A promise that resolves to the trimmed string or undefined if empty
 * @example
 * ```typescript
 * const ticket = await promptOptionalString('Ticket number (optional)');
 * // User sees: "? Ticket number (optional): "
 * // User enters: "ABC-123"
 * // Returns: "ABC-123"
 *
 * // User presses Enter without entering anything:
 * // Returns: undefined
 * ```
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
 * Prompt user to select from a list of options (no custom value).
 * Uses radio button style with purple color and arrow key navigation.
 *
 * **Display Output:**
 * Shows an interactive list with arrow key navigation. The selected item is highlighted.
 * Uses a bullet point (●) as the cursor indicator.
 *
 * @param question - The question to display to the user
 * @param options - Array of option strings to choose from
 * @param _optionLabel - Label for the options (unused, kept for API consistency)
 * @returns A promise that resolves to the selected option string
 * @example
 * ```typescript
 * const options = ['Option 1', 'Option 2', 'Option 3'];
 * const selected = await promptSelect('Choose an option', options, 'Options');
 * ```
 * -- Display Output --
 * ```bash
 * ? Choose an option: (Use arrow keys)
 *   > ● Option 1
 *     ○ Option 2
 *     ○ Option 3
 * ```
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
 * Prompt user to select from a list of options or enter custom value.
 * Uses radio button style with purple color and arrow key navigation.
 *
 * **Display Output:**
 * Shows an interactive list with arrow key navigation, including an "Enter custom value" option.
 * If custom value is selected, prompts for text input.
 *
 * @param question - The question to display to the user
 * @param options - Array of option strings to choose from
 * @param optionLabel - Label for the custom value input (e.g., "client name", "activity type")
 * @returns A promise that resolves to the selected option or custom entered value
 * @example
 * ```typescript
 * const options = ['Implementation', 'Code Review'];
 * const selected = await promptSelectOrCustom('Select activity type', options, 'Activity Type');
 * ```
 * -- Display Output --
 * ```bash
 * ? Select activity type: (Use arrow keys)
 *   > ● Implementation
 *     ○ Code Review
 *     ○ Enter custom value
 * ```
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
