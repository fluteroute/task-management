#!/usr/bin/env node

import { randomUUID } from 'node:crypto';
import chalk from 'chalk';
import { displayInvoice, getBillingPeriodsForClientPrompt } from './invoice/invoice.js';
import {
  collectTaskInfo,
  displayTaskSummary,
  promptMainMenu,
  promptSelectBillingPeriod,
  promptSelectClient,
  promptSelectClientForInvoice,
} from './prompts/index.js';
import { getRateForClient } from './rates/rates.js';
import { addTask, loadTasks } from './storage/storage.js';
import type { TaskEntry } from './types/index.js';
import {
  displayTasksByClient,
  getBillingPeriodsForClient,
  getClientsFromTasks,
} from './view/view.js';

/**
 * Generate a unique ID for a task entry using UUID v4.
 *
 * @returns A unique identifier string
 * @example
 * ```typescript
 * const id = generateTaskId();
 * // Returns: '550e8400-e29b-41d4-a716-446655440000' (UUID v4 format)
 * ```
 */
function generateTaskId(): string {
  return randomUUID();
}

/**
 * Get current date and time in ISO format.
 *
 * @returns An object containing the current date (YYYY-MM-DD) and time (HH:MM:SS)
 * @example
 * ```typescript
 * const { date, time } = getCurrentDateTime();
 * // Returns: { date: '2024-01-15', time: '14:30:25' }
 * // (based on current system date/time)
 * ```
 */
function getCurrentDateTime(): { date: string; time: string } {
  const now = new Date();
  const date = now.toISOString().split('T')[0] ?? ''; // YYYY-MM-DD
  const time = now.toTimeString().split(' ')[0] ?? ''; // HH:MM:SS
  return { date, time };
}

/**
 * Collect task information from user, calculate rate, display summary, and save to storage.
 * Handles the complete flow of adding a new task entry.
 *
 * @example
 * ```typescript
 * await addNewTask();
 * // 1. Prompts user for task information
 * // 2. Gets current date/time automatically
 * // 3. Looks up rate for the client
 * // 4. Displays task summary
 * // 5. Saves task to storage
 * // Output: "✅ Task entry saved successfully!"
 * ```
 */
async function addNewTask(): Promise<void> {
  // Collect task information from user
  const taskInput = await collectTaskInfo();

  // Get current date and time
  const { date, time } = getCurrentDateTime();

  // Get rate based on client
  const rate = await getRateForClient(taskInput.client);

  // Display summary
  displayTaskSummary(taskInput, rate, date, time);

  // Create task entry
  const taskEntry: TaskEntry = {
    id: generateTaskId(),
    date,
    time,
    activityType: taskInput.activityType,
    ...(taskInput.ticketNumber && { ticketNumber: taskInput.ticketNumber }),
    hoursWorked: taskInput.hoursWorked,
    client: taskInput.client,
    rate,
  };

  // Save to storage
  await addTask(taskEntry);

  /* v8 ignore next -- @preserve */
  console.log(chalk.green.bold('✅ Task entry saved successfully!\n'));
}

async function main(): Promise<void> {
  try {
    while (true) {
      const action = await promptMainMenu();

      if (action === 'add') {
        await addNewTask();
      } else if (action === 'view') {
        const tasks = await loadTasks();
        if (tasks.length === 0) {
          /* v8 ignore next -- @preserve */
          console.log(chalk.yellow('\n⚠️  No tasks recorded yet.\n'));
          continue;
        }
        const availableClients = getClientsFromTasks(tasks);
        const selectedClient = await promptSelectClient(availableClients);

        // If a specific client is selected, prompt for billing period
        let selectedBillingPeriod: string | undefined;
        if (selectedClient !== 'all') {
          const billingPeriods = await getBillingPeriodsForClient(tasks, selectedClient);
          if (billingPeriods.length > 1) {
            // Only prompt if there are multiple billing periods
            const allPeriodsOption = 'All Billing Periods';
            const periodOptions = [allPeriodsOption, ...billingPeriods];

            const selectedPeriod = await promptSelectBillingPeriod(periodOptions);

            if (selectedPeriod !== allPeriodsOption) {
              selectedBillingPeriod = selectedPeriod;
            }
          } else if (billingPeriods.length === 1) {
            // Only one period, use it automatically
            selectedBillingPeriod = billingPeriods[0];
          }
        }

        await displayTasksByClient(selectedClient, selectedBillingPeriod);
      } else if (action === 'invoice') {
        const tasks = await loadTasks();
        if (tasks.length === 0) {
          /* v8 ignore next -- @preserve */
          console.log(chalk.yellow('\n⚠️  No tasks recorded yet.\n'));
          continue;
        }
        const availableClients = getClientsFromTasks(tasks);
        /* v8 ignore next -- @preserve */
        console.log(chalk.blue.bold('\n💰 === Generate Invoice ===\n'));
        const clientSelection = await promptSelectClientForInvoice(availableClients);
        const billingPeriods = await getBillingPeriodsForClientPrompt(tasks, clientSelection);
        if (billingPeriods.length === 0) {
          /* v8 ignore next -- @preserve */
          console.log(
            chalk.yellow(`\n⚠️  No billing periods found for client "${clientSelection}".\n`)
          );
          continue;
        }
        const selectedBillingPeriod = await promptSelectBillingPeriod(billingPeriods);
        await displayInvoice(clientSelection, selectedBillingPeriod);
      } else if (action === 'exit') {
        /* v8 ignore next -- @preserve */
        console.log(chalk.blue('\n👋 Goodbye!\n'));
        break;
      }
    }
  } catch (error) {
    /* v8 ignore next -- @preserve */
    console.error(chalk.red.bold('Error:'), error);
    process.exit(1);
  }
}

// Run the application
main();
