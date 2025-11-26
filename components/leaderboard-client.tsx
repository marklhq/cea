"use client";

import * as React from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { SalespersonTotal } from "@/lib/data";

interface LeaderboardClientProps {
  initialData: SalespersonTotal[];
  availableYears: string[];
  defaultStartDate: string;
  defaultEndDate: string;
  fetchLeaderboard: (startDate: string, endDate: string) => Promise<SalespersonTotal[]>;
}

export function LeaderboardClient({
  initialData,
  availableYears,
  defaultStartDate,
  defaultEndDate,
  fetchLeaderboard,
}: LeaderboardClientProps) {
  const [startYear, startMonth] = defaultStartDate.split("-");
  const [endYear, endMonth] = defaultEndDate.split("-");

  const [selectedStartYear, setSelectedStartYear] = React.useState(startYear);
  const [selectedStartMonth, setSelectedStartMonth] = React.useState(startMonth);
  const [selectedEndYear, setSelectedEndYear] = React.useState(endYear);
  const [selectedEndMonth, setSelectedEndMonth] = React.useState(endMonth);
  const [leaderboard, setLeaderboard] = React.useState(initialData);
  const [isLoading, setIsLoading] = React.useState(false);

  const startDate = `${selectedStartYear}-${selectedStartMonth}`;
  const endDate = `${selectedEndYear}-${selectedEndMonth}`;
  const isDefaultRange = startDate === defaultStartDate && endDate === defaultEndDate;

  // Fetch new data when date range changes
  React.useEffect(() => {
    if (isDefaultRange) {
      setLeaderboard(initialData);
      return;
    }

    setIsLoading(true);
    fetchLeaderboard(startDate, endDate)
      .then(setLeaderboard)
      .finally(() => setIsLoading(false));
  }, [startDate, endDate, isDefaultRange, fetchLeaderboard, initialData]);

  const formatDateRange = () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const startMonthName = months[parseInt(selectedStartMonth) - 1];
    const endMonthName = months[parseInt(selectedEndMonth) - 1];
    return `${startMonthName} ${selectedStartYear} - ${endMonthName} ${selectedEndYear}`;
  };

  // Convert to leaderboard format
  const tableData = leaderboard.map((sp) => ({
    name: sp.name,
    reg_num: sp.reg_num,
    transactions: sp.total_transactions,
  }));

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
          {isLoading ? "Loading..." : `${leaderboard.length.toLocaleString()} salespersons found`}
        </div>
      </div>

      <LeaderboardTable data={tableData} dateRange={formatDateRange()} />
    </div>
  );
}

