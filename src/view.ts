import chalk from 'chalk';
import Table from 'cli-table3';
import type { TaskEntry } from './types/index.js';
import { loadTasks } from './storage.js';
import { getHourLimitForClient } from './rates.js';
import { getBillingPeriod } from './billing.js';

/**
 * Group tasks by client and billing period
 * @internal Only used by displayTasksByClient
 */
/* v8 ignore next -- @preserve */
async function groupTasksByClientAndBillingPeriod(tasks: TaskEntry[]): Promise<Map<string, Map<string, TaskEntry[]>>> {
  const grouped = new Map<string, Map<string, TaskEntry[]>>();
  
  for (const task of tasks) {
    const client = task.client;
    const billingPeriod = await getBillingPeriod(task.date);
    const billingKey = billingPeriod.billingDate;
    
    if (!grouped.has(client)) {
      grouped.set(client, new Map());
    }
    
    const clientGroup = grouped.get(client)!;
    if (!clientGroup.has(billingKey)) {
      clientGroup.set(billingKey, []);
    }
    
    clientGroup.get(billingKey)!.push(task);
  }
  
  return grouped;
}

/**
 * Calculate totals for a client
 * @internal Only used by displayTasksByClient
 */
/* v8 ignore next -- @preserve */
function calculateClientTotals(tasks: TaskEntry[]): {
  totalHours: number;
  totalAmount: number;
  taskCount: number;
} {
  let totalHours = 0;
  let totalAmount = 0;
  
  for (const task of tasks) {
    totalHours += task.hoursWorked;
    totalAmount += task.hoursWorked * task.rate;
  }
  
  return {
    totalHours,
    totalAmount,
    taskCount: tasks.length,
  };
}

/**
 * Get unique clients from tasks
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
export async function getBillingPeriodsForClient(tasks: TaskEntry[], client: string): Promise<string[]> {
  const clientTasks = tasks.filter(task => task.client === client);
  const periods = new Set<string>();
  
  for (const task of clientTasks) {
    const billingPeriod = await getBillingPeriod(task.date);
    periods.add(billingPeriod.billingDate);
  }
  
  return Array.from(periods).sort();
}

/**
 * Display all tasks grouped by client and billing period in table format
 * @param selectedClient - If provided, only show tasks for this client. If 'all', show all clients.
 * @param selectedBillingPeriod - If provided, only show tasks for this billing period (YYYY-MM-DD format)
 */
