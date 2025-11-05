import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TaskEntry } from './types/index.js';
import { getClientsFromTasks, getBillingPeriodsForClient } from './view.js';
import * as billingModule from './billing.js';

// Mock billing module
vi.mock('./billing.js', () => ({
  getBillingPeriod: vi.fn(),
}));

describe('View Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getClientsFromTasks', () => {
    it('should extract unique client names from tasks', () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-01',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-02',
          time: '14:00:00',
          activityType: 'Code Review',
          hoursWorked: 1.0,
          client: 'ClientB',
          rate: 150,
        },
        {
          id: '3',
          date: '2024-01-03',
          time: '16:00:00',
          activityType: 'Planning',
          hoursWorked: 3.0,
          client: 'ClientA',
          rate: 100,
        },
      ];

      const result = getClientsFromTasks(tasks);

      expect(result).toEqual(['ClientA', 'ClientB']);
    });

    it('should return empty array for empty task list', () => {
      const tasks: TaskEntry[] = [];

      const result = getClientsFromTasks(tasks);

      expect(result).toEqual([]);
    });

    it('should return sorted client names', () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-01',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'ClientZ',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-02',
          time: '14:00:00',
          activityType: 'Code Review',
          hoursWorked: 1.0,
          client: 'ClientA',
          rate: 150,
        },
        {
          id: '3',
          date: '2024-01-03',
          time: '16:00:00',
          activityType: 'Planning',
          hoursWorked: 3.0,
          client: 'ClientM',
          rate: 100,
        },
      ];

      const result = getClientsFromTasks(tasks);

      expect(result).toEqual(['ClientA', 'ClientM', 'ClientZ']);
    });

    it('should handle tasks with duplicate clients', () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-01',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-02',
          time: '14:00:00',
          activityType: 'Code Review',
          hoursWorked: 1.0,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '3',
          date: '2024-01-03',
          time: '16:00:00',
          activityType: 'Planning',
          hoursWorked: 3.0,
          client: 'ClientA',
          rate: 100,
        },
      ];

      const result = getClientsFromTasks(tasks);

      expect(result).toEqual(['ClientA']);
    });

    it('should handle single task', () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-01',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
      ];

      const result = getClientsFromTasks(tasks);

      expect(result).toEqual(['ClientA']);
    });
  });

  describe('getBillingPeriodsForClient', () => {
    it('should return unique billing periods for a client', async () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-05',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-10',
          time: '14:00:00',
          activityType: 'Code Review',
          hoursWorked: 1.0,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '3',
          date: '2024-01-20',
          time: '16:00:00',
          activityType: 'Planning',
          hoursWorked: 3.0,
          client: 'ClientA',
          rate: 100,
        },
      ];

      vi.mocked(billingModule.getBillingPeriod)
        .mockResolvedValueOnce({ billingDate: '2024-01-15', periodLabel: 'Period 1' })
        .mockResolvedValueOnce({ billingDate: '2024-01-15', periodLabel: 'Period 1' })
        .mockResolvedValueOnce({ billingDate: '2024-02-01', periodLabel: 'Period 2' });

      const result = await getBillingPeriodsForClient(tasks, 'ClientA');

      expect(result).toEqual(['2024-01-15', '2024-02-01']);
    });

    it('should return sorted billing periods', async () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-20',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-05',
          time: '14:00:00',
          activityType: 'Code Review',
          hoursWorked: 1.0,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '3',
          date: '2024-01-10',
          time: '16:00:00',
          activityType: 'Planning',
          hoursWorked: 3.0,
          client: 'ClientA',
          rate: 100,
        },
      ];

      vi.mocked(billingModule.getBillingPeriod)
        .mockResolvedValueOnce({ billingDate: '2024-02-01', periodLabel: 'Period 2' })
        .mockResolvedValueOnce({ billingDate: '2024-01-15', periodLabel: 'Period 1' })
        .mockResolvedValueOnce({ billingDate: '2024-01-15', periodLabel: 'Period 1' });

      const result = await getBillingPeriodsForClient(tasks, 'ClientA');

      expect(result).toEqual(['2024-01-15', '2024-02-01']);
    });

    it('should filter tasks by client', async () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-05',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-10',
          time: '14:00:00',
          activityType: 'Code Review',
          hoursWorked: 1.0,
          client: 'ClientB',
          rate: 150,
        },
        {
          id: '3',
          date: '2024-01-20',
          time: '16:00:00',
          activityType: 'Planning',
          hoursWorked: 3.0,
          client: 'ClientA',
          rate: 100,
        },
      ];

      vi.mocked(billingModule.getBillingPeriod)
        .mockResolvedValueOnce({ billingDate: '2024-01-15', periodLabel: 'Period 1' })
        .mockResolvedValueOnce({ billingDate: '2024-02-01', periodLabel: 'Period 2' });

      const result = await getBillingPeriodsForClient(tasks, 'ClientA');

      expect(result).toEqual(['2024-01-15', '2024-02-01']);
      expect(billingModule.getBillingPeriod).toHaveBeenCalledTimes(2);
      expect(billingModule.getBillingPeriod).not.toHaveBeenCalledWith('2024-01-10');
    });

    it('should return empty array when no tasks for client', async () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-05',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'ClientB',
          rate: 150,
        },
      ];

      const result = await getBillingPeriodsForClient(tasks, 'ClientA');

      expect(result).toEqual([]);
      expect(billingModule.getBillingPeriod).not.toHaveBeenCalled();
    });

    it('should handle duplicate billing periods', async () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-05',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-10',
          time: '14:00:00',
          activityType: 'Code Review',
          hoursWorked: 1.0,
          client: 'ClientA',
          rate: 100,
        },
      ];

      vi.mocked(billingModule.getBillingPeriod)
        .mockResolvedValue({ billingDate: '2024-01-15', periodLabel: 'Period 1' });

      const result = await getBillingPeriodsForClient(tasks, 'ClientA');

      expect(result).toEqual(['2024-01-15']);
    });
  });
});

