"use client";

import * as React from "react";
import { DateRangePicker } from "@/components/date-range-picker";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { MultiSelectFilter, FilterOption } from "@/components/ui/multi-select-filter";
import { Button } from "@/components/ui/button";
import { SalespersonTotal } from "@/lib/data";

interface LeaderboardClientProps {
  initialData: SalespersonTotal[];
  availableYears: string[];
  defaultStartDate: string;
  defaultEndDate: string;
  propertyTypeOptions: FilterOption[];
  transactionTypeOptions: FilterOption[];
  representedOptions: FilterOption[];
  fetchLeaderboard: (
    startDate: string,
    endDate: string,
    propertyTypes?: string[],
    transactionTypes?: string[],
    represented?: string[]
  ) => Promise<SalespersonTotal[]>;
}

export function LeaderboardClient({
  initialData,
  availableYears,
  defaultStartDate,
  defaultEndDate,
  propertyTypeOptions,
  transactionTypeOptions,
  representedOptions,
  fetchLeaderboard,
}: LeaderboardClientProps) {
  const [startYear, startMonth] = defaultStartDate.split("-");
  const [endYear, endMonth] = defaultEndDate.split("-");

  const [selectedStartYear, setSelectedStartYear] = React.useState(startYear);
  const [selectedStartMonth, setSelectedStartMonth] = React.useState(startMonth);
  const [selectedEndYear, setSelectedEndYear] = React.useState(endYear);
  const [selectedEndMonth, setSelectedEndMonth] = React.useState(endMonth);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = React.useState<string[]>([]);
  const [selectedTransactionTypes, setSelectedTransactionTypes] = React.useState<string[]>([]);
  const [selectedRepresented, setSelectedRepresented] = React.useState<string[]>([]);
  const [leaderboard, setLeaderboard] = React.useState(initialData);
  const [isLoading, setIsLoading] = React.useState(false);

  const startDate = `${selectedStartYear}-${selectedStartMonth}`;
  const endDate = `${selectedEndYear}-${selectedEndMonth}`;
  const isDefaultRange = startDate === defaultStartDate && endDate === defaultEndDate;
  const hasFilters = selectedPropertyTypes.length > 0 || selectedTransactionTypes.length > 0 || selectedRepresented.length > 0;

  // Fetch new data when date range or filters change
  React.useEffect(() => {
    if (isDefaultRange && !hasFilters) {
      setLeaderboard(initialData);
      return;
    }

    setIsLoading(true);
    fetchLeaderboard(
      startDate,
      endDate,
      selectedPropertyTypes,
      selectedTransactionTypes,
      selectedRepresented
    )
      .then(setLeaderboard)
      .finally(() => setIsLoading(false));
  }, [
    startDate,
    endDate,
    selectedPropertyTypes,
    selectedTransactionTypes,
    selectedRepresented,
    isDefaultRange,
    hasFilters,
    fetchLeaderboard,
    initialData,
  ]);

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

  const handleResetFilters = () => {
    setSelectedPropertyTypes([]);
    setSelectedTransactionTypes([]);
    setSelectedRepresented([]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
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
          {hasFilters && (
            <Button
              onClick={handleResetFilters}
              variant="outline"
              size="sm"
            >
              Reset Filters
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-3">
          <MultiSelectFilter
            label="Property Type"
            options={propertyTypeOptions}
            selectedValues={selectedPropertyTypes}
            onSelectionChange={setSelectedPropertyTypes}
          />
          <MultiSelectFilter
            label="Transaction Type"
            options={transactionTypeOptions}
            selectedValues={selectedTransactionTypes}
            onSelectionChange={setSelectedTransactionTypes}
          />
          <MultiSelectFilter
            label="Represented"
            options={representedOptions}
            selectedValues={selectedRepresented}
            onSelectionChange={setSelectedRepresented}
          />
        </div>
      </div>

      <LeaderboardTable data={tableData} dateRange={formatDateRange()} isLoading={isLoading} />
    </div>
  );
}

