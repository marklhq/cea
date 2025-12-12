"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUpDown, Trophy, Medal, Award, ChevronLeft, ChevronRight } from "lucide-react";

interface LeaderboardEntry {
  name: string;
  reg_num: string;
  transactions: number;
}

interface LeaderboardTableProps {
  data: LeaderboardEntry[];
  dateRange: string;
  isLoading?: boolean;
}

type SortField = "rank" | "name" | "transactions";
type SortDirection = "asc" | "desc";

const ITEMS_PER_PAGE = 25;

export function LeaderboardTable({ data, dateRange, isLoading = false }: LeaderboardTableProps) {
  const router = useRouter();
  const [sortField, setSortField] = React.useState<SortField>("transactions");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = React.useState(1);

  const sortedData = React.useMemo(() => {
    const sorted = [...data].map((item, index) => ({ ...item, rank: index + 1 }));
    
    if (sortField === "rank") {
      sorted.sort((a, b) => 
        sortDirection === "asc" ? a.rank - b.rank : b.rank - a.rank
      );
    } else if (sortField === "name") {
      sorted.sort((a, b) =>
        sortDirection === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    } else if (sortField === "transactions") {
      sorted.sort((a, b) =>
        sortDirection === "asc"
          ? a.transactions - b.transactions
          : b.transactions - a.transactions
      );
    }
    
    return sorted;
  }, [data, sortField, sortDirection]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "transactions" ? "desc" : "asc");
    }
    setCurrentPage(1);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return null;
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-foreground">Top Salespersons</CardTitle>
        <CardDescription>
          Ranked by transaction count for {dateRange}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort("rank")}
                  >
                    Rank
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-ml-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort("name")}
                  >
                    Salesperson
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[150px]">Reg. Number</TableHead>
                <TableHead className="text-right w-[150px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="-mr-3 h-8 data-[state=open]:bg-accent"
                    onClick={() => handleSort("transactions")}
                  >
                    Transactions
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Skeleton loading rows
                Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                paginatedData.map((entry) => (
                  <TableRow 
                    key={entry.reg_num} 
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => router.push(`/lookup?reg_num=${encodeURIComponent(entry.reg_num)}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {getRankIcon(entry.rank)}
                        <span className="font-mono">{entry.rank}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{entry.name}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {entry.reg_num}
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-primary">
                      {entry.transactions.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          {isLoading ? (
            <>
              <Skeleton className="h-5 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-20" />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, sortedData.length)} of{" "}
                {sortedData.length.toLocaleString()} salespersons
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
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

