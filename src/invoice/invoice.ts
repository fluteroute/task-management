import chalk from 'chalk';
import Table from 'cli-table3';
import { calculateDueDate, getBillingPeriod } from '../billing/billing.js';
import { loadTasks } from '../storage/storage.js';
import type { TaskEntry } from '../types/index.js';

/**
 * Format date string for human-readable display.
 * Converts YYYY-MM-DD format to "Month Day, Year" format.
 *
 * @param dateStr - The date string in YYYY-MM-DD format
 * @returns A formatted date string (e.g., "January 15, 2024")
 * @internal Only used by displayInvoice
 * @example
 * ```typescript
 * const formatted = formatDate('2024-01-15');
 * // Returns: 'January 15, 2024'
 *
 * const formatted2 = formatDate('2024-12-25');
 * // Returns: 'December 25, 2024'
 * ```
 */
/* v8 ignore next -- @preserve */
function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Group tasks by client and billing period
 * @internal Only used by displayInvoice
 */
/* v8 ignore next -- @preserve */
async function groupTasksByClientAndBillingPeriod(
  tasks: TaskEntry[]
): Promise<Map<string, Map<string, TaskEntry[]>>> {
  const grouped = new Map<string, Map<string, TaskEntry[]>>();

  for (const task of tasks) {
    const client = task.client;
    const billingPeriod = await getBillingPeriod(task.date);
    const billingKey = billingPeriod.billingDate;

    if (!grouped.has(client)) {
      grouped.set(client, new Map());
    }

    const clientGroup = grouped.get(client);
    if (!clientGroup) {
      throw new Error(`Failed to get client group for ${client}`);
    }

    if (!clientGroup.has(billingKey)) {
      clientGroup.set(billingKey, []);
    }

    const taskGroup = clientGroup.get(billingKey);
    if (taskGroup) {
      taskGroup.push(task);
    }
  }

  return grouped;
}

/**
 * Get unique clients from tasks.
 *
 * @param tasks - Array of task entries
 * @returns A sorted array of unique client names
 * @example
 * ```typescript
 * const tasks = [
 *   { client: 'Client B', ... },
 *   { client: 'Client A', ... },
 *   { client: 'Client B', ... }
 * ];
 * const clients = getClientsFromTasks(tasks);
 * // Returns: ['Client A', 'Client B'] (sorted, unique)
 * ```
 */
export function getClientsFromTasks(tasks: TaskEntry[]): string[] {
  const clients = new Set<string>();
  for (const task of tasks) {
    clients.add(task.client);
  }
  return Array.from(clients).sort();
}

/**
 * Get available billing periods for a client
 */
async function getBillingPeriodsForClient(tasks: TaskEntry[], client: string): Promise<string[]> {
  const clientTasks = tasks.filter((task) => task.client === client);
  const periods = new Set<string>();

  for (const task of clientTasks) {
    const billingPeriod = await getBillingPeriod(task.date);
    periods.add(billingPeriod.billingDate);
  }

  return Array.from(periods).sort();
}

/**
 * Display invoice information for a client and billing period.
 * Automatically merges tasks with the same activity type and ticket number.
 *
 * @param client - The client name to generate invoice for
 * @param billingDate - The billing date in YYYY-MM-DD format
 * @example
 * ```typescript
 * await displayInvoice('Client A', '2024-01-15');
 * ```
 * -- Display Output --
 * ```bash
 * 💰 INVOICE
 * ============================================================
 * Client: Client A
 * Invoice Date: January 15, 2024
 * Due Date: January 30, 2024
 * Billing Period: January 1-14 (Billed: January 15)
 * ┌──────────────┬─────────────┬──────────┬────────┬─────────┐
 * │ Service      │ Description │ Rate     │ Hours  │ Amount  │
 * ├──────────────┼─────────────┼──────────┼────────┼─────────┤
 * │ Implementation│ ABC-123     │ $100.00  │ 4.00   │ $400.00 │
 * │ Code Review  │ DEF-456      │ $100.00  │ 2.50   │ $250.00 │
 * └──────────────┴─────────────┴──────────┴────────┴─────────┘
 * ────────────────────────────────────────────────────────────
 * Total Hours: 6.50
 * Total Amount: $650.00
 * ============================================================
 * ```
 */
