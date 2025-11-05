import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import * as storageModule from './storage.js';
import type { TaskEntry } from '../types/index.js';

// Mock fs module
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
    access: vi.fn(),
    mkdir: vi.fn(),
  },
}));

describe('Storage Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loadTasks', () => {
    it('should load tasks from file when it exists', async () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-01',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'Client1',
          rate: 100,
        },
        {
          id: '2',
          date: '2024-01-02',
          time: '14:00:00',
          activityType: 'Code Review',
          ticketNumber: 'TICKET-123',
          hoursWorked: 1.0,
          client: 'Client2',
          rate: 150,
        },
      ];

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(tasks));

      const result = await storageModule.loadTasks();

      expect(result).toEqual(tasks);
      expect(fs.readFile).toHaveBeenCalledWith(join('data', 'tasks.json'), 'utf-8');
    });

    it('should return empty array when file does not exist', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' } as NodeJS.ErrnoException);

      const result = await storageModule.loadTasks();

      expect(result).toEqual([]);
    });

    it('should create data directory if it does not exist', async () => {
      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as NodeJS.ErrnoException);
      vi.mocked(fs.readFile).mockResolvedValue('[]');

      await storageModule.loadTasks();

      expect(fs.mkdir).toHaveBeenCalledWith('data', { recursive: true });
    });

    it('should throw error for non-ENOENT errors', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      await expect(storageModule.loadTasks()).rejects.toThrow('Permission denied');
    });

    it('should handle invalid JSON gracefully by throwing', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');

      await expect(storageModule.loadTasks()).rejects.toThrow();
    });
  });

  describe('saveTasks', () => {
    it('should save tasks to file', async () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-01',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'Client1',
          rate: 100,
        },
      ];

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await storageModule.saveTasks(tasks);

      expect(fs.writeFile).toHaveBeenCalledWith(
        join('data', 'tasks.json'),
        JSON.stringify(tasks, null, 2),
        'utf-8'
      );
    });

    it('should create data directory if it does not exist', async () => {
      const tasks: TaskEntry[] = [];

      vi.mocked(fs.access).mockRejectedValue({ code: 'ENOENT' } as NodeJS.ErrnoException);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await storageModule.saveTasks(tasks);

      expect(fs.mkdir).toHaveBeenCalledWith('data', { recursive: true });
    });

    it('should format JSON with indentation', async () => {
      const tasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-01',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'Client1',
          rate: 100,
        },
      ];

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await storageModule.saveTasks(tasks);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const writtenData = writeCall?.[1] as string;
      const parsed = JSON.parse(writtenData);

      expect(parsed).toEqual(tasks);
      expect(writtenData).toContain('\n'); // Should be formatted with newlines
    });
  });

  describe('addTask', () => {
    it('should add a new task to existing tasks', async () => {
      const existingTasks: TaskEntry[] = [
        {
          id: '1',
          date: '2024-01-01',
          time: '10:00:00',
          activityType: 'Implementation',
          hoursWorked: 2.5,
          client: 'Client1',
          rate: 100,
        },
      ];

      const newTask: TaskEntry = {
        id: '2',
        date: '2024-01-02',
        time: '14:00:00',
        activityType: 'Code Review',
        hoursWorked: 1.0,
        client: 'Client2',
        rate: 150,
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(existingTasks));
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await storageModule.addTask(newTask);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const writtenData = writeCall?.[1] as string;
      const savedTasks = JSON.parse(writtenData);

      expect(savedTasks).toHaveLength(2);
      expect(savedTasks[0]).toEqual(existingTasks[0]);
      expect(savedTasks[1]).toEqual(newTask);
    });

    it('should add task to empty task list', async () => {
      const newTask: TaskEntry = {
        id: '1',
        date: '2024-01-01',
        time: '10:00:00',
        activityType: 'Implementation',
        hoursWorked: 2.5,
        client: 'Client1',
        rate: 100,
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' } as NodeJS.ErrnoException);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await storageModule.addTask(newTask);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const writtenData = writeCall?.[1] as string;
      const savedTasks = JSON.parse(writtenData);

      expect(savedTasks).toHaveLength(1);
      expect(savedTasks[0]).toEqual(newTask);
    });

    it('should preserve task with optional ticketNumber', async () => {
      const newTask: TaskEntry = {
        id: '1',
        date: '2024-01-01',
        time: '10:00:00',
        activityType: 'Implementation',
        ticketNumber: 'TICKET-123',
        hoursWorked: 2.5,
        client: 'Client1',
        rate: 100,
      };

      vi.mocked(fs.access).mockResolvedValue(undefined);
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' } as NodeJS.ErrnoException);
      vi.mocked(fs.writeFile).mockResolvedValue(undefined);

      await storageModule.addTask(newTask);

      const writeCall = vi.mocked(fs.writeFile).mock.calls[0];
      const writtenData = writeCall?.[1] as string;
      const savedTasks = JSON.parse(writtenData);

      expect(savedTasks[0]?.ticketNumber).toBe('TICKET-123');
    });
  });
});

