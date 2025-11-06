import { getClients, getDefaultRate } from '../config/config.js';

/**
 * Get hourly rate for a specific client.
 * Searches for the client in the configuration and returns their configured rate,
 * or falls back to the default rate if not found.
 *
 * @param client - The client name to look up
 * @param defaultRate - Optional override for the default rate (if not provided, uses config default)
 * @returns A promise that resolves to the hourly rate for the client
 * @example
 * ```typescript
 * // Client exists in config with rate 150
 * const rate1 = await getRateForClient('Client A');
 * // Returns: 150
 *
 * // Client doesn't exist, uses default rate (100)
 * const rate2 = await getRateForClient('Unknown Client');
 * // Returns: 100
 *
 * // Client doesn't exist, uses provided override
 * const rate3 = await getRateForClient('Unknown Client', 75);
 * // Returns: 75
 * ```
 */
export async function getRateForClient(client: string, defaultRate?: number): Promise<number> {
  // Trim whitespace from client name for comparison
  const trimmedClient = client.trim();
  const clients = await getClients();
  const clientRate = clients.find((cr) => cr.client.toLowerCase() === trimmedClient.toLowerCase());

  if (clientRate) {
    return clientRate.rate;
  }

  // If not found, return default rate (from config or provided)
  if (defaultRate !== undefined) {
    return defaultRate;
  }
  return await getDefaultRate();
}

/**
 * Get all available clients from the configuration.
 *
 * @returns A promise that resolves to an array of client names
 * @example
 * ```typescript
 * const clients = await getAvailableClients();
 * // Returns: ['Client A', 'Client B', 'Client C']
 * // Empty array [] if no clients configured
 * ```
 */
export async function getAvailableClients(): Promise<string[]> {
  const clients = await getClients();
  return clients.map((cr) => cr.client);
}

/**
 * Get the hour limit for a specific client per billing period.
 *
 * @param client - The client name to look up
 * @returns A promise that resolves to the hour limit if configured, or undefined if not set
 * @example
 * ```typescript
 * // Client has hour limit configured
 * const limit1 = await getHourLimitForClient('Client A');
 * // Returns: 40
 *
 * // Client has no hour limit configured
 * const limit2 = await getHourLimitForClient('Client B');
 * // Returns: undefined
 * ```
 */
export async function getHourLimitForClient(client: string): Promise<number | undefined> {
  // Trim whitespace from client name for comparison
  const trimmedClient = client.trim();
  const clients = await getClients();
  const clientRate = clients.find((cr) => cr.client.toLowerCase() === trimmedClient.toLowerCase());

  return clientRate?.hourLimit;
}
