"use server";

import { getSalespersonRecordsByRegNum, getSalespersonInfo, SalespersonRecord, SalespersonInfo } from "@/lib/data";

export interface SalespersonData {
  records: SalespersonRecord[];
  info: SalespersonInfo | null;
}

export async function fetchSalespersonRecords(
  regNum: string
): Promise<SalespersonData | null> {
  const [records, allInfo] = await Promise.all([
    getSalespersonRecordsByRegNum(regNum),
    getSalespersonInfo()
  ]);
  
  if (!records) return null;
  
  return {
    records,
    info: allInfo[regNum] || null
  };
}
