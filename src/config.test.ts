import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import type { AppConfig } from './config.js';

// Mock fs module
vi.mock('node:fs', () => ({
  promises: {
    readFile: vi.fn(),
    writeFile: vi.fn(),
  },
}));

describe('Config Module', () => {
  let configModule: Awaited<typeof import('./config.js')>;
  let consoleWarnSpy: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Suppress console.warn output during tests (expected warnings)
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // Reset modules to clear cached config
    vi.resetModules();
    configModule = await import('./config.js');
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.restoreAllMocks();
  });

  describe('loadConfig', () => {
    it('should load valid config file', async () => {
      const validConfig: AppConfig = {
        clients: [{ client: 'TestClient', rate: 100 }],
        activityTypes: ['Type1', 'Type2'],
        defaultRate: 150,
        invoiceDates: [1, 15],
        paymentTerms: 30,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validConfig));

      const result = await configModule.loadConfig();

      expect(result).toEqual(validConfig);
      expect(fs.readFile).toHaveBeenCalledWith('config.json', 'utf-8');
    });

    it('should use cached config on subsequent calls', async () => {
      const validConfig: AppConfig = {
        clients: [],
        activityTypes: ['Type1'],
        defaultRate: 100,
        invoiceDates: [1],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(validConfig));

      await configModule.loadConfig();
      await configModule.loadConfig();
      await configModule.loadConfig();

      // Should only read file once due to caching
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('should use defaults when config file is missing and example file exists', async () => {
      const exampleConfig: AppConfig = {
        clients: [{ client: 'Example', rate: 120 }],
        activityTypes: ['ExampleType'],
        defaultRate: 120,
        invoiceDates: [1, 15],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile)
        .mockRejectedValueOnce({ code: 'ENOENT' } as NodeJS.ErrnoException)
        .mockResolvedValueOnce(JSON.stringify(exampleConfig));

      const result = await configModule.loadConfig();

      expect(result).toEqual(exampleConfig);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should use defaults when both config and example files are missing', async () => {
      vi.mocked(fs.readFile).mockRejectedValue({ code: 'ENOENT' } as NodeJS.ErrnoException);

      const result = await configModule.loadConfig();

      expect(result.clients).toEqual([]);
      expect(result.activityTypes).toEqual(['Code Review', 'Implementation', 'Meetings/Syncs', 'Planning']);
      expect(result.defaultRate).toBe(100);
      expect(result.invoiceDates).toEqual([1, 15]);
      expect(result.paymentTerms).toBe(15);
    });

    it('should use defaults for invalid clients array', async () => {
      const invalidConfig = {
        clients: 'not an array',
        activityTypes: ['Type1'],
        defaultRate: 100,
        invoiceDates: [1, 15],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      const result = await configModule.loadConfig();

      expect(result.clients).toEqual([]);
    });

    it('should use defaults for invalid activityTypes array', async () => {
      const invalidConfig = {
        clients: [],
        activityTypes: 'not an array',
        defaultRate: 100,
        invoiceDates: [1, 15],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      const result = await configModule.loadConfig();

      expect(result.activityTypes).toEqual(['Code Review', 'Implementation', 'Meetings/Syncs', 'Planning']);
    });

    it('should use defaults for invalid defaultRate (non-number)', async () => {
      const invalidConfig = {
        clients: [],
        activityTypes: ['Type1'],
        defaultRate: 'not a number',
        invoiceDates: [1, 15],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      const result = await configModule.loadConfig();

      expect(result.defaultRate).toBe(100);
    });

    it('should use defaults for invalid defaultRate (zero or negative)', async () => {
      const invalidConfig = {
        clients: [],
        activityTypes: ['Type1'],
        defaultRate: -5,
        invoiceDates: [1, 15],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      const result = await configModule.loadConfig();

      expect(result.defaultRate).toBe(100);
    });

    it('should use defaults for invalid invoiceDates (not array)', async () => {
      const invalidConfig = {
        clients: [],
        activityTypes: ['Type1'],
        defaultRate: 100,
        invoiceDates: 'not an array',
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      const result = await configModule.loadConfig();

      expect(result.invoiceDates).toEqual([1, 15]);
    });

    it('should use defaults for invalid invoiceDates (empty array)', async () => {
      const invalidConfig = {
        clients: [],
        activityTypes: ['Type1'],
        defaultRate: 100,
        invoiceDates: [],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      const result = await configModule.loadConfig();

      expect(result.invoiceDates).toEqual([1, 15]);
    });

    it('should use defaults for invalid paymentTerms (non-number)', async () => {
      const invalidConfig = {
        clients: [],
        activityTypes: ['Type1'],
        defaultRate: 100,
        invoiceDates: [1, 15],
        paymentTerms: 'not a number',
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      const result = await configModule.loadConfig();

      expect(result.paymentTerms).toBe(15);
    });

    it('should use defaults for invalid paymentTerms (zero or negative)', async () => {
      const invalidConfig = {
        clients: [],
        activityTypes: ['Type1'],
        defaultRate: 100,
        invoiceDates: [1, 15],
        paymentTerms: -10,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(invalidConfig));

      const result = await configModule.loadConfig();

      expect(result.paymentTerms).toBe(15);
    });

    it('should handle JSON parse errors and use defaults', async () => {
      vi.mocked(fs.readFile).mockResolvedValue('invalid json');

      const result = await configModule.loadConfig();

      expect(result.clients).toEqual([]);
      expect(result.defaultRate).toBe(100);
    });

    it('should handle other file system errors and use defaults', async () => {
      vi.mocked(fs.readFile).mockRejectedValue(new Error('Permission denied'));

      const result = await configModule.loadConfig();

      expect(result.clients).toEqual([]);
      expect(result.defaultRate).toBe(100);
    });
  });

  describe('getClients', () => {
    it('should return clients from config', async () => {
      const config: AppConfig = {
        clients: [
          { client: 'Client1', rate: 100 },
          { client: 'Client2', rate: 150, hourLimit: 40 },
        ],
        activityTypes: [],
        defaultRate: 100,
        invoiceDates: [1, 15],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(config));

      const result = await configModule.getClients();

      expect(result).toEqual(config.clients);
    });
  });

  describe('getActivityTypes', () => {
    it('should return activity types from config', async () => {
      const config: AppConfig = {
        clients: [],
        activityTypes: ['Type1', 'Type2', 'Type3'],
        defaultRate: 100,
        invoiceDates: [1, 15],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(config));

      const result = await configModule.getActivityTypes();

      expect(result).toEqual(['Type1', 'Type2', 'Type3']);
    });
  });

  describe('getDefaultRate', () => {
    it('should return default rate from config', async () => {
      const config: AppConfig = {
        clients: [],
        activityTypes: [],
        defaultRate: 150,
        invoiceDates: [1, 15],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(config));

      const result = await configModule.getDefaultRate();

      expect(result).toBe(150);
    });
  });

  describe('getInvoiceDates', () => {
    it('should return invoice dates from config', async () => {
      const config: AppConfig = {
        clients: [],
        activityTypes: [],
        defaultRate: 100,
        invoiceDates: [1, 10, 20],
        paymentTerms: 15,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(config));

      const result = await configModule.getInvoiceDates();

      expect(result).toEqual([1, 10, 20]);
    });
  });

  describe('getPaymentTerms', () => {
    it('should return payment terms from config', async () => {
      const config: AppConfig = {
        clients: [],
        activityTypes: [],
        defaultRate: 100,
        invoiceDates: [1, 15],
        paymentTerms: 30,
      };

      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(config));

      const result = await configModule.getPaymentTerms();

      expect(result).toBe(30);
    });
  });
});

