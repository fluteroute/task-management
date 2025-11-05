import { promises as fs } from 'node:fs';
import type { ClientRate } from './types/index.js';

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
 * Load configuration from file
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

    if (!config.invoiceDates || !Array.isArray(config.invoiceDates) || config.invoiceDates.length === 0) {
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
 * Get clients from configuration
 */
export async function getClients(): Promise<ClientRate[]> {
  const config = await loadConfig();
  return config.clients;
}

/**
 * Get activity types from configuration
 */
export async function getActivityTypes(): Promise<string[]> {
  const config = await loadConfig();
  return config.activityTypes;
}

/**
 * Get default rate from configuration
 */
export async function getDefaultRate(): Promise<number> {
  const config = await loadConfig();
  return config.defaultRate;
}

/**
 * Get invoice dates from configuration
 */
export async function getInvoiceDates(): Promise<number[]> {
  const config = await loadConfig();
  return config.invoiceDates;
}

/**
 * Get payment terms from configuration
 */
export async function getPaymentTerms(): Promise<number> {
  const config = await loadConfig();
  return config.paymentTerms;
}

