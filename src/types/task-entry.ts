/**
 * Task entry representing a logged work session
 */
export interface TaskEntry {
  id: string;
  date: string; // ISO date string
  time: string; // ISO time string
  activityType: string;
  ticketNumber?: string;
  hoursWorked: number;
  client: string;
  rate: number;
}

