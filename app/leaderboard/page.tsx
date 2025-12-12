export const dynamic = 'force-dynamic';

import { LeaderboardClient } from "@/components/leaderboard-client";
import { getSalespersonTotals, getAvailableYears } from "@/lib/data";
import { fetchLeaderboardByDateRange } from "./actions";
import { FilterOption } from "@/components/ui/multi-select-filter";

// Define filter options
const propertyTypeOptions: FilterOption[] = [
  { value: "HDB", label: "HDB" },
  { value: "CONDOMINIUM_APARTMENTS", label: "Condominium/Apartments" },
  { value: "EXECUTIVE_CONDOMINIUM", label: "Executive Condominium" },
  { value: "LANDED", label: "Landed" },
  { value: "STRATA_LANDED", label: "Strata Landed" },
];

const transactionTypeOptions: FilterOption[] = [
  { value: "RESALE", label: "Resale" },
  { value: "NEW SALE", label: "New Sale" },
  { value: "WHOLE RENTAL", label: "Whole Rental" },
  { value: "ROOM RENTAL", label: "Room Rental" },
  { value: "SUB-SALE", label: "Sub-Sale" },
];

const representedOptions: FilterOption[] = [
  { value: "BUYER", label: "Buyer" },
  { value: "SELLER", label: "Seller" },
  { value: "LANDLORD", label: "Landlord" },
  { value: "TENANT", label: "Tenant" },
];

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
        propertyTypeOptions={propertyTypeOptions}
        transactionTypeOptions={transactionTypeOptions}
        representedOptions={representedOptions}
        fetchLeaderboard={fetchLeaderboardByDateRange}
      />
    </div>
  );
}

