import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getBillingPeriod, calculateDueDate } from './billing.js';
import * as configModule from './config.js';

describe('Billing Period Calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBillingPeriod', () => {
    it('should calculate billing period for day 1-14 with default invoice dates [1, 15]', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      const result = await getBillingPeriod('2024-01-05');
      
      expect(result.billingDate).toBe('2024-01-15');
      expect(result.periodLabel).toContain('January 1-14');
      expect(result.periodLabel).toContain('Billed: January 15');
    });

    it('should calculate billing period for day 15-31 with default invoice dates [1, 15]', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      const result = await getBillingPeriod('2024-01-20');
      
      expect(result.billingDate).toBe('2024-02-01');
      expect(result.periodLabel).toContain('January 15-31');
      expect(result.periodLabel).toContain('Billed: February 1');
    });

    it('should handle day on invoice date (15th)', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      const result = await getBillingPeriod('2024-01-15');
      
      expect(result.billingDate).toBe('2024-02-01');
      expect(result.periodLabel).toContain('January 15-31');
    });

    it('should handle day on first invoice date (1st)', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      const result = await getBillingPeriod('2024-01-01');
      
      expect(result.billingDate).toBe('2024-01-15');
      expect(result.periodLabel).toContain('January 1-14');
    });

    it('should handle month end (31st) with default invoice dates', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      const result = await getBillingPeriod('2024-01-31');
      
      expect(result.billingDate).toBe('2024-02-01');
      expect(result.periodLabel).toContain('January 15-31');
    });

    it('should handle year boundary (December to January)', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      const result = await getBillingPeriod('2024-12-20');
      
      expect(result.billingDate).toBe('2025-01-01');
      expect(result.periodLabel).toContain('December 15-31');
      expect(result.periodLabel).toContain('Billed: January 1');
    });

    it('should work with single invoice date [1] (monthly billing)', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1]);

      const result = await getBillingPeriod('2024-01-15');
      
      expect(result.billingDate).toBe('2024-02-01');
      expect(result.periodLabel).toContain('January 1-31');
      expect(result.periodLabel).toContain('Billed: February 1');
    });

    it('should work with three invoice dates [1, 10, 20]', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 10, 20]);

      // Day 5 should bill on 10th
      const result1 = await getBillingPeriod('2024-01-05');
      expect(result1.billingDate).toBe('2024-01-10');
      expect(result1.periodLabel).toContain('January 1-9');

      // Day 15 should bill on 20th
      const result2 = await getBillingPeriod('2024-01-15');
      expect(result2.billingDate).toBe('2024-01-20');
      expect(result2.periodLabel).toContain('January 10-19');

      // Day 25 should bill on 1st of next month
      const result3 = await getBillingPeriod('2024-01-25');
      expect(result3.billingDate).toBe('2024-02-01');
      expect(result3.periodLabel).toContain('January 20-31');
    });

    it('should handle unsorted invoice dates', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([15, 1]);

      const result = await getBillingPeriod('2024-01-05');
      
      expect(result.billingDate).toBe('2024-01-15');
      expect(result.periodLabel).toContain('January 1-14');
    });

    it('should handle February with 28 days', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      const result = await getBillingPeriod('2024-02-20');
      
      expect(result.billingDate).toBe('2024-03-01');
      expect(result.periodLabel).toContain('February 15-29'); // 2024 is a leap year
    });

    it('should handle February with 29 days (leap year)', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      const result = await getBillingPeriod('2024-02-29');

      expect(result.billingDate).toBe('2024-03-01');
      expect(result.periodLabel).toContain('February 15-29');
    });

    it('should handle case where previousInvoiceDate is not firstInvoiceDate', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 10, 20]);

      // Day 15 should have previousInvoiceDate = 10 (not firstInvoiceDate = 1)
      const result = await getBillingPeriod('2024-01-15');

      expect(result.billingDate).toBe('2024-01-20');
      expect(result.periodLabel).toContain('January 10-19');
    });

    it('should handle case where billingDay equals firstInvoiceDate in same month', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      // Day 1 should bill on 15th (same month, firstInvoiceDate case)
      const result = await getBillingPeriod('2024-01-01');

      expect(result.billingDate).toBe('2024-01-15');
    });

    it('should handle case where currentIndex is 0 (first invoice date)', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 15]);

      // Day 5 should bill on 15th, where currentIndex for 15 is 1, so previousInvoiceDate is 1
      // This tests the branch where currentIndex === 0 (but we're billing on 15, so index is 1)
      // To test currentIndex === 0, we need a case where billingDay is the first invoice date
      // Let's test day 20 which bills on 1st of next month (index 0)
      const result = await getBillingPeriod('2024-01-20');

      expect(result.billingDate).toBe('2024-02-01');
      // When billing on 1st (index 0), previousInvoiceDate should be the last one (15)
      expect(result.periodLabel).toContain('January 15-31');
    });

    it('should handle the else branch in periodStartDay calculation', async () => {
      vi.spyOn(configModule, 'getInvoiceDates').mockResolvedValue([1, 10, 20]);

      // Day 15: previousInvoiceDate = 10, billingDay = 20
      // This tests the else branch: periodStartDay = previousInvoiceDate (not firstInvoiceDate)
      const result = await getBillingPeriod('2024-01-15');

      expect(result.billingDate).toBe('2024-01-20');
      expect(result.periodLabel).toContain('January 10-19');
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate due date with Net 15 (15 days)', async () => {
      vi.spyOn(configModule, 'getPaymentTerms').mockResolvedValue(15);

      const result = await calculateDueDate('2024-01-01');
      
      expect(result).toBe('2024-01-16');
    });

    it('should calculate due date with Net 30 (30 days)', async () => {
      vi.spyOn(configModule, 'getPaymentTerms').mockResolvedValue(30);

      const result = await calculateDueDate('2024-01-01');
      
      expect(result).toBe('2024-01-31');
    });

    it('should calculate due date with Net 90 (90 days)', async () => {
      vi.spyOn(configModule, 'getPaymentTerms').mockResolvedValue(90);

      const result = await calculateDueDate('2024-01-01');
      
      expect(result).toBe('2024-03-31');
    });

    it('should handle month boundary crossing', async () => {
      vi.spyOn(configModule, 'getPaymentTerms').mockResolvedValue(15);

      const result = await calculateDueDate('2024-01-20');
      
      expect(result).toBe('2024-02-04');
    });

    it('should handle year boundary crossing', async () => {
      vi.spyOn(configModule, 'getPaymentTerms').mockResolvedValue(15);

      const result = await calculateDueDate('2024-12-20');
      
      expect(result).toBe('2025-01-04');
    });

    it('should handle custom payment terms (45 days)', async () => {
      vi.spyOn(configModule, 'getPaymentTerms').mockResolvedValue(45);

      const result = await calculateDueDate('2024-01-15');
      
      expect(result).toBe('2024-02-29'); // 2024 is a leap year
    });

    it('should handle February with different payment terms', async () => {
      vi.spyOn(configModule, 'getPaymentTerms').mockResolvedValue(30);

      const result = await calculateDueDate('2024-02-01');
      
      expect(result).toBe('2024-03-02'); // Leap year, Feb has 29 days
    });

    it('should handle invoice date on 15th with Net 15', async () => {
      vi.spyOn(configModule, 'getPaymentTerms').mockResolvedValue(15);

      const result = await calculateDueDate('2024-01-15');
      
      expect(result).toBe('2024-01-30');
    });
  });
});

