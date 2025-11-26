export const dynamic = 'force-dynamic';

import { LookupClient } from "@/components/lookup-client";
import { getSalespersonIndex } from "@/lib/data";
import { fetchSalespersonRecords } from "./actions";

export default async function LookupPage() {
  const salespersonIndex = await getSalespersonIndex();

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
      />
    </div>
  );
}

