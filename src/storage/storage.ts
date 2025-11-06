import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { TaskEntry } from '../types/index.js';

const DATA_DIR = 'data';
const DATA_FILE = 'tasks.json';

/**
 * Ensure the data directory exists, creating it if necessary.
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
  } catch {
    // Directory doesn't exist, create it
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
}

/**
 * Get the full path to the tasks data file.
 *
 * @returns The file path as a string
 */
function getDataFilePath(): string {
  return join(DATA_DIR, DATA_FILE);
}

/**
 * Load all tasks from the JSON storage file.
 *
 * @returns A promise that resolves to an array of task entries
 * @throws {Error} If there's an error reading the file (other than file not found)
 * @example
 * ```typescript
 * const tasks = await loadTasks();
 * // Returns: [
 * //   {
 * //     id: 'uuid-here',
 * //     date: '2024-01-15',
 * //     time: '14:30:00',
 * //     activityType: 'Implementation',
 * //     ticketNumber: 'ABC-123',
 * //     hoursWorked: 2.5,
 * //     client: 'Client A',
 * //     rate: 100
 * //   },
 * //   ...
 * // ]
 * // Returns empty array [] if file doesn't exist yet
 * ```
 */
export async function loadTasks(): Promise<TaskEntry[]> {
  await ensureDataDir();
  const filePath = getDataFilePath();
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as TaskEntry[];
  } catch (error) {
    // File doesn't exist yet, return empty array
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

/**
 * Save tasks to the JSON storage file.
 *
 * @param tasks - Array of task entries to save
 * @example
 * ```typescript
 * const tasks = [
 *   {
 *     id: 'uuid-here',
 *     date: '2024-01-15',
 *     time: '14:30:00',
 *     activityType: 'Implementation',
 *     hoursWorked: 2.5,
 *     client: 'Client A',
 *     rate: 100
 *   }
 * ];
 * await saveTasks(tasks);
 * // Saves tasks to data/tasks.json
 * ```
 */
export async function saveTasks(tasks: TaskEntry[]): Promise<void> {
  await ensureDataDir();
  const filePath = getDataFilePath();
  await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
}

/**
 * Add a new task entry to storage.
 * Loads existing tasks, appends the new task, and saves the updated list.
 *
 * @param task - The task entry to add
 * @example
 * ```typescript
 * const newTask = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   date: '2024-01-15',
 *   time: '14:30:00',
 *   activityType: 'Implementation',
 *   ticketNumber: 'ABC-123',
 *   hoursWorked: 2.5,
 *   client: 'Client A',
 *   rate: 100
 * };
 * await addTask(newTask);
 * // Task is added to data/tasks.json
 * ```
 */
export async function addTask(task: TaskEntry): Promise<void> {
  const tasks = await loadTasks();
  tasks.push(task);
  await saveTasks(tasks);
}
