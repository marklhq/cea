"use server";

import { getSalespersonRecords, getSalespersonInfo, SalespersonRecord, SalespersonInfo } from "@/lib/data";

export interface SalespersonData {
  records: SalespersonRecord[];
  info: SalespersonInfo | null;
}

export async function fetchSalespersonRecords(
  regNum: string
): Promise<SalespersonData | null> {
  const [allRecords, allInfo] = await Promise.all([
    getSalespersonRecords(),
    getSalespersonInfo()
  ]);
  
  const records = allRecords[regNum];
  if (!records) return null;
  
  return {
    records,
    info: allInfo[regNum] || null
  };
}
