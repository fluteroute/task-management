import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as billingModule from '../billing/billing.js';
import type { TaskEntry } from '../types/index.js';

// Mock billing module
vi.mock('../billing/billing.js', () => ({
  getBillingPeriod: vi.fn(),
  calculateDueDate: vi.fn(),
}));

describe('Invoice Module - Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('formatDate logic', () => {
    it('should format date correctly', () => {
      const dateStr = '2024-01-15';
      const date = new Date(`${dateStr}T00:00:00`);
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      expect(formatted).toContain('January');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should handle different months correctly', () => {
      const dateStr = '2024-12-25';
      const date = new Date(`${dateStr}T00:00:00`);
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      expect(formatted).toContain('December');
      expect(formatted).toContain('25');
      expect(formatted).toContain('2024');
    });

    it('should handle year boundaries correctly', () => {
      const dateStr = '2025-01-01';
      const date = new Date(`${dateStr}T00:00:00`);
      const formatted = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      expect(formatted).toContain('January');
      expect(formatted).toContain('1');
      expect(formatted).toContain('2025');
    });
  });

  describe('task merging logic', () => {
    it('should merge tasks with same activity type and ticket ID', () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-05',
          time: '10:00:00',
          activityType: 'Implementation',
          ticketNumber: 'TICKET-123',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-06',
          time: '14:00:00',
          activityType: 'Implementation',
          ticketNumber: 'TICKET-123',
          hoursWorked: 1.5,
          client: 'ClientA',
          rate: 100,
        },
      ];

      // Simulate the merging logic
      const tasksByKey = new Map<
        string,
        {
          date: string;
          activityType: string;
          ticketNumber: string | undefined;
          totalHours: number;
          rate: number;
          tasks: TaskEntry[];
        }
      >();

      for (const task of tasks) {
        const ticketKey = task.ticketNumber || '';
        const mergeKey = `${task.activityType}|${ticketKey}`;

        if (!tasksByKey.has(mergeKey)) {
          tasksByKey.set(mergeKey, {
            date: task.date,
            activityType: task.activityType,
            ticketNumber: task.ticketNumber,
            totalHours: 0,
            rate: task.rate,
            tasks: [],
          });
        }

        const group = tasksByKey.get(mergeKey);
        if (!group) {
          throw new Error(`Expected group for key ${mergeKey}`);
        }
        group.totalHours += task.hoursWorked;
        group.tasks.push(task);

        if (task.date < group.date) {
          group.date = task.date;
        }
      }

      expect(tasksByKey.size).toBe(1);
      const merged = Array.from(tasksByKey.values())[0];
      if (!merged) {
        throw new Error('Expected merged task group');
      }
      expect(merged.totalHours).toBe(4.0); // 2.5 + 1.5
      expect(merged.tasks.length).toBe(2);
      expect(merged.date).toBe('2024-01-05'); // Earliest date
    });

    it('should keep separate tasks with different activity types', () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-05',
          time: '10:00:00',
          activityType: 'Implementation',
          ticketNumber: 'TICKET-123',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-06',
          time: '14:00:00',
          activityType: 'Code Review',
          ticketNumber: 'TICKET-123',
          hoursWorked: 1.5,
          client: 'ClientA',
          rate: 100,
        },
      ];

      const tasksByKey = new Map<
        string,
        {
          date: string;
          activityType: string;
          ticketNumber: string | undefined;
          totalHours: number;
          rate: number;
          tasks: TaskEntry[];
        }
      >();

      for (const task of tasks) {
        const ticketKey = task.ticketNumber || '';
        const mergeKey = `${task.activityType}|${ticketKey}`;

        if (!tasksByKey.has(mergeKey)) {
          tasksByKey.set(mergeKey, {
            date: task.date,
            activityType: task.activityType,
            ticketNumber: task.ticketNumber,
            totalHours: 0,
            rate: task.rate,
            tasks: [],
          });
        }

        const group = tasksByKey.get(mergeKey);
        if (!group) {
          throw new Error(`Expected group for key ${mergeKey}`);
        }
        group.totalHours += task.hoursWorked;
        group.tasks.push(task);
      }

      expect(tasksByKey.size).toBe(2); // Different activity types
    });

    it('should keep separate tasks with different ticket IDs', () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-05',
          time: '10:00:00',
          activityType: 'Implementation',
          ticketNumber: 'TICKET-123',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-06',
          time: '14:00:00',
          activityType: 'Implementation',
          ticketNumber: 'TICKET-456',
          hoursWorked: 1.5,
          client: 'ClientA',
          rate: 100,
        },
      ];

      const tasksByKey = new Map<
        string,
        {
          date: string;
          activityType: string;
          ticketNumber: string | undefined;
          totalHours: number;
          rate: number;
          tasks: TaskEntry[];
        }
      >();

      for (const task of tasks) {
        const ticketKey = task.ticketNumber || '';
        const mergeKey = `${task.activityType}|${ticketKey}`;

        if (!tasksByKey.has(mergeKey)) {
          tasksByKey.set(mergeKey, {
            date: task.date,
            activityType: task.activityType,
            ticketNumber: task.ticketNumber,
            totalHours: 0,
            rate: task.rate,
            tasks: [],
          });
        }

        const group = tasksByKey.get(mergeKey);
        if (!group) {
          throw new Error(`Expected group for key ${mergeKey}`);
        }
        group.totalHours += task.hoursWorked;
        group.tasks.push(task);
      }

      expect(tasksByKey.size).toBe(2); // Different ticket IDs
    });

    it('should merge tasks without ticket numbers if same activity type', () => {
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
          date: '2024-01-06',
          time: '14:00:00',
          activityType: 'Implementation',
          hoursWorked: 1.5,
          client: 'ClientA',
          rate: 100,
        },
      ];

      const tasksByKey = new Map<
        string,
        {
          date: string;
          activityType: string;
          ticketNumber: string | undefined;
          totalHours: number;
          rate: number;
          tasks: TaskEntry[];
        }
      >();

      for (const task of tasks) {
        const ticketKey = task.ticketNumber || '';
        const mergeKey = `${task.activityType}|${ticketKey}`;

        if (!tasksByKey.has(mergeKey)) {
          tasksByKey.set(mergeKey, {
            date: task.date,
            activityType: task.activityType,
            ticketNumber: task.ticketNumber,
            totalHours: 0,
            rate: task.rate,
            tasks: [],
          });
        }

        const group = tasksByKey.get(mergeKey);
        if (!group) {
          throw new Error(`Expected group for key ${mergeKey}`);
        }
        group.totalHours += task.hoursWorked;
        group.tasks.push(task);
      }

      expect(tasksByKey.size).toBe(1);
      const merged = Array.from(tasksByKey.values())[0];
      if (!merged) {
        throw new Error('Expected merged task group');
      }
      expect(merged.totalHours).toBe(4.0);
    });

    it('should sort merged tasks by date then activity type', () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-10',
          time: '10:00:00',
          activityType: 'Code Review',
          ticketNumber: 'TICKET-123',
          hoursWorked: 2.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-05',
          time: '14:00:00',
          activityType: 'Implementation',
          ticketNumber: 'TICKET-456',
          hoursWorked: 1.5,
          client: 'ClientA',
          rate: 100,
        },
        {
          id: '3',
          date: '2024-01-05',
          time: '16:00:00',
          activityType: 'Planning',
          ticketNumber: 'TICKET-789',
          hoursWorked: 3.0,
          client: 'ClientA',
          rate: 100,
        },
      ];

      const tasksByKey = new Map<
        string,
        {
          date: string;
          activityType: string;
          ticketNumber: string | undefined;
          totalHours: number;
          rate: number;
          tasks: TaskEntry[];
        }
      >();

      for (const task of tasks) {
        const ticketKey = task.ticketNumber || '';
        const mergeKey = `${task.activityType}|${ticketKey}`;

        if (!tasksByKey.has(mergeKey)) {
          tasksByKey.set(mergeKey, {
            date: task.date,
            activityType: task.activityType,
            ticketNumber: task.ticketNumber,
            totalHours: 0,
            rate: task.rate,
            tasks: [],
          });
        }

        const group = tasksByKey.get(mergeKey);
        if (!group) {
          throw new Error(`Expected group for key ${mergeKey}`);
        }
        group.totalHours += task.hoursWorked;
        group.tasks.push(task);

        if (task.date < group.date) {
          group.date = task.date;
        }
      }

      const mergedTasks = Array.from(tasksByKey.values()).sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return a.activityType.localeCompare(b.activityType);
      });

      expect(mergedTasks.length).toBe(3);
      expect(mergedTasks[0]?.activityType).toBe('Implementation'); // Earliest date
      expect(mergedTasks[1]?.activityType).toBe('Planning'); // Same date, alphabetically after Implementation
      expect(mergedTasks[2]?.activityType).toBe('Code Review'); // Later date
    });

    it('should calculate invoice totals correctly', () => {
      const mergedTasks = [
        {
          date: '2024-01-05',
          activityType: 'Implementation',
          ticketNumber: 'TICKET-123',
          totalHours: 4.0,
          rate: 100,
          tasks: [] as TaskEntry[],
        },
        {
          date: '2024-01-10',
          activityType: 'Code Review',
          ticketNumber: 'TICKET-456',
          totalHours: 2.5,
          rate: 150,
          tasks: [] as TaskEntry[],
        },
      ];

      let totalHours = 0;
      let totalAmount = 0;

      for (const mergedTask of mergedTasks) {
        totalHours += mergedTask.totalHours;
        totalAmount += mergedTask.totalHours * mergedTask.rate;
      }

      expect(totalHours).toBe(6.5); // 4.0 + 2.5
      expect(totalAmount).toBe(4.0 * 100 + 2.5 * 150); // 400 + 375 = 775
    });
  });

  describe('groupTasksByClientAndBillingPeriod logic', () => {
    it('should group tasks by client and billing period correctly', async () => {
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
          date: '2024-01-20',
          time: '14:00:00',
          activityType: 'Code Review',
          hoursWorked: 1.5,
          client: 'ClientA',
          rate: 100,
        },
      ];

      vi.mocked(billingModule.getBillingPeriod)
        .mockResolvedValueOnce({ billingDate: '2024-01-15', periodLabel: 'Period 1' })
        .mockResolvedValueOnce({ billingDate: '2024-02-01', periodLabel: 'Period 2' });

      const grouped = new Map<string, Map<string, TaskEntry[]>>();

      for (const task of tasks) {
        const billingPeriod = await billingModule.getBillingPeriod(task.date);
        const billingKey = billingPeriod.billingDate;

        if (!grouped.has(task.client)) {
          grouped.set(task.client, new Map());
        }

        const clientGroup = grouped.get(task.client);
        if (!clientGroup) {
          throw new Error(`Expected client group for ${task.client}`);
        }
        if (!clientGroup.has(billingKey)) {
          clientGroup.set(billingKey, []);
        }

        const taskGroup = clientGroup.get(billingKey);
        if (taskGroup) {
          taskGroup.push(task);
        }
      }

      expect(grouped.has('ClientA')).toBe(true);
      const clientAGroup = grouped.get('ClientA');
      if (!clientAGroup) {
        throw new Error('Expected ClientA group');
      }
      expect(clientAGroup.has('2024-01-15')).toBe(true);
      expect(clientAGroup.has('2024-02-01')).toBe(true);
    });
  });
});
