import chalk from 'chalk';
import { getActivityTypes } from '../config/config.js';
import { getAvailableClients } from '../rates/rates.js';
import type { TaskInput } from '../types/index.js';
import { promptNumber, promptOptionalString, promptSelectOrCustom } from './utils.js';

/**
 * Collect all task information from user
 */
/* v8 ignore next -- @preserve */
export async function collectTaskInfo(): Promise<TaskInput> {
  /* v8 ignore next -- @preserve */
  console.log(chalk.blue.bold('\n📝 === Task Time Log Entry ===\n'));

  // Get available options
  const availableActivityTypes = await getActivityTypes();
  const availableClients = await getAvailableClients();

  // Prompt for activity type with options
  const activityType = await promptSelectOrCustom(
    'Select activity type:',
    availableActivityTypes,
    'Activity Types'
  );

  const ticketNumber = await promptOptionalString('Ticket number (optional, press Enter to skip):');
  const hoursWorked = await promptNumber('Hours worked:');

  // Prompt for client with options
  const client = await promptSelectOrCustom('Select client:', availableClients, 'Clients');

  const result: TaskInput = {
    activityType,
    hoursWorked,
    client,
  };

  if (ticketNumber) {
    result.ticketNumber = ticketNumber;
  }

  return result;
}

/**
 * Display task summary before saving
 */
export function displayTaskSummary(
  input: TaskInput,
  rate: number,
  date: string,
  time: string
): void {
  /* v8 ignore start */
  console.log(chalk.blue.bold('\n📋 === Task Summary ==='));
  console.log(chalk.white(`Date: ${chalk.gray(date)}`));
  console.log(chalk.white(`Time: ${chalk.gray(time)}`));
  console.log(chalk.white(`Activity Type: ${chalk.magenta(input.activityType)}`));
  if (input.ticketNumber) {
    console.log(chalk.white(`Ticket Number: ${chalk.cyan(input.ticketNumber)}`));
  }
  console.log(chalk.white(`Hours Worked: ${chalk.yellow(input.hoursWorked.toString())}`));
  console.log(chalk.white(`Client: ${chalk.magenta(input.client)}`));
  console.log(chalk.white(`Rate: ${chalk.blue(`$${rate.toFixed(2)}/hour`)}`));
  console.log(
    chalk.white(`Total: ${chalk.green.bold(`$${(input.hoursWorked * rate).toFixed(2)}`)}`)
  );
  console.log(chalk.blue('==================\n'));
  /* v8 ignore stop */
}
