import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { TaskEntry } from './types/index.js';

const DATA_DIR = 'data';
const DATA_FILE = 'tasks.json';

/**
 * Ensure the data directory exists
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
 * Get the full path to the data file
 */
function getDataFilePath(): string {
  return join(DATA_DIR, DATA_FILE);
}

/**
 * Load all tasks from storage
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
 * Save tasks to storage
 */
export async function saveTasks(tasks: TaskEntry[]): Promise<void> {
  await ensureDataDir();
  const filePath = getDataFilePath();
  await fs.writeFile(filePath, JSON.stringify(tasks, null, 2), 'utf-8');
}

/**
 * Add a new task entry
 */
export async function addTask(task: TaskEntry): Promise<void> {
  const tasks = await loadTasks();
  tasks.push(task);
  await saveTasks(tasks);
}

