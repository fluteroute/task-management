/**
 * Task input collected from user prompts
 */
export interface TaskInput {
  activityType: string;
  ticketNumber?: string;
  hoursWorked: number;
  client: string;
}
