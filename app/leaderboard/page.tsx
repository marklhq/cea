export const dynamic = 'force-dynamic';

import { LeaderboardClient } from "@/components/leaderboard-client";
import { getSalespersonTotals, getAvailableYears } from "@/lib/data";
import { fetchLeaderboardByDateRange } from "./actions";

export default async function LeaderboardPage() {
  // Fetch pre-aggregated totals (fast - single query)
  const [totals, years] = await Promise.all([
    getSalespersonTotals(100),
    getAvailableYears(),
  ]);

  // Default date range is all available years
  const minDate = `${years[0]}-01`;
  const maxDate = `${years[years.length - 1]}-12`;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Leaderboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Top performing salespersons by transaction count
        </p>
      </div>

      <LeaderboardClient
        initialData={totals}
        availableYears={years}
        defaultStartDate={minDate}
        defaultEndDate={maxDate}
        fetchLeaderboard={fetchLeaderboardByDateRange}
      />
    </div>
  );
}