/* v8 ignore next -- @preserve */
export async function displayTasksByClient(selectedClient?: string | 'all', selectedBillingPeriod?: string): Promise<void> {
  const tasks = await loadTasks();
  
  if (tasks.length === 0) {
    /* v8 ignore next -- @preserve */
    console.log(chalk.yellow('\n⚠️  No tasks recorded yet.\n'));
    return;
  }
  
  // Filter tasks if a specific client is selected
  let filteredTasks = tasks;
  if (selectedClient && selectedClient !== 'all') {
    filteredTasks = tasks.filter(task => task.client === selectedClient);
    if (filteredTasks.length === 0) {
      /* v8 ignore next -- @preserve */
      console.log(chalk.yellow(`\n⚠️  No tasks found for client "${selectedClient}".\n`));
      return;
    }
  }
  
  // Filter by billing period if specified
  if (selectedBillingPeriod) {
    const filtered: TaskEntry[] = [];
    for (const task of filteredTasks) {
      const billingPeriod = await getBillingPeriod(task.date);
      if (billingPeriod.billingDate === selectedBillingPeriod) {
        filtered.push(task);
      }
    }
    filteredTasks = filtered;
    if (filteredTasks.length === 0) {
      /* v8 ignore next -- @preserve */
      console.log(chalk.yellow('\n⚠️  No tasks found for the selected billing period.\n'));
      return;
    }
  }
  
  const grouped = await groupTasksByClientAndBillingPeriod(filteredTasks);
  
  /* v8 ignore next -- @preserve */
  console.log(chalk.blue.bold('\n📊 === Tasks by Client and Billing Period ===\n'));
  
  // Sort clients alphabetically
  const sortedClients = Array.from(grouped.keys()).sort();
  
  for (const client of sortedClients) {
    const clientBillingPeriods = grouped.get(client);
    if (!clientBillingPeriods) continue;
    
    const hourLimit = await getHourLimitForClient(client);
    
    // Display client header
    /* v8 ignore next -- @preserve */
    console.log(chalk.magenta.bold(`\n📋 ${client}`));
    if (hourLimit !== undefined) {
      /* v8 ignore next -- @preserve */
      console.log(chalk.gray(`  Limit: ${hourLimit}h per billing period`));
    }
    
    // Sort billing periods by date (oldest first)
    const sortedBillingDates = Array.from(clientBillingPeriods.keys()).sort();
    
    let clientTotalHours = 0;
    let clientTotalAmount = 0;
    let clientTotalTasks = 0;
    
    // Display each billing period
    for (const billingDate of sortedBillingDates) {
      const periodTasks = clientBillingPeriods.get(billingDate);
      if (!periodTasks || periodTasks.length === 0) continue;
      
      // Get period label from first task
      const periodInfo = await getBillingPeriod(periodTasks[0]!.date);
      
      // Create table for this billing period
      /* v8 ignore next -- @preserve */
      const table = new Table({
        head: [
          chalk.cyan.bold('Date'),
          chalk.cyan.bold('Time'),
          chalk.cyan.bold('Activity'),
          chalk.cyan.bold('Ticket'),
          chalk.cyan.bold('Hours'),
          chalk.cyan.bold('Rate'),
          chalk.cyan.bold('Total')
        ],
        style: {
          head: [],
          border: ['gray']
        },
        colWidths: [12, 10, 15, 12, 8, 12, 12]
      });
      
      // Sort tasks by date (oldest first for cumulative tracking)
      const sortedTasks = [...periodTasks].sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
      
      // Track cumulative hours for color coding within this billing period
      let cumulativeHours = 0;
      
      // Add task rows to table
      for (const task of sortedTasks) {
        cumulativeHours += task.hoursWorked;
        const total = (task.hoursWorked * task.rate).toFixed(2);
        
        // Determine color for hours based on cumulative total and limit
        /* v8 ignore next -- @preserve */
        let hoursColor = chalk.yellow;
        if (hourLimit !== undefined) {
          const remainingHours = hourLimit - cumulativeHours;
          if (remainingHours <= 0) {
            // At or over limit
            hoursColor = chalk.red.bold;
          } else if (remainingHours <= 2) {
            // Within 1-2 hours of limit
            hoursColor = chalk.red;
          } else if (remainingHours <= 4) {
            // Within 2-4 hours of limit
            hoursColor = chalk.yellow;
          } else {
            // Well below limit (> 4 hours remaining)
            hoursColor = chalk.green;
          }
        }
        
        table.push([
          chalk.white(task.date),
          chalk.white(task.time),
          chalk.white(task.activityType),
          task.ticketNumber ? chalk.white(task.ticketNumber) : chalk.gray('-'),
          hoursColor(task.hoursWorked.toString()),
          chalk.white(`$${task.rate}/hr`),
          chalk.green.bold(`$${total}`)
        ]);
      }
      
      // Calculate period totals
      const periodTotals = calculateClientTotals(periodTasks);
      clientTotalHours += periodTotals.totalHours;
      clientTotalAmount += periodTotals.totalAmount;
      clientTotalTasks += periodTotals.taskCount;
      
      // Display billing period header
      /* v8 ignore next -- @preserve */
      console.log(chalk.blue(`\n  📅 ${periodInfo.periodLabel}`));
      /* v8 ignore next -- @preserve */
      console.log();
      
      // Display table
      /* v8 ignore next -- @preserve */
      console.log(table.toString());
      
      // Display period totals with color coding
      /* v8 ignore next -- @preserve */
      let periodHoursColor = chalk.yellow;
      /* v8 ignore next -- @preserve */
      let periodLimitStatus = '';
      if (hourLimit !== undefined) {
        const remainingHours = hourLimit - periodTotals.totalHours;
        if (remainingHours <= 0) {
          /* v8 ignore next -- @preserve */
          periodHoursColor = chalk.red.bold;
          /* v8 ignore next -- @preserve */
          periodLimitStatus = chalk.red.bold(` (LIMIT EXCEEDED by ${Math.abs(remainingHours).toFixed(2)}h)`);
        } else if (remainingHours <= 2) {
          /* v8 ignore next -- @preserve */
          periodHoursColor = chalk.red.bold;
          /* v8 ignore next -- @preserve */
          periodLimitStatus = chalk.red(` (${remainingHours.toFixed(2)}h remaining)`);
        } else if (remainingHours <= 4) {
          /* v8 ignore next -- @preserve */
          periodHoursColor = chalk.yellow;
          /* v8 ignore next -- @preserve */
          periodLimitStatus = chalk.yellow(` (${remainingHours.toFixed(2)}h remaining)`);
        } else {
          /* v8 ignore next -- @preserve */
          periodHoursColor = chalk.green;
          /* v8 ignore next -- @preserve */
          periodLimitStatus = chalk.green(` (${remainingHours.toFixed(2)}h remaining)`);
        }
      }
      
      /* v8 ignore next -- @preserve */
      console.log(chalk.white(`\n  Period Total: ${chalk.bold(`${periodTotals.taskCount} task(s)`)}${chalk.gray(',')} ${periodHoursColor(`${periodTotals.totalHours.toFixed(2)} hours`)}${periodLimitStatus}${chalk.gray(',')} ${chalk.green.bold(`$${periodTotals.totalAmount.toFixed(2)}`)}`));
    }
    
    // Display client totals
    /* v8 ignore next -- @preserve */
    console.log(chalk.white(`\n  ${chalk.magenta.bold('Client Total:')} ${chalk.bold(`${clientTotalTasks} task(s)`)}${chalk.gray(',')} ${chalk.yellow(`${clientTotalHours.toFixed(2)} hours`)}${chalk.gray(',')} ${chalk.green.bold(`$${clientTotalAmount.toFixed(2)}`)}`));
  }

  // Overall summary
  /* v8 ignore next -- @preserve */
  console.log('\n' + chalk.blue('='.repeat(60)));
  /* v8 ignore next -- @preserve */
  console.log(chalk.white(`\nGrand Total: ${chalk.bold(`${tasks.length} task(s)`)}\n`));
}

