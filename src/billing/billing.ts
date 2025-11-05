import { getInvoiceDates, getPaymentTerms } from '../config/config.js';

/**
 * Get billing period for a given date based on configured invoice dates
 * Returns an object with billing date and period description
 */
export async function getBillingPeriod(dateStr: string): Promise<{ billingDate: string; periodLabel: string }> {
  const date = new Date(dateStr + 'T00:00:00');
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-indexed
  const day = date.getDate();
  
  const invoiceDates = await getInvoiceDates();
  
  // Sort invoice dates to find the appropriate billing period
  const sortedDates = [...invoiceDates].sort((a, b) => a - b);
  
  // Find which invoice date this day falls into
  const lastInvoiceDate = sortedDates[sortedDates.length - 1]!;
  let billingDay: number;
  let billingMonth = month;
  let billingYear = year;
  
  if (day < lastInvoiceDate) {
    // Find the next invoice date after this day
    billingDay = lastInvoiceDate; // Default fallback
    for (let i = 0; i < sortedDates.length; i++) {
      const invoiceDay = sortedDates[i]!;
      if (day < invoiceDay) {
        billingDay = invoiceDay;
        billingMonth = month;
        billingYear = year;
        break;
      }
    }
  } else {
    // If day is >= last invoice date, bill on first invoice date of next month
    billingDay = sortedDates[0]!;
    billingMonth = month + 1;
    if (billingMonth > 11) {
      billingMonth = 0;
      billingYear = year + 1;
    }
  }
  
  // Calculate period start and end
  const firstInvoiceDate = sortedDates[0]!;
  
  let periodStartDay: number;
  let periodEndDay: number;
  
  if (billingDay === firstInvoiceDate && billingMonth !== month) {
    // This is the period from last invoice date to end of month
    periodStartDay = lastInvoiceDate;
    periodEndDay = new Date(year, month + 1, 0).getDate();
  } else {
    // Find previous invoice date
    const currentIndex = sortedDates.indexOf(billingDay!);
    const previousInvoiceDate = currentIndex === 0 
      ? sortedDates[sortedDates.length - 1]!
      : sortedDates[currentIndex - 1]!;
    
    // Period starts from the day after previous invoice date
    // If previous invoice date is the first of the month, period starts from day 1
    if (previousInvoiceDate === firstInvoiceDate && billingDay !== firstInvoiceDate) {
      periodStartDay = 1;
    } else {
      // Period starts from the day after previous invoice date
      // For example: if previous is 10 and billing is 20, period is 10-19 (includes 10)
      periodStartDay = previousInvoiceDate;
    }
    periodEndDay = billingDay! - 1;
  }
  
  const billingDate = new Date(billingYear, billingMonth, billingDay!);
  const billingMonthName = billingDate.toLocaleString('default', { month: 'long' });
  const currentMonthName = date.toLocaleString('default', { month: 'long' });
  
  // Format period label - periodStartDay is already correct, don't add 1
  const periodLabel = billingDay === firstInvoiceDate && billingMonth !== month
    ? `${currentMonthName} ${periodStartDay}-${periodEndDay} (Billed: ${billingMonthName} ${billingDay})`
    : `${currentMonthName} ${periodStartDay}-${periodEndDay} (Billed: ${billingMonthName} ${billingDay})`;
  
  return {
    billingDate: `${billingYear}-${String(billingMonth + 1).padStart(2, '0')}-${String(billingDay).padStart(2, '0')}`,
    periodLabel,
  };
}

/**
 * Calculate due date based on billing date and configured payment terms
 */
export async function calculateDueDate(billingDateStr: string): Promise<string> {
  const billingDate = new Date(billingDateStr + 'T00:00:00');
  const paymentTerms = await getPaymentTerms();
  
  // Add payment terms days to billing date
  const dueDate = new Date(billingDate);
  dueDate.setDate(dueDate.getDate() + paymentTerms);
  
  /* v8 ignore next -- @preserve */
  return dueDate.toISOString().split('T')[0] ?? '';
}

