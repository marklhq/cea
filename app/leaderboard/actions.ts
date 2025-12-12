"use server";

import { getLeaderboardByDateRange, SalespersonTotal } from "@/lib/data";

export async function fetchLeaderboardByDateRange(
  startDate: string,
  endDate: string,
  propertyTypes: string[] = [],
  transactionTypes: string[] = [],
  represented: string[] = []
): Promise<SalespersonTotal[]> {
  return getLeaderboardByDateRange(
    startDate,
    endDate,
    100, // limit
    propertyTypes,
    transactionTypes,
    represented
  );
}






