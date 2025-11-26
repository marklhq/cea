import { LookupClient } from "@/components/lookup-client";
import { getSalespersonMonthly } from "@/lib/data";
import { fetchSalespersonRecords } from "./actions";

export default async function LookupPage() {
  const salespersons = await getSalespersonMonthly();

  // Create a lightweight index for search (name + reg_num only)
  const salespersonIndex = salespersons.map((sp) => ({
    name: sp.name,
    reg_num: sp.reg_num,
  }));

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

