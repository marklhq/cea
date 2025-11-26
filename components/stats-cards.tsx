"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalTransactions: number;
  uniqueSalespersons: number;
  lastSync: string;
}

export function StatsCards({
  totalTransactions,
  uniqueSalespersons,
  lastSync,
}: StatsCardsProps) {
  const avgTransactions = Math.round(totalTransactions / uniqueSalespersons);
  const syncDate = new Date(lastSync).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Transactions
          </CardTitle>
          <FileText className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono text-foreground">
            {totalTransactions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Since January 2017
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Unique Salespersons
          </CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono text-foreground">
            {uniqueSalespersons.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Registered agents with transactions
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/50 bg-card/50 backdrop-blur">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Avg. per Salesperson
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold font-mono text-foreground">
            {avgTransactions.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Data updated {syncDate}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

