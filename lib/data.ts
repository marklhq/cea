import { promises as fs } from "fs";
import path from "path";

export interface Metadata {
  last_sync: string;
  total_records: number;
  unique_salespersons: number;
}

export interface TransactionsByYear {
  [year: string]: number;
}

export interface SalespersonsByYear {
  [year: string]: number;
}

export interface SalespersonMonthly {
  name: string;
  reg_num: string;
  monthly: { [monthYear: string]: number };
  total: number;
}

export interface TypeBreakdownByYear {
  [year: string]: { [type: string]: number };
}

export interface SalespersonRecord {
  name: string;
  reg_num: string;
  transaction_date: string;
  property_type: string;
  transaction_type: string;
  represented: string;
  town: string;
  district: string;
  general_location: string;
}

export interface SalespersonInfo {
  name: string;
  reg_num: string;
  registration_start_date: string;
  registration_end_date: string;
  estate_agent_name: string;
  estate_agent_license_no: string;
}

async function readJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), "data", filename);
  const content = await fs.readFile(filePath, "utf-8");
  return JSON.parse(content) as T;
}

export async function getMetadata(): Promise<Metadata> {
  return readJsonFile<Metadata>("metadata.json");
}

export async function getTransactionsByYear(): Promise<TransactionsByYear> {
  return readJsonFile<TransactionsByYear>("transactions_by_year.json");
}

export async function getSalespersonsByYear(): Promise<SalespersonsByYear> {
  return readJsonFile<SalespersonsByYear>("salespersons_by_year.json");
}

export async function getSalespersonMonthly(): Promise<SalespersonMonthly[]> {
  return readJsonFile<SalespersonMonthly[]>("salesperson_monthly.json");
}

export async function getTransactionTypeByYear(): Promise<TypeBreakdownByYear> {
  return readJsonFile<TypeBreakdownByYear>("transaction_type_by_year.json");
}

export async function getPropertyTypeByYear(): Promise<TypeBreakdownByYear> {
  return readJsonFile<TypeBreakdownByYear>("property_type_by_year.json");
}

export async function getSalespersonRecords(): Promise<{ [regNum: string]: SalespersonRecord[] }> {
  return readJsonFile<{ [regNum: string]: SalespersonRecord[] }>("salesperson_records.json");
}

export async function getSalespersonInfo(): Promise<{ [regNum: string]: SalespersonInfo }> {
  return readJsonFile<{ [regNum: string]: SalespersonInfo }>("salesperson_info.json");
}

// Helper to convert year data to chart format
export function yearDataToChartFormat(data: { [year: string]: number }): { year: string; value: number }[] {
  return Object.entries(data)
    .map(([year, value]) => ({ year, value }))
    .sort((a, b) => a.year.localeCompare(b.year));
}

// Get available date range from salesperson data
export function getAvailableDateRange(salespersons: SalespersonMonthly[]): {
  minDate: string;
  maxDate: string;
} {
  let minDate = "9999-12";
  let maxDate = "0000-01";

  for (const sp of salespersons) {
    for (const monthYear of Object.keys(sp.monthly)) {
      if (monthYear < minDate) minDate = monthYear;
      if (monthYear > maxDate) maxDate = monthYear;
    }
  }

  return { minDate, maxDate };
}
