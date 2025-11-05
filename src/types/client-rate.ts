/**
 * Client rate configuration
 */
export interface ClientRate {
  client: string;
  rate: number;
  hourLimit?: number; // Optional monthly/hourly limit for the client
}
