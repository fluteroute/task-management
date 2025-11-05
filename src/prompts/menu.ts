import { promptSelect } from './utils.js';

/**
 * Prompt user for main menu selection
 */
export async function promptMainMenu(): Promise<'add' | 'view' | 'invoice' | 'exit'> {
  const options = ['➕ Add New Task', '📊 View Tasks by Client', '💰 Generate Invoice', '👋 Exit'] as const;
  const selection = await promptSelect(
    'Select an option',
    options,
    'Main Menu'
  );
  
  if (selection === '➕ Add New Task') return 'add';
  if (selection === '📊 View Tasks by Client') return 'view';
  if (selection === '💰 Generate Invoice') return 'invoice';
  return 'exit';
}

/**
 * Prompt user to select a client to view
 */
export async function promptSelectClient(availableClients: string[], includeAll: boolean = true): Promise<string | 'all'> {
  const options = includeAll ? ['All Clients', ...availableClients] : availableClients;
  const selection = await promptSelect(
    'Select a client to view',
    options,
    'Clients'
  );
  
  if (selection === 'All Clients') return 'all';
  return selection;
}

/**
 * Prompt user to select a client for invoice (no "All Clients" option)
 */
export async function promptSelectClientForInvoice(availableClients: string[]): Promise<string> {
  const selection = await promptSelect(
    'Select a client',
    availableClients,
    'Clients'
  );
  return selection;
}

/**
 * Prompt user to select a billing period
 */
export async function promptSelectBillingPeriod(billingPeriods: string[]): Promise<string> {
  // Format billing periods for display
  const formattedOptions = billingPeriods.map(period => {
    // Check if it's the special "All Billing Periods" option
    if (period === 'All Billing Periods') {
      return period;
    }
    const date = new Date(period + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
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

