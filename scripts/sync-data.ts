/**
 * Data sync script for CEA Salespersons Property Transaction Records
 * Reads from local CSV file and aggregates into JSON files
 */

import * as fs from "fs/promises";
import * as path from "path";
import { createReadStream } from "fs";
import * as readline from "readline";

interface TransactionsByYear {
  [year: string]: number;
}

interface SalespersonsByYear {
  [year: string]: number;
}

interface SalespersonMonthly {
  name: string;
  reg_num: string;
  monthly: { [monthYear: string]: number }; // "2024-01": count
  total: number;
}

interface TypeBreakdownByYear {
  [year: string]: { [type: string]: number };
}

interface SalespersonRecord {
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

interface SalespersonInfo {
  name: string;
  reg_num: string;
  registration_start_date: string;
  registration_end_date: string;
  estate_agent_name: string;
  estate_agent_license_no: string;
}

interface Metadata {
  last_sync: string;
  total_records: number;
  unique_salespersons: number;
}

// Parse transaction date "MMM-YYYY" to year and "YYYY-MM" format
function parseTransactionDate(dateStr: string): { year: string; monthYear: string } | null {
  if (!dateStr || dateStr === "-") return null;
  
  const months: { [key: string]: string } = {
    JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
    JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12"
  };
  
  const parts = dateStr.split("-");
  if (parts.length !== 2) return null;
  
  const month = months[parts[0].toUpperCase()];
  const year = parts[1];
  
  if (!month || !year) return null;
  
  return {
    year,
    monthYear: `${year}-${month}`
  };
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

async function processSalespersonInfoCSV(): Promise<{ [regNum: string]: SalespersonInfo }> {
  const csvPath = path.join(process.cwd(), "data", "CEASalespersonInformation.csv");
  
  console.log("Reading Salesperson Information CSV...");
  
  const salespersonInfo: { [regNum: string]: SalespersonInfo } = {};
  let lineNumber = 0;
  
  const fileStream = createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    lineNumber++;
    
    // Skip header
    if (lineNumber === 1) continue;
    
    // Parse CSV line (handling quoted fields)
    const parts = parseCSVLine(line);
    if (parts.length < 6) continue;
    
    const [name, regNum, startDate, endDate, agentName, agentLicenseNo] = parts;
    
    if (!regNum) continue;
    
    salespersonInfo[regNum] = {
      name: name || "Unknown",
      reg_num: regNum,
      registration_start_date: startDate || "-",
      registration_end_date: endDate || "-",
      estate_agent_name: agentName || "-",
      estate_agent_license_no: agentLicenseNo || "-"
    };
  }
  
  console.log(`  Loaded ${Object.keys(salespersonInfo).length.toLocaleString()} salesperson records`);
  
  return salespersonInfo;
}

async function processCSV(): Promise<{
  transactionsByYear: TransactionsByYear;
  salespersonsByYear: SalespersonsByYear;
  salespersonMonthly: SalespersonMonthly[];
  transactionTypeByYear: TypeBreakdownByYear;
  propertyTypeByYear: TypeBreakdownByYear;
  salespersonRecords: { [regNum: string]: SalespersonRecord[] };
  metadata: Metadata;
}> {
  const csvPath = path.join(process.cwd(), "data", "CEASalespersonsPropertyTransactionRecordsresidential.csv");
  
  console.log("Reading Transaction Records CSV...");
  
  const transactionsByYear: TransactionsByYear = {};
  const salespersonsPerYear: { [year: string]: Set<string> } = {};
  const salespersonData: { [regNum: string]: { name: string; monthly: { [monthYear: string]: number } } } = {};
  const transactionTypeByYear: TypeBreakdownByYear = {};
  const propertyTypeByYear: TypeBreakdownByYear = {};
  const salespersonRecords: { [regNum: string]: SalespersonRecord[] } = {};
  
  let totalRecords = 0;
  let lineNumber = 0;
  
  const fileStream = createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  
  for await (const line of rl) {
    lineNumber++;
    
    // Skip header
    if (lineNumber === 1) continue;
    
    // Parse CSV line (simple parsing - assumes no commas in values)
    const parts = line.split(",");
    if (parts.length < 9) continue;
    
    const [name, transactionDate, regNum, propertyType, transactionType, represented, town, district, generalLocation] = parts;
    
    const parsed = parseTransactionDate(transactionDate);
    if (!parsed) continue;
    
    const { year, monthYear } = parsed;
    const salespersonRegNum = regNum || "UNKNOWN";
    const salespersonName = name || "Unknown";
    
    totalRecords++;
    
    // Count transactions by year
    transactionsByYear[year] = (transactionsByYear[year] || 0) + 1;
    
    // Track unique salespersons per year
    if (!salespersonsPerYear[year]) {
      salespersonsPerYear[year] = new Set();
    }
    salespersonsPerYear[year].add(salespersonRegNum);
    
    // Track monthly counts per salesperson
    if (!salespersonData[salespersonRegNum]) {
      salespersonData[salespersonRegNum] = { name: salespersonName, monthly: {} };
    }
    salespersonData[salespersonRegNum].monthly[monthYear] = 
      (salespersonData[salespersonRegNum].monthly[monthYear] || 0) + 1;
    
    // Track transaction type by year
    if (!transactionTypeByYear[year]) {
      transactionTypeByYear[year] = {};
    }
    const txnType = transactionType || "Unknown";
    transactionTypeByYear[year][txnType] = (transactionTypeByYear[year][txnType] || 0) + 1;
    
    // Track property type by year
    if (!propertyTypeByYear[year]) {
      propertyTypeByYear[year] = {};
    }
    const propType = propertyType || "Unknown";
    propertyTypeByYear[year][propType] = (propertyTypeByYear[year][propType] || 0) + 1;
    
    // Store individual records for salesperson lookup
    if (!salespersonRecords[salespersonRegNum]) {
      salespersonRecords[salespersonRegNum] = [];
    }
    salespersonRecords[salespersonRegNum].push({
      name: salespersonName,
      reg_num: salespersonRegNum,
      transaction_date: transactionDate,
      property_type: propertyType || "-",
      transaction_type: transactionType || "-",
      represented: represented || "-",
      town: town || "-",
      district: district || "-",
      general_location: generalLocation || "-"
    });
    
    // Progress update
    if (lineNumber % 100000 === 0) {
      console.log(`  Processed ${lineNumber.toLocaleString()} lines...`);
    }
  }
  
  console.log(`\nTotal records processed: ${totalRecords.toLocaleString()}`);
  
  // Convert salespersons per year sets to counts
  const salespersonsByYear: SalespersonsByYear = {};
  for (const year of Object.keys(salespersonsPerYear)) {
    salespersonsByYear[year] = salespersonsPerYear[year].size;
  }
  
  // Convert salesperson data to array with totals
  const salespersonMonthly: SalespersonMonthly[] = Object.entries(salespersonData).map(([regNum, data]) => ({
    name: data.name,
    reg_num: regNum,
    monthly: data.monthly,
    total: Object.values(data.monthly).reduce((sum, count) => sum + count, 0)
  }));
  
  // Sort by total transactions descending
  salespersonMonthly.sort((a, b) => b.total - a.total);
  
  const metadata: Metadata = {
    last_sync: new Date().toISOString(),
    total_records: totalRecords,
    unique_salespersons: salespersonMonthly.length
  };
  
  console.log(`Years: ${Object.keys(transactionsByYear).sort().join(", ")}`);
  console.log(`Unique salespersons: ${metadata.unique_salespersons.toLocaleString()}`);
  console.log(`Transaction types: ${[...new Set(Object.values(transactionTypeByYear).flatMap(y => Object.keys(y)))].join(", ")}`);
  console.log(`Property types: ${[...new Set(Object.values(propertyTypeByYear).flatMap(y => Object.keys(y)))].join(", ")}`);
  
  return { 
    transactionsByYear, 
    salespersonsByYear, 
    salespersonMonthly, 
    transactionTypeByYear,
    propertyTypeByYear,
    salespersonRecords,
    metadata 
  };
}

async function saveData(data: {
  transactionsByYear: TransactionsByYear;
  salespersonsByYear: SalespersonsByYear;
  salespersonMonthly: SalespersonMonthly[];
  transactionTypeByYear: TypeBreakdownByYear;
  propertyTypeByYear: TypeBreakdownByYear;
  salespersonRecords: { [regNum: string]: SalespersonRecord[] };
  salespersonInfo: { [regNum: string]: SalespersonInfo };
  metadata: Metadata;
}) {
  const dataDir = path.join(process.cwd(), "data");
  
  console.log("\nSaving aggregated data...");
  
  // Save each file
  await fs.writeFile(
    path.join(dataDir, "metadata.json"),
    JSON.stringify(data.metadata, null, 2)
  );
  console.log("  ✓ metadata.json");
  
  await fs.writeFile(
    path.join(dataDir, "transactions_by_year.json"),
    JSON.stringify(data.transactionsByYear, null, 2)
  );
  console.log("  ✓ transactions_by_year.json");
  
  await fs.writeFile(
    path.join(dataDir, "salespersons_by_year.json"),
    JSON.stringify(data.salespersonsByYear, null, 2)
  );
  console.log("  ✓ salespersons_by_year.json");
  
  await fs.writeFile(
    path.join(dataDir, "salesperson_monthly.json"),
    JSON.stringify(data.salespersonMonthly, null, 2)
  );
  console.log("  ✓ salesperson_monthly.json");
  
  await fs.writeFile(
    path.join(dataDir, "transaction_type_by_year.json"),
    JSON.stringify(data.transactionTypeByYear, null, 2)
  );
  console.log("  ✓ transaction_type_by_year.json");
  
  await fs.writeFile(
    path.join(dataDir, "property_type_by_year.json"),
    JSON.stringify(data.propertyTypeByYear, null, 2)
  );
  console.log("  ✓ property_type_by_year.json");
  
  await fs.writeFile(
    path.join(dataDir, "salesperson_records.json"),
    JSON.stringify(data.salespersonRecords)
  );
  console.log("  ✓ salesperson_records.json");
  
  await fs.writeFile(
    path.join(dataDir, "salesperson_info.json"),
    JSON.stringify(data.salespersonInfo)
  );
  console.log("  ✓ salesperson_info.json");
  
  console.log("\nData sync complete!");
}

async function main() {
  try {
    const [aggregated, salespersonInfo] = await Promise.all([
      processCSV(),
      processSalespersonInfoCSV()
    ]);
    await saveData({ ...aggregated, salespersonInfo });
  } catch (error) {
    console.error("Error during sync:", error);
    process.exit(1);
  }
}

main();