/* v8 ignore next -- @preserve */
export async function displayInvoice(client: string, billingDate: string): Promise<void> {
  const tasks = await loadTasks();
  const clientTasks = tasks.filter((task) => task.client === client);

  if (clientTasks.length === 0) {
    /* v8 ignore next -- @preserve */
    console.log(chalk.yellow(`\n⚠️  No tasks found for client "${client}".\n`));
    return;
  }

  // Group by billing period
  const grouped = await groupTasksByClientAndBillingPeriod(clientTasks);
  const clientPeriods = grouped.get(client);

  if (!clientPeriods || !clientPeriods.has(billingDate)) {
    /* v8 ignore next -- @preserve */
    console.log(
      chalk.yellow(`\n⚠️  No billing periods found for billing period "${billingDate}".\n`)
    );
    return;
  }

  const periodTasks = clientPeriods.get(billingDate);
  if (!periodTasks || periodTasks.length === 0) {
    /* v8 ignore next -- @preserve */
    console.log(chalk.yellow(`\n⚠️  No tasks found for billing period "${billingDate}".\n`));
    return;
  }

  const firstTask = periodTasks[0];
  if (!firstTask) {
    throw new Error('Invalid task data');
  }

  const billingPeriodInfo = await getBillingPeriod(firstTask.date);

  // Group tasks by activity type and ticket number, merging hours for same type + ticket
  const tasksByKey = new Map<
    string,
    {
      date: string;
      activityType: string;
      ticketNumber: string | undefined;
      totalHours: number;
      rate: number;
      tasks: TaskEntry[];
    }
  >();

  for (const task of periodTasks) {
    // Create a unique key from activity type and ticket number
    const ticketKey = task.ticketNumber || '';
    const mergeKey = `${task.activityType}|${ticketKey}`;

    if (!tasksByKey.has(mergeKey)) {
      tasksByKey.set(mergeKey, {
        date: task.date,
        activityType: task.activityType,
        ticketNumber: task.ticketNumber,
        totalHours: 0,
        rate: task.rate,
        tasks: [],
      });
    }

    const group = tasksByKey.get(mergeKey);
    if (!group) {
      throw new Error(`Failed to get task group for key ${mergeKey}`);
    }
    group.totalHours += task.hoursWorked;
    group.tasks.push(task);

    // Update date to earliest date for this group (for sorting)
    if (task.date < group.date) {
      group.date = task.date;
    }
  }

  // Sort merged tasks by date, then by activity type
  const mergedTasks = Array.from(tasksByKey.values()).sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.activityType.localeCompare(b.activityType);
  });

  // Calculate totals
  let totalHours = 0;
  let totalAmount = 0;

  for (const mergedTask of mergedTasks) {
    totalHours += mergedTask.totalHours;
    totalAmount += mergedTask.totalHours * mergedTask.rate;
  }

  // Calculate due date
  const dueDate = await calculateDueDate(billingDate);

  // Display invoice header
  /* v8 ignore next -- @preserve */
  console.log(chalk.blue.bold(`\n${'='.repeat(60)}`));
  /* v8 ignore next -- @preserve */
  console.log(chalk.blue.bold('💰 INVOICE'));
  /* v8 ignore next -- @preserve */
  console.log(chalk.blue('='.repeat(60)));
  /* v8 ignore next -- @preserve */
  console.log();

  /* v8 ignore next -- @preserve */
  console.log(chalk.white(`Client: ${chalk.magenta.bold(client)}`));
  /* v8 ignore next -- @preserve */
  console.log(chalk.white(`Invoice Date: ${chalk.cyan(formatDate(billingDate))}`));
  /* v8 ignore next -- @preserve */
  console.log(chalk.white(`Due Date: ${chalk.blue(formatDate(dueDate))}`));
  /* v8 ignore next -- @preserve */
  console.log(chalk.white(`Billing Period: ${chalk.gray(billingPeriodInfo.periodLabel)}`));
  /* v8 ignore next -- @preserve */
  console.log();

  // Create invoice items table
  /* v8 ignore next -- @preserve */
  const table = new Table({
    head: [
      chalk.cyan.bold('Service'),
      chalk.cyan.bold('Description'),
      chalk.cyan.bold('Rate'),
      chalk.cyan.bold('Hours'),
      chalk.cyan.bold('Amount'),
    ],
    style: {
      head: [],
      border: ['gray'],
    },
    colWidths: [20, 15, 12, 10, 12],
  });

  // Add invoice items (merged by activity type and ticket number)
  for (const mergedTask of mergedTasks) {
    const description = mergedTask.ticketNumber || '-';
    const amount = (mergedTask.totalHours * mergedTask.rate).toFixed(2);
    /* v8 ignore next -- @preserve */
    table.push([
      chalk.white(mergedTask.activityType),
      chalk.white(description),
      chalk.white(`$${mergedTask.rate.toFixed(2)}`),
      chalk.white(mergedTask.totalHours.toFixed(2)),
      chalk.green.bold(`$${amount}`),
    ]);
  }

  /* v8 ignore next -- @preserve */
  console.log(table.toString());
  /* v8 ignore next -- @preserve */
  console.log();

  // Display totals
  /* v8 ignore next -- @preserve */
  console.log(chalk.blue('─'.repeat(60)));
  /* v8 ignore next -- @preserve */
  console.log(chalk.white(`Total Hours: ${chalk.yellow.bold(totalHours.toFixed(2))}`));
  /* v8 ignore next -- @preserve */
  console.log(chalk.white(`Total Amount: ${chalk.green.bold(`$${totalAmount.toFixed(2)}`)}`));
  /* v8 ignore next -- @preserve */
  console.log(chalk.blue('='.repeat(60)));
  /* v8 ignore next -- @preserve */
  console.log();
}

/**
 * Get billing periods for a client (wrapper for prompt usage).
 * Returns billing dates for a specific client from tasks.
 *
 * @param tasks - Array of all task entries
 * @param client - The client name to filter by
 * @returns A promise that resolves to a sorted array of billing date strings (YYYY-MM-DD format)
 * @example
 * ```typescript
 * const tasks = [
 *   { client: 'Client A', date: '2024-01-05', ... },
 *   { client: 'Client A', date: '2024-01-20', ... }
 * ];
 * const periods = await getBillingPeriodsForClientPrompt(tasks, 'Client A');
 * // Returns: ['2024-01-15', '2024-02-01']
 * ```
 */
export async function getBillingPeriodsForClientPrompt(
  tasks: TaskEntry[],
  client: string
): Promise<string[]> {
  const periods = await getBillingPeriodsForClient(tasks, client);
  return periods;
}
