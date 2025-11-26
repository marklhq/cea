"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Search, ChevronLeft, ChevronRight, User, Building2, Calendar, FileText, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Pie,
  PieChart,
  Cell,
  Legend,
} from "recharts";

interface SalespersonRecord {
  name: string;
  reg_num: string;
  transaction_date: string;
  property_type: string;
  transaction_type: string;
  represented: string;
  town: string;
  district: string;
  general_location: string;
}

interface SalespersonInfo {
  name: string;
  reg_num: string;
  registration_start_date: string;
  registration_end_date: string;
  estate_agent_name: string;
  estate_agent_license_no: string;
}

interface SalespersonData {
  records: SalespersonRecord[];
  info: SalespersonInfo | null;
}

interface SalespersonSummary {
  name: string;
  reg_num: string;
  records: SalespersonRecord[];
  info: SalespersonInfo | null;
}

interface LookupClientProps {
  salespersonIndex: { name: string; reg_num: string }[];
  getSalespersonData: (regNum: string) => Promise<SalespersonData | null>;
}

const ITEMS_PER_PAGE = 20;

const PIE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "oklch(0.6 0.15 280)",
  "oklch(0.55 0.12 340)",
];

// Parse "MMM-YYYY" to sortable format "YYYY-MM"
function parseDateForSort(dateStr: string): string {
  const months: { [key: string]: string } = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
  };
  const parts = dateStr.split("-");
  if (parts.length !== 2) return "0000-00";
  const month = months[parts[0].toUpperCase()] || "00";
  return `${parts[1]}-${month}`;
}

