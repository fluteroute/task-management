import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRateForClient, getHourLimitForClient, getAvailableClients } from './rates.js';
import * as configModule from './config.js';
import type { ClientRate } from './types/index.js';

describe('Rate Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getRateForClient', () => {
    const mockClients: ClientRate[] = [
      { client: 'Client A', rate: 100, hourLimit: 40 },
      { client: 'Client B', rate: 150, hourLimit: 50 },
      { client: 'Client C', rate: 200 },
    ];

    beforeEach(() => {
      vi.spyOn(configModule, 'getClients').mockResolvedValue(mockClients);
      vi.spyOn(configModule, 'getDefaultRate').mockResolvedValue(100);
    });

    it('should return correct rate for exact client name match', async () => {
      const rate = await getRateForClient('Client A');
      expect(rate).toBe(100);
    });

    it('should return correct rate for client with different case', async () => {
      const rate = await getRateForClient('CLIENT A');
      expect(rate).toBe(100);
    });

    it('should return correct rate for client with mixed case', async () => {
      const rate = await getRateForClient('cLiEnT b');
      expect(rate).toBe(150);
    });

    it('should trim whitespace from client name', async () => {
      const rate = await getRateForClient('  Client A  ');
      expect(rate).toBe(100);
    });

    it('should return default rate for unknown client', async () => {
      const rate = await getRateForClient('Unknown Client');
      expect(rate).toBe(100);
    });

    it('should use provided default rate instead of config default', async () => {
      const rate = await getRateForClient('Unknown Client', 75);
      expect(rate).toBe(75);
    });

    it('should return correct rate for client without hour limit', async () => {
      const rate = await getRateForClient('Client C');
      expect(rate).toBe(200);
    });

    it('should handle empty client name', async () => {
      const rate = await getRateForClient('');
      expect(rate).toBe(100); // Should return default
    });
  });

  describe('getHourLimitForClient', () => {
    const mockClients: ClientRate[] = [
      { client: 'Client A', rate: 100, hourLimit: 40 },
      { client: 'Client B', rate: 150, hourLimit: 50 },
      { client: 'Client C', rate: 200 }, // No hour limit
    ];

    beforeEach(() => {
      vi.spyOn(configModule, 'getClients').mockResolvedValue(mockClients);
    });

    it('should return hour limit for client with limit', async () => {
      const limit = await getHourLimitForClient('Client A');
      expect(limit).toBe(40);
    });

    it('should return hour limit for client with different case', async () => {
      const limit = await getHourLimitForClient('CLIENT B');
      expect(limit).toBe(50);
    });

    it('should return undefined for client without hour limit', async () => {
      const limit = await getHourLimitForClient('Client C');
      expect(limit).toBeUndefined();
    });

    it('should return undefined for unknown client', async () => {
      const limit = await getHourLimitForClient('Unknown Client');
      expect(limit).toBeUndefined();
    });

    it('should trim whitespace from client name', async () => {
      const limit = await getHourLimitForClient('  Client A  ');
      expect(limit).toBe(40);
    });
  });

  describe('getAvailableClients', () => {
    it('should return list of client names', async () => {
      const mockClients: ClientRate[] = [
        { client: 'Client A', rate: 100 },
        { client: 'Client B', rate: 150 },
        { client: 'Client C', rate: 200 },
      ];

      vi.spyOn(configModule, 'getClients').mockResolvedValue(mockClients);

      const clients = await getAvailableClients();
      expect(clients).toEqual(['Client A', 'Client B', 'Client C']);
    });

    it('should return empty array when no clients configured', async () => {
      vi.spyOn(configModule, 'getClients').mockResolvedValue([]);

      const clients = await getAvailableClients();
      expect(clients).toEqual([]);
    });
  });
});

