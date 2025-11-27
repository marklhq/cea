export const dynamic = "force-dynamic";

import { MovementsClient } from "@/components/movements-client";
import { fetchMovements, getMovementsCount } from "./actions";

export default async function MovementsPage() {
  // Fetch initial data
  const [initialData, totalCount] = await Promise.all([
    fetchMovements("", 1, 20),
    getMovementsCount(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Salesperson Movements
        </h1>
        <p className="text-muted-foreground mt-1">
          Track salesperson movements between estate agents
        </p>
      </div>

      <MovementsClient
        initialData={initialData}
        totalCount={totalCount}
        fetchMovements={fetchMovements}
      />
    </div>
  );
}

