import { LeaderboardClient } from "@/components/leaderboard-client";
import {
  getSalespersonMonthly,
  getAvailableDateRange,
} from "@/lib/data";

export default async function LeaderboardPage() {
  const salespersons = await getSalespersonMonthly();
  const { minDate, maxDate } = getAvailableDateRange(salespersons);

  // Get unique years from data
  const years = new Set<string>();
  for (const sp of salespersons) {
    for (const monthYear of Object.keys(sp.monthly)) {
      years.add(monthYear.split("-")[0]);
    }
  }
  const availableYears = Array.from(years).sort();

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
        salespersons={salespersons}
        availableYears={availableYears}
        defaultStartDate={minDate}
        defaultEndDate={maxDate}
      />
    </div>
  );
}

