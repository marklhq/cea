"use server";

import { getLeaderboardByDateRange, SalespersonTotal } from "@/lib/data";

export async function fetchLeaderboardByDateRange(
  startDate: string,
  endDate: string,
  limit: number = 100
): Promise<SalespersonTotal[]> {
  return getLeaderboardByDateRange(startDate, endDate, limit);
}

