import { getClients, getDefaultRate } from './config.js';

/**
 * Get rate for a client
 * Returns the rate if found, otherwise returns a default rate
 */
export async function getRateForClient(client: string, defaultRate?: number): Promise<number> {
  // Trim whitespace from client name for comparison
  const trimmedClient = client.trim();
  const clients = await getClients();
  const clientRate = clients.find(
    (cr) => cr.client.toLowerCase() === trimmedClient.toLowerCase()
  );
  
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
 * Get all available clients
 */
export async function getAvailableClients(): Promise<string[]> {
  const clients = await getClients();
  return clients.map((cr) => cr.client);
}

/**
 * Get hour limit for a client
 * Returns the limit if found, otherwise returns undefined
 */
export async function getHourLimitForClient(client: string): Promise<number | undefined> {
  // Trim whitespace from client name for comparison
  const trimmedClient = client.trim();
  const clients = await getClients();
  const clientRate = clients.find(
    (cr) => cr.client.toLowerCase() === trimmedClient.toLowerCase()
  );
  
  return clientRate?.hourLimit;
}

