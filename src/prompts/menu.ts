import { promptSelect } from './utils.js';

/**
 * Prompt user for main menu selection.
 *
 * @returns A promise that resolves to the selected action: 'add', 'view', 'invoice', or 'exit'
 * @example
 * ```typescript
 * const action = await promptMainMenu();
 * if (action === 'add') {
 *   // Handle add task
 * }
 * ```
 * -- Display Output --
 * ```bash
 * ? Select an option: (Use arrow keys)
 *   > ➕ Add New Task
 *    📊 View Tasks by Client
 *    💰 Generate Invoice
 *    👋 Exit
 * ```
 */
export async function promptMainMenu(): Promise<'add' | 'view' | 'invoice' | 'exit'> {
  const options = [
    '➕ Add New Task',
    '📊 View Tasks by Client',
    '💰 Generate Invoice',
    '👋 Exit',
  ] as const;
  const selection = await promptSelect('Select an option', options, 'Main Menu');

  if (selection === '➕ Add New Task') return 'add';
  if (selection === '📊 View Tasks by Client') return 'view';
  if (selection === '💰 Generate Invoice') return 'invoice';
  return 'exit';
}

/**
 * Prompt user to select a client to view tasks for.
 *
 * **Display Output:**
 * Shows an interactive list with "All Clients" option (if enabled) followed by client names.
 *
 * @param availableClients - Array of available client names
 * @param includeAll - Whether to include "All Clients" option (default: true)
 * @returns A promise that resolves to the selected client name or 'all' for all clients
 * @example
 * ```typescript
 * const clients = ['Client A', 'Client B', 'Client C'];
 * const selected = await promptSelectClient(clients);
 * ```
 * -- Display Output --
 * ```bash
 * ? Select a client to view: (Use arrow keys)
 *   > All Clients
 *     Client A
 *     Client B
 *     Client C
 * ```
 */
export async function promptSelectClient(
  availableClients: string[],
  includeAll: boolean = true
): Promise<string | 'all'> {
  const options = includeAll ? ['All Clients', ...availableClients] : availableClients;
  const selection = await promptSelect('Select a client to view', options, 'Clients');

  if (selection === 'All Clients') return 'all';
  return selection;
}

/**
 * Prompt user to select a client for invoice generation.
 * Unlike promptSelectClient, this does not include an "All Clients" option.
 *
 * **Display Output:**
 * Shows an interactive list of client names only.
 *
 * @param availableClients - Array of available client names
 * @returns A promise that resolves to the selected client name
 * @example
 * ```typescript
 * const clients = ['Client A', 'Client B'];
 * const client = await promptSelectClientForInvoice(clients);
 * ```
 * -- Display Output --
 * ```bash
 * ? Select a client: (Use arrow keys)
 *   > Client A
 *     Client B
 * ```
 */
export async function promptSelectClientForInvoice(availableClients: string[]): Promise<string> {
  const selection = await promptSelect('Select a client', availableClients, 'Clients');
  return selection;
}

/**
 * Prompt user to select a billing period.
 * Formats billing dates (YYYY-MM-DD) into human-readable dates (e.g., "January 15, 2024").
 *
 * **Display Output:**
 * Shows an interactive list of formatted billing periods like "January 15, 2024" or "February 1, 2024".
 *
 * @param billingPeriods - Array of billing date strings in YYYY-MM-DD format
 * @returns A promise that resolves to the selected billing date string (YYYY-MM-DD format)
 * @example
 * ```typescript
 * const periods = ['2024-01-15', '2024-02-01', 'All Billing Periods'];
 * const selected = await promptSelectBillingPeriod(periods);
 * ```
 * -- Display Output --
 * ```bash
 * ? Select a billing period: (Use arrow keys)
 *   > All Billing Periods
 *     January 15, 2024
 *     February 1, 2024
 * ```
 */
export async function promptSelectBillingPeriod(billingPeriods: string[]): Promise<string> {
  // Format billing periods for display
  const formattedOptions = billingPeriods.map((period) => {
    // Check if it's the special "All Billing Periods" option
    if (period === 'All Billing Periods') {
      return period;
    }
    const date = new Date(`${period}T00:00:00`);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  });

  const selection = await promptSelect(
    'Select a billing period',
    formattedOptions,
    'Billing Periods'
  );

  // Find the original billing date string that matches
  const selectedIndex = formattedOptions.indexOf(selection);
  return billingPeriods[selectedIndex] ?? billingPeriods[0] ?? '';
}
