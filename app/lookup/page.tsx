export const dynamic = 'force-dynamic';

import { LookupClient } from "@/components/lookup-client";
import { getSalespersonIndex } from "@/lib/data";
import { fetchSalespersonRecords } from "./actions";

interface LookupPageProps {
  searchParams: Promise<{ reg_num?: string }>;
}

export default async function LookupPage({ searchParams }: LookupPageProps) {
  const [salespersonIndex, params] = await Promise.all([
    getSalespersonIndex(),
    searchParams,
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Salesperson Lookup
        </h1>
        <p className="text-muted-foreground mt-1">
          Search for a salesperson to view their complete transaction history
        </p>
      </div>

      <LookupClient
        salespersonIndex={salespersonIndex}
        getSalespersonData={fetchSalespersonRecords}
        initialRegNum={params.reg_num}
      />
    </div>
  );
}

