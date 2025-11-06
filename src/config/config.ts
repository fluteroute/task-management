import { promises as fs } from 'node:fs';
import type { ClientRate } from '../types/index.js';

/**
 * Configuration file path
 */
const CONFIG_FILE = 'config.json';
const CONFIG_EXAMPLE_FILE = 'config.example.json';

/**
 * Configuration structure
 */
export interface AppConfig {
  clients: ClientRate[];
  activityTypes: string[];
  defaultRate: number;
  invoiceDates: number[]; // Days of month when invoices are generated (e.g., [1, 15])
  paymentTerms: number; // Payment terms in days (e.g., 15 for net 15, 30 for net 30, 90 for net 90)
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AppConfig = {
  clients: [],
  activityTypes: ['Code Review', 'Implementation', 'Meetings/Syncs', 'Planning'],
  defaultRate: 100,
  invoiceDates: [1, 15],
  paymentTerms: 15,
};

let cachedConfig: AppConfig | null = null;

/**
 * Load configuration from file.
 * Returns cached config if available, otherwise loads from config.json.
 * Falls back to config.example.json or defaults if config.json doesn't exist.
 *
 * @returns A promise that resolves to the application configuration
 * @example
 * ```typescript
 * const config = await loadConfig();
 * console.log(config.defaultRate); // 100
 * console.log(config.invoiceDates); // [1, 15]
 * console.log(config.clients); // [{ client: 'Client A', rate: 100 }, ...]
 * ```
 */
export async function loadConfig(): Promise<AppConfig> {
  // Return cached config if available
  if (cachedConfig !== null) {
    return cachedConfig;
  }

  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data) as AppConfig;

    // Validate config structure
    if (!config.clients || !Array.isArray(config.clients)) {
      console.warn('Invalid clients configuration, using defaults');
      config.clients = DEFAULT_CONFIG.clients;
    }

    if (!config.activityTypes || !Array.isArray(config.activityTypes)) {
      console.warn('Invalid activityTypes configuration, using defaults');
      config.activityTypes = DEFAULT_CONFIG.activityTypes;
    }

    if (typeof config.defaultRate !== 'number' || config.defaultRate <= 0) {
      console.warn('Invalid defaultRate configuration, using default');
      config.defaultRate = DEFAULT_CONFIG.defaultRate;
    }

    if (
      !config.invoiceDates ||
      !Array.isArray(config.invoiceDates) ||
      config.invoiceDates.length === 0
    ) {
      console.warn('Invalid invoiceDates configuration, using defaults');
      config.invoiceDates = DEFAULT_CONFIG.invoiceDates;
    }

    if (typeof config.paymentTerms !== 'number' || config.paymentTerms <= 0) {
      console.warn('Invalid paymentTerms configuration, using default');
      config.paymentTerms = DEFAULT_CONFIG.paymentTerms;
    }

    // Cache the config
    cachedConfig = config;
    return config;
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      // Config file doesn't exist, create it from example if available
      try {
        const exampleData = await fs.readFile(CONFIG_EXAMPLE_FILE, 'utf-8');
        const exampleConfig = JSON.parse(exampleData) as AppConfig;
        console.warn(`Config file not found. Creating ${CONFIG_FILE} from example...`);
        await fs.writeFile(CONFIG_FILE, JSON.stringify(exampleConfig, null, 2), 'utf-8');
        cachedConfig = exampleConfig;
        return exampleConfig;
      } catch {
        // Example file also doesn't exist, use defaults
        console.warn(`Config file not found. Using default configuration.`);
        console.warn(`Please create ${CONFIG_FILE} based on ${CONFIG_EXAMPLE_FILE}`);
        cachedConfig = DEFAULT_CONFIG;
        return DEFAULT_CONFIG;
      }
    }
    // Other error, use defaults
    console.warn(`Error reading config file: ${err.message}. Using default configuration.`);
    cachedConfig = DEFAULT_CONFIG;
    return DEFAULT_CONFIG;
  }
}

/**
 * Get clients from configuration.
 *
 * @returns A promise that resolves to an array of client rate configurations
 * @example
 * ```typescript
 * const clients = await getClients();
 * // Returns: [{ client: 'Client A', rate: 100, hourLimit: 40 }, ...]
 * const clientA = clients.find(c => c.client === 'Client A');
 * console.log(clientA?.rate); // 100
 * ```
 */
export async function getClients(): Promise<ClientRate[]> {
  const config = await loadConfig();
  return config.clients;
}

/**
 * Get activity types from configuration.
 *
 * @returns A promise that resolves to an array of activity type strings
 * @example
 * ```typescript
 * const activityTypes = await getActivityTypes();
 * // Returns: ['Code Review', 'Implementation', 'Meetings/Syncs', 'Planning']
 * ```
 */
export async function getActivityTypes(): Promise<string[]> {
  const config = await loadConfig();
  return config.activityTypes;
}

/**
 * Get default rate from configuration.
 *
 * @returns A promise that resolves to the default hourly rate
 * @example
 * ```typescript
 * const defaultRate = await getDefaultRate();
 * // Returns: 100
 * ```
 */
export async function getDefaultRate(): Promise<number> {
  const config = await loadConfig();
  return config.defaultRate;
}

/**
 * Get invoice dates from configuration.
 * These are the days of the month when invoices are generated.
 *
 * @returns A promise that resolves to an array of invoice dates (days of month)
 * @example
 * ```typescript
 * const invoiceDates = await getInvoiceDates();
 * // Returns: [1, 15] (invoices on 1st and 15th of each month)
 * // Could also be: [1] (monthly) or [1, 10, 20] (three times per month)
 * ```
 */
export async function getInvoiceDates(): Promise<number[]> {
  const config = await loadConfig();
  return config.invoiceDates;
}

/**
 * Get payment terms from configuration.
 * The number of days after invoice date when payment is due.
 *
 * @returns A promise that resolves to the payment terms in days
 * @example
 * ```typescript
 * const paymentTerms = await getPaymentTerms();
 * // Returns: 15 (Net 15 - payment due 15 days after invoice date)
 * // Could also be: 30 (Net 30) or 90 (Net 90)
 * ```
 */
export async function getPaymentTerms(): Promise<number> {
  const config = await loadConfig();
  return config.paymentTerms;
}
