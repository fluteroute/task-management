import { getInvoiceDates, getPaymentTerms } from '../config/config.js';

/**
 * Get billing period for a given date based on configured invoice dates.
 * Determines which billing period a date falls into and calculates the billing date and period label.
 *
 * @param dateStr - The date string in YYYY-MM-DD format
 * @returns A promise that resolves to an object containing:
 *   - billingDate: The billing date in YYYY-MM-DD format
 *   - periodLabel: A human-readable description of the billing period
 * @throws {Error} If no invoice dates are configured or configuration is invalid
 * @example
 * ```typescript
 * // With invoice dates [1, 15]:
 * // Date on January 5th falls into period 1-14, billed on January 15th
 * const period1 = await getBillingPeriod('2024-01-05');
 * // Returns: { billingDate: '2024-01-15', periodLabel: 'January 1-14 (Billed: January 15)' }
 *
 * // Date on January 20th falls into period 15-31, billed on February 1st
 * const period2 = await getBillingPeriod('2024-01-20');
 * // Returns: { billingDate: '2024-02-01', periodLabel: 'January 15-31 (Billed: February 1)' }
 * ```
 */
export async function getBillingPeriod(
  dateStr: string
): Promise<{ billingDate: string; periodLabel: string }> {
  const date = new Date(`${dateStr}T00:00:00`);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();

  const invoiceDates = await getInvoiceDates();

  // Sort invoice dates to find the appropriate billing period
  const sortedDates = [...invoiceDates].sort((a, b) => a - b);

  // Ensure we have at least one invoice date (should never happen due to defaults)
  if (sortedDates.length === 0) {
    throw new Error('No invoice dates configured');
  }

  // Find which invoice date this day falls into
  const lastInvoiceDate = sortedDates[sortedDates.length - 1];
  if (lastInvoiceDate === undefined) {
    throw new Error('Invalid invoice dates configuration');
  }
  let billingDay: number;
  let billingMonth = month;
  let billingYear = year;

  if (day < lastInvoiceDate) {
    // Find the next invoice date after this day
    billingDay = lastInvoiceDate; // Default fallback
    for (let i = 0; i < sortedDates.length; i++) {
      const invoiceDay = sortedDates[i];
      if (invoiceDay !== undefined && day < invoiceDay) {
        billingDay = invoiceDay;
        billingMonth = month;
        billingYear = year;
        break;
      }
    }
  } else {
    // If day is >= last invoice date, bill on first invoice date of next month
    const firstDate = sortedDates[0];
    if (firstDate === undefined) {
      throw new Error('Invalid invoice dates configuration');
    }
    billingDay = firstDate;
    billingMonth = month + 1;
    if (billingMonth > 11) {
      billingMonth = 0;
      billingYear = year + 1;
    }
  }

  // Calculate period start and end
  const firstInvoiceDate = sortedDates[0];
  if (firstInvoiceDate === undefined) {
    throw new Error('Invalid invoice dates configuration');
  }

  let periodStartDay: number;
  let periodEndDay: number;

  if (billingDay === firstInvoiceDate && billingMonth !== month) {
    // This is the period from last invoice date to end of month
    periodStartDay = lastInvoiceDate;
    periodEndDay = new Date(year, month + 1, 0).getDate();
  } else {
    // Find previous invoice date
    const currentIndex = sortedDates.indexOf(billingDay);
    const lastDate = sortedDates[sortedDates.length - 1];
    const prevDate = sortedDates[currentIndex - 1];

    if (lastDate === undefined) {
      throw new Error('Invalid invoice dates configuration');
    }

    const previousInvoiceDate = currentIndex === 0 ? lastDate : (prevDate ?? lastDate);

    // Period starts from the day after previous invoice date
    // If previous invoice date is the first of the month, period starts from day 1
    if (previousInvoiceDate === firstInvoiceDate && billingDay !== firstInvoiceDate) {
      periodStartDay = 1;
    } else {
      // Period starts from the day after previous invoice date
      // For example: if previous is 10 and billing is 20, period is 10-19 (includes 10)
      periodStartDay = previousInvoiceDate;
    }
    periodEndDay = billingDay - 1;
  }

  const billingDate = new Date(billingYear, billingMonth, billingDay);
  const billingMonthName = billingDate.toLocaleString('default', { month: 'long' });
  const currentMonthName = date.toLocaleString('default', { month: 'long' });

  // Format period label - periodStartDay is already correct, don't add 1
  const periodLabel =
    billingDay === firstInvoiceDate && billingMonth !== month
      ? `${currentMonthName} ${periodStartDay}-${periodEndDay} (Billed: ${billingMonthName} ${billingDay})`
      : `${currentMonthName} ${periodStartDay}-${periodEndDay} (Billed: ${billingMonthName} ${billingDay})`;

  return {
    billingDate: `${billingYear}-${String(billingMonth + 1).padStart(2, '0')}-${String(billingDay).padStart(2, '0')}`,
    periodLabel,
  };
}

/**
 * Calculate due date based on billing date and configured payment terms.
 * Adds the payment terms (in days) to the billing date to determine when payment is due.
 *
 * @param billingDateStr - The billing date string in YYYY-MM-DD format
 * @returns A promise that resolves to the due date in YYYY-MM-DD format
 * @example
 * ```typescript
 * // With payment terms of 15 days (Net 15):
 * const dueDate = await calculateDueDate('2024-01-15');
 * // Returns: '2024-01-30' (15 days after January 15th)
 *
 * // With payment terms of 30 days (Net 30):
 * const dueDate2 = await calculateDueDate('2024-02-01');
 * // Returns: '2024-03-02' (30 days after February 1st)
 * ```
 */
export async function calculateDueDate(billingDateStr: string): Promise<string> {
  const billingDate = new Date(`${billingDateStr}T00:00:00`);
  const paymentTerms = await getPaymentTerms();

  // Add payment terms days to billing date
  const dueDate = new Date(billingDate);
  dueDate.setDate(dueDate.getDate() + paymentTerms);

  /* v8 ignore next -- @preserve */
  return dueDate.toISOString().split('T')[0] ?? '';
}
