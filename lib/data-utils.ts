// Client-safe utility functions (no fs imports)

export interface SalespersonMonthly {
  name: string;
  reg_num: string;
  monthly: { [monthYear: string]: number };
  total: number;
}

// Calculate transactions for a date range
export function calculateTransactionsInRange(
  salesperson: SalespersonMonthly,
  startDate: string, // "YYYY-MM"
  endDate: string // "YYYY-MM"
): number {
  let total = 0;
  for (const [monthYear, count] of Object.entries(salesperson.monthly)) {
    if (monthYear >= startDate && monthYear <= endDate) {
      total += count;
    }
  }
  return total;
}

// Get leaderboard for a date range
export function getLeaderboardForRange(
  salespersons: SalespersonMonthly[],
  startDate: string,
  endDate: string,
  limit: number = 100
): { name: string; reg_num: string; transactions: number }[] {
  const results = salespersons.map((sp) => ({
    name: sp.name,
    reg_num: sp.reg_num,
    transactions: calculateTransactionsInRange(sp, startDate, endDate),
  }));

  return results
    .filter((r) => r.transactions > 0)
    .sort((a, b) => b.transactions - a.transactions)
    .slice(0, limit);
}

