// Helper functions for chart data transformation (server-safe)

export interface TypeBreakdownByYear {
  [year: string]: { [type: string]: number };
}

// Helper to transform data from { year: { type: count } } to chart format
export function transformTypeData(
  data: TypeBreakdownByYear,
  allTypes: string[]
): { year: string; [key: string]: string | number }[] {
  return Object.entries(data)
    .map(([year, types]) => {
      const row: { year: string; [key: string]: string | number } = { year };
      allTypes.forEach((type) => {
        row[type] = types[type] || 0;
      });
      return row;
    })
    .sort((a, b) => String(a.year).localeCompare(String(b.year)));
}

// Get all unique types from the data
export function getAllTypes(data: TypeBreakdownByYear): string[] {
  const types = new Set<string>();
  Object.values(data).forEach((yearData) => {
    Object.keys(yearData).forEach((type) => types.add(type));
  });
  return Array.from(types);
}

