"use client";

import * as React from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { SalespersonMonthly, getLeaderboardForRange } from "@/lib/data-utils";

interface LeaderboardClientProps {
  salespersons: SalespersonMonthly[];
  availableYears: string[];
  defaultStartDate: string;
  defaultEndDate: string;
}

export function LeaderboardClient({
  salespersons,
  availableYears,
  defaultStartDate,
  defaultEndDate,
}: LeaderboardClientProps) {
  const [startYear, startMonth] = defaultStartDate.split("-");
  const [endYear, endMonth] = defaultEndDate.split("-");

  const [selectedStartYear, setSelectedStartYear] = React.useState(startYear);
  const [selectedStartMonth, setSelectedStartMonth] = React.useState(startMonth);
  const [selectedEndYear, setSelectedEndYear] = React.useState(endYear);
  const [selectedEndMonth, setSelectedEndMonth] = React.useState(endMonth);

  const startDate = `${selectedStartYear}-${selectedStartMonth}`;
  const endDate = `${selectedEndYear}-${selectedEndMonth}`;

  const leaderboard = React.useMemo(
    () => getLeaderboardForRange(salespersons, startDate, endDate, 1000),
    [salespersons, startDate, endDate]
  );

  const formatDateRange = () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const startMonthName = months[parseInt(selectedStartMonth) - 1];
    const endMonthName = months[parseInt(selectedEndMonth) - 1];
    return `${startMonthName} ${selectedStartYear} - ${endMonthName} ${selectedEndYear}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <DateRangePicker
          startYear={selectedStartYear}
          endYear={selectedEndYear}
          startMonth={selectedStartMonth}
          endMonth={selectedEndMonth}
          availableYears={availableYears}
          onStartYearChange={setSelectedStartYear}
          onEndYearChange={setSelectedEndYear}
          onStartMonthChange={setSelectedStartMonth}
          onEndMonthChange={setSelectedEndMonth}
        />
        <div className="text-sm text-muted-foreground">
          {leaderboard.length.toLocaleString()} salespersons found
        </div>
      </div>

      <LeaderboardTable data={leaderboard} dateRange={formatDateRange()} />
    </div>
  );
}

