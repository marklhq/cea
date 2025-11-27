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
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowRightLeft,
  X,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface Movement {
  id: number;
  detected_at: string;
  reg_num: string;
  salesperson_name: string;
  old_estate_agent_name: string | null;
  new_estate_agent_name: string | null;
  old_estate_agent_license_no: string | null;
  new_estate_agent_license_no: string | null;
}

interface MovementsResponse {
  movements: Movement[];
  totalCount: number;
  hasMore: boolean;
}

interface MovementsClientProps {
  initialData: MovementsResponse;
  totalCount: number;
  fetchMovements: (
    search: string,
    page: number,
    pageSize: number
  ) => Promise<MovementsResponse>;
}

const ITEMS_PER_PAGE = 20;

// Format date for display
function formatDate(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// Format date for display (short version)
function formatDateShort(dateStr: string): string {
  if (!dateStr) return "-";
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

export function MovementsClient({
  initialData,
  totalCount: initialTotalCount,
  fetchMovements,
}: MovementsClientProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [movements, setMovements] = React.useState<Movement[]>(
    initialData.movements
  );
  const [totalCount, setTotalCount] = React.useState(initialTotalCount);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data when search or page changes
  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const result = await fetchMovements(
          debouncedSearch,
          currentPage,
          ITEMS_PER_PAGE
        );
        setMovements(result.movements);
        setTotalCount(result.totalCount);
      } catch (error) {
        console.error("Error fetching movements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [debouncedSearch, currentPage, fetchMovements]);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <ArrowRightLeft className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Movements</p>
              <p className="text-2xl font-bold text-foreground">
                {totalCount.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Table */}
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-foreground">Movement History</CardTitle>
          <CardDescription>
            Search by salesperson name or registration number
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Search by name or registration number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
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

          {/* Loading State */}
          {isLoading && (
            <div className="py-8 text-center">
              <div className="animate-pulse text-muted-foreground">
                Loading movements...
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && movements.length === 0 && (
            <div className="py-12 text-center">
              <ArrowRightLeft className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">
                {debouncedSearch
                  ? "No movements found matching your search"
                  : "No movements recorded yet. Movements will be tracked when the daily sync runs."}
              </p>
            </div>
          )}

          {/* Table */}
          {!isLoading && movements.length > 0 && (
            <>
              <div className="rounded-md border border-border/50 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[120px]">Date</TableHead>
                      <TableHead>Salesperson</TableHead>
                      <TableHead className="w-[120px]">Reg. No.</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead>To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateShort(movement.detected_at)}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Link
                            href={`/lookup?reg_num=${movement.reg_num}`}
                            className="hover:text-primary hover:underline transition-colors"
                          >
                            {movement.salesperson_name}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {movement.reg_num}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <span className="text-sm">
                              {movement.old_estate_agent_name || (
                                <span className="text-muted-foreground italic">
                                  New Registration
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <ArrowRight className="h-4 w-4 text-primary inline-block" />
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <span className="text-sm font-medium text-primary">
                              {movement.new_estate_agent_name || (
                                <span className="text-muted-foreground italic">
                                  Deregistered
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
                    {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{" "}
                    {totalCount.toLocaleString()} movements
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
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