// Generate all months between two dates
function generateMonthRange(startMonth: string, endMonth: string): string[] {
  const months: string[] = [];
  const [startYear, startM] = startMonth.split("-").map(Number);
  const [endYear, endM] = endMonth.split("-").map(Number);
  
  let year = startYear;
  let month = startM;
  
  while (year < endYear || (year === endYear && month <= endM)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`);
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  
  return months;
}

// Aggregate records by month for bar chart (including empty months)
function aggregateByMonth(records: SalespersonRecord[]): { month: string; count: number }[] {
  const monthCounts: { [key: string]: number } = {};
  
  // Count transactions per month
  records.forEach((record) => {
    const sortKey = parseDateForSort(record.transaction_date);
    if (sortKey !== "0000-00") {
      monthCounts[sortKey] = (monthCounts[sortKey] || 0) + 1;
    }
  });

  // Get all months with transactions
  const monthsWithData = Object.keys(monthCounts).sort();
  
  if (monthsWithData.length === 0) return [];
  
  // Generate all months in range
  const firstMonth = monthsWithData[0];
  const lastMonth = monthsWithData[monthsWithData.length - 1];
  const allMonths = generateMonthRange(firstMonth, lastMonth);
  
  // Return all months with counts (0 for empty months)
  return allMonths.map((month) => ({
    month,
    count: monthCounts[month] || 0,
  }));
}

// Aggregate records by a field for pie chart
function aggregateByField(
  records: SalespersonRecord[],
  field: keyof SalespersonRecord
): { name: string; value: number }[] {
  const counts: { [key: string]: number } = {};
  
  records.forEach((record) => {
    const key = record[field] || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
  });

  return Object.entries(counts)
    .map(([name, value]) => ({ name: name.replace(/_/g, " "), value }))
    .sort((a, b) => b.value - a.value);
}

// Format date for display
function formatDate(dateStr: string): string {
  if (!dateStr || dateStr === "-") return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function LookupClient({ salespersonIndex, getSalespersonData }: LookupClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedSalesperson, setSelectedSalesperson] = React.useState<SalespersonSummary | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [suggestions, setSuggestions] = React.useState<{ name: string; reg_num: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [highlightedIndex, setHighlightedIndex] = React.useState(0);

  // Reset highlighted index when suggestions change
  React.useEffect(() => {
    setHighlightedIndex(0);
  }, [suggestions]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions[highlightedIndex]) {
          handleSelectSalesperson(
            suggestions[highlightedIndex].reg_num,
            suggestions[highlightedIndex].name
          );
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  // Search for matching salespersons
  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const matches = salespersonIndex
      .filter(
        (sp) =>
          sp.name.toLowerCase().includes(query) ||
          sp.reg_num.toLowerCase().includes(query)
      )
      .slice(0, 10);

    setSuggestions(matches);
  }, [searchQuery, salespersonIndex]);

  const handleSelectSalesperson = async (regNum: string, name: string) => {
    setIsLoading(true);
    setShowSuggestions(false);
    setSearchQuery(`${name} (${regNum})`);

    try {
      const data = await getSalespersonData(regNum);
      if (data) {
        // Sort by date descending
        const sortedRecords = [...data.records].sort(
          (a, b) => parseDateForSort(b.transaction_date).localeCompare(parseDateForSort(a.transaction_date))
        );
        setSelectedSalesperson({
          name,
          reg_num: regNum,
          records: sortedRecords,
          info: data.info,
        });
        setCurrentPage(1);
      }
    } catch (error) {
      console.error("Error fetching salesperson data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClearSearch = () => {
    setSearchQuery("");
    setSelectedSalesperson(null);
    setShowSuggestions(false);
    setHighlightedIndex(0);
    // Focus the input after clearing
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const totalPages = selectedSalesperson
    ? Math.ceil(selectedSalesperson.records.length / ITEMS_PER_PAGE)
    : 0;

  const paginatedRecords = selectedSalesperson
    ? selectedSalesperson.records.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
      )
    : [];

  // Chart data
  const monthlyData = selectedSalesperson
    ? aggregateByMonth(selectedSalesperson.records)
    : [];
  const propertyTypeData = selectedSalesperson
    ? aggregateByField(selectedSalesperson.records, "property_type")
    : [];
  const transactionTypeData = selectedSalesperson
    ? aggregateByField(selectedSalesperson.records, "transaction_type")
    : [];
  const representedData = selectedSalesperson
    ? aggregateByField(selectedSalesperson.records, "represented")
    : [];

  const monthlyChartConfig: ChartConfig = {
    count: {
      label: "Transactions",
      color: "var(--chart-1)",
    },
  };

  return (
    <div className="space-y-6" style={{ scrollbarGutter: "stable" }}>
      {/* Search Input */}
      <Card className="border-border/50 bg-card/50 backdrop-blur relative z-50">
        <CardHeader>
          <CardTitle className="text-foreground">Search Salesperson</CardTitle>
          <CardDescription>
            Enter a salesperson name or registration number to view their transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search by name or registration number..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-[100] mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                {suggestions.map((sp, index) => (
                  <button
                    key={sp.reg_num}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-md last:rounded-b-md ${
                      index === highlightedIndex
                        ? "bg-muted"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => handleSelectSalesperson(sp.reg_num, sp.name)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium text-foreground">{sp.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {sp.reg_num}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardContent className="py-12 text-center">
            <div className="animate-pulse text-muted-foreground">
              Loading transaction records...
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {selectedSalesperson && !isLoading && (
        <>
          {/* Salesperson Info & Monthly Transactions Chart */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {selectedSalesperson.name}
              </CardTitle>
              <CardDescription>
                Registration: {selectedSalesperson.reg_num}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Salesperson Info */}
              {selectedSalesperson.info && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-start gap-3">
                    <Building2 className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Estate Agent</div>
                      <div className="text-sm font-medium">{selectedSalesperson.info.estate_agent_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {selectedSalesperson.info.estate_agent_license_no}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Registration Start</div>
                      <div className="text-sm font-medium">
                        {formatDate(selectedSalesperson.info.registration_start_date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Registration End</div>
                      <div className="text-sm font-medium">
                        {formatDate(selectedSalesperson.info.registration_end_date)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-4 w-4 text-primary mt-0.5" />
                    <div>
                      <div className="text-xs text-muted-foreground">Total Transactions</div>
                      <div className="text-sm font-medium">{selectedSalesperson.records.length.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Monthly Chart */}
              <ChartContainer config={monthlyChartConfig} className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                      interval="preserveStartEnd"
                      tickFormatter={(value) => {
                        const [year, month] = value.split("-");
                        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        return `${months[parseInt(month) - 1]} ${year.slice(2)}`;
                      }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => [value, "Transactions"]}
                          labelFormatter={(label) => {
                            const [year, month] = label.split("-");
                            const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                            return `${months[parseInt(month) - 1]} ${year}`;
                          }}
                        />
                      }
                      cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                    />
                    <Bar
                      dataKey="count"
                      fill="var(--chart-1)"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Pie Charts */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Property Type Pie */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Property Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={propertyTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {propertyTypeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => [value, name]}
                          />
                        }
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-xs text-muted-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Transaction Type Pie */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Transaction Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={transactionTypeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {transactionTypeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => [value, name]}
                          />
                        }
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-xs text-muted-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Represented Pie */}
            <Card className="border-border/50 bg-card/50 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Represented</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={representedData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {representedData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value, name) => [value, name]}
                          />
                        }
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => (
                          <span className="text-xs text-muted-foreground">{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <Card className="border-border/50 bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-foreground">Transaction Records</CardTitle>
              <CardDescription>
                Detailed transaction history sorted by date (newest first)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-border/50 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[100px]">Date</TableHead>
                      <TableHead>Property Type</TableHead>
                      <TableHead>Transaction Type</TableHead>
                      <TableHead>Represented</TableHead>
                      <TableHead>Town</TableHead>
                      <TableHead>District</TableHead>
                      <TableHead>General Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record, index) => (
                      <TableRow key={`${record.transaction_date}-${index}`}>
                        <TableCell className="font-mono text-sm">
                          {record.transaction_date}
                        </TableCell>
                        <TableCell>{record.property_type.replace(/_/g, " ")}</TableCell>
                        <TableCell>{record.transaction_type}</TableCell>
                        <TableCell>{record.represented}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.town}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.district}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {record.general_location}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      selectedSalesperson.records.length
                    )}{" "}
                    of {selectedSalesperson.records.length.toLocaleString()} records
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-2">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
