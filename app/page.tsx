export const dynamic = 'force-dynamic';

import { StatsCards } from "@/components/stats-cards";
import { TransactionsChart } from "@/components/charts/transactions-chart";
import { SalespersonsChart } from "@/components/charts/salespersons-chart";
import { StackedTypeChart } from "@/components/charts/stacked-type-chart";
import { transformTypeData, getAllTypes } from "@/lib/chart-utils";
import {
  getMetadata,
  getTransactionsByYear,
  getSalespersonsByYear,
  getTransactionTypeByYear,
  getPropertyTypeByYear,
  yearDataToChartFormat,
} from "@/lib/data";

const TRANSACTION_TYPE_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const PROPERTY_TYPE_COLORS = [
  "oklch(0.7 0.15 200)",
  "oklch(0.65 0.12 160)",
  "oklch(0.6 0.1 280)",
  "oklch(0.55 0.13 100)",
  "oklch(0.5 0.08 340)",
];

export default async function DashboardPage() {
  const [
    metadata,
    transactionsByYear,
    salespersonsByYear,
    transactionTypeByYear,
    propertyTypeByYear,
  ] = await Promise.all([
    getMetadata(),
    getTransactionsByYear(),
    getSalespersonsByYear(),
    getTransactionTypeByYear(),
    getPropertyTypeByYear(),
  ]);

  const transactionsChartData = yearDataToChartFormat(transactionsByYear);
  const salespersonsChartData = yearDataToChartFormat(salespersonsByYear);

  // Prepare transaction type chart data
  const transactionTypes = getAllTypes(transactionTypeByYear);
  const transactionTypeChartData = transformTypeData(
    transactionTypeByYear,
    transactionTypes
  );

  // Prepare property type chart data
  const propertyTypes = getAllTypes(propertyTypeByYear);
  const propertyTypeChartData = transformTypeData(
    propertyTypeByYear,
    propertyTypes
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Overview of CEA salesperson property transactions in Singapore
        </p>
      </div>

      <StatsCards
        totalTransactions={metadata.total_records}
        uniqueSalespersons={metadata.unique_salespersons}
        lastSync={metadata.last_sync}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <TransactionsChart data={transactionsChartData} />
        <SalespersonsChart data={salespersonsChartData} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StackedTypeChart
          title="Transaction Type Breakdown"
          description="Distribution of transaction types by year (percentage)"
          data={transactionTypeChartData}
          types={transactionTypes}
          colors={TRANSACTION_TYPE_COLORS}
        />
        <StackedTypeChart
          title="Property Type Breakdown"
          description="Distribution of property types by year (percentage)"
          data={propertyTypeChartData}
          types={propertyTypes}
          colors={PROPERTY_TYPE_COLORS}
        />
      </div>
    </div>
  );
}
