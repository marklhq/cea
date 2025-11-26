/**
 * Upload CEA data to Supabase
 * Run: SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx npx tsx scripts/upload-to-supabase.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs/promises';
import * as path from 'path';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!; // Use service key for uploads

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function readJsonFile<T>(filename: string): Promise<T> {
  const filePath = path.join(process.cwd(), 'data', filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

async function uploadMetadata() {
  console.log('Uploading metadata...');
  const metadata = await readJsonFile<{
    last_sync: string;
    total_records: number;
    unique_salespersons: number;
  }>('metadata.json');

  const { error } = await supabase
    .from('metadata')
    .upsert({
      id: 1,
      last_sync: metadata.last_sync,
      total_records: metadata.total_records,
      unique_salespersons: metadata.unique_salespersons,
    });

  if (error) throw error;
  console.log('  ✓ metadata');
}

async function uploadTransactionsByYear() {
  console.log('Uploading transactions_by_year...');
  const data = await readJsonFile<{ [year: string]: number }>('transactions_by_year.json');

  const rows = Object.entries(data).map(([year, count]) => ({ year, count }));
  
  const { error } = await supabase
    .from('transactions_by_year')
    .upsert(rows);

  if (error) throw error;
  console.log(`  ✓ transactions_by_year (${rows.length} rows)`);
}

async function uploadSalespersonsByYear() {
  console.log('Uploading salespersons_by_year...');
  const data = await readJsonFile<{ [year: string]: number }>('salespersons_by_year.json');

  const rows = Object.entries(data).map(([year, count]) => ({ year, count }));
  
  const { error } = await supabase
    .from('salespersons_by_year')
    .upsert(rows);

  if (error) throw error;
  console.log(`  ✓ salespersons_by_year (${rows.length} rows)`);
}

async function uploadTransactionTypeByYear() {
  console.log('Uploading transaction_type_by_year...');
  const data = await readJsonFile<{ [year: string]: { [type: string]: number } }>('transaction_type_by_year.json');

  const rows: { year: string; transaction_type: string; count: number }[] = [];
  for (const [year, types] of Object.entries(data)) {
    for (const [type, count] of Object.entries(types)) {
      rows.push({ year, transaction_type: type, count });
    }
  }
  
  const { error } = await supabase
    .from('transaction_type_by_year')
    .upsert(rows);

  if (error) throw error;
  console.log(`  ✓ transaction_type_by_year (${rows.length} rows)`);
}

async function uploadPropertyTypeByYear() {
  console.log('Uploading property_type_by_year...');
  const data = await readJsonFile<{ [year: string]: { [type: string]: number } }>('property_type_by_year.json');

  const rows: { year: string; property_type: string; count: number }[] = [];
  for (const [year, types] of Object.entries(data)) {
    for (const [type, count] of Object.entries(types)) {
      rows.push({ year, property_type: type, count });
    }
  }
  
  const { error } = await supabase
    .from('property_type_by_year')
    .upsert(rows);

  if (error) throw error;
  console.log(`  ✓ property_type_by_year (${rows.length} rows)`);
}

async function uploadSalespersonInfo() {
  console.log('Uploading salesperson_info...');
  const data = await readJsonFile<{
    [regNum: string]: {
      name: string;
      reg_num: string;
      registration_start_date: string;
      registration_end_date: string;
      estate_agent_name: string;
      estate_agent_license_no: string;
    };
  }>('salesperson_info.json');

  const rows = Object.values(data).map((sp) => ({
    reg_num: sp.reg_num,
    name: sp.name,
    registration_start_date: sp.registration_start_date !== '-' ? sp.registration_start_date : null,
    registration_end_date: sp.registration_end_date !== '-' ? sp.registration_end_date : null,
    estate_agent_name: sp.estate_agent_name !== '-' ? sp.estate_agent_name : null,
    estate_agent_license_no: sp.estate_agent_license_no !== '-' ? sp.estate_agent_license_no : null,
  }));

  // Upload in batches of 1000
  const batchSize = 1000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('salesperson_info')
      .upsert(batch);

    if (error) throw error;
    console.log(`  ✓ salesperson_info batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)}`);
  }
  console.log(`  ✓ salesperson_info (${rows.length} total rows)`);
}

async function uploadSalespersonMonthly() {
  console.log('Uploading salesperson_monthly...');
  const data = await readJsonFile<{
    name: string;
    reg_num: string;
    monthly: { [monthYear: string]: number };
    total: number;
  }[]>('salesperson_monthly.json');

  const rows: { reg_num: string; name: string; month_year: string; count: number }[] = [];
  for (const sp of data) {
    for (const [monthYear, count] of Object.entries(sp.monthly)) {
      rows.push({
        reg_num: sp.reg_num,
        name: sp.name,
        month_year: monthYear,
        count,
      });
    }
  }

  // Upload in batches of 1000
  const batchSize = 1000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('salesperson_monthly')
      .upsert(batch);

    if (error) throw error;
    
    if ((i / batchSize) % 10 === 0) {
      console.log(`  Progress: ${i.toLocaleString()}/${rows.length.toLocaleString()} rows`);
    }
  }
  console.log(`  ✓ salesperson_monthly (${rows.length.toLocaleString()} total rows)`);
}

async function uploadSalespersonRecords() {
  console.log('Uploading salesperson_records (this may take a while)...');
  const data = await readJsonFile<{
    [regNum: string]: {
      name: string;
      reg_num: string;
      transaction_date: string;
      property_type: string;
      transaction_type: string;
      represented: string;
      town: string;
      district: string;
      general_location: string;
    }[];
  }>('salesperson_records.json');

  // First, clear existing records
  console.log('  Clearing existing records...');
  const { error: deleteError } = await supabase
    .from('salesperson_records')
    .delete()
    .neq('id', 0); // Delete all

  if (deleteError) throw deleteError;

  // Flatten all records
  const rows: {
    reg_num: string;
    name: string;
    transaction_date: string;
    property_type: string | null;
    transaction_type: string | null;
    represented: string | null;
    town: string | null;
    district: string | null;
    general_location: string | null;
  }[] = [];

  for (const [, records] of Object.entries(data)) {
    for (const record of records) {
      rows.push({
        reg_num: record.reg_num,
        name: record.name,
        transaction_date: record.transaction_date,
        property_type: record.property_type !== '-' ? record.property_type : null,
        transaction_type: record.transaction_type !== '-' ? record.transaction_type : null,
        represented: record.represented !== '-' ? record.represented : null,
        town: record.town !== '-' ? record.town : null,
        district: record.district !== '-' ? record.district : null,
        general_location: record.general_location !== '-' ? record.general_location : null,
      });
    }
  }

  console.log(`  Total records to upload: ${rows.length.toLocaleString()}`);

  // Upload in batches of 1000
  const batchSize = 1000;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase
      .from('salesperson_records')
      .insert(batch);

    if (error) {
      console.error(`Error at batch ${i}:`, error);
      throw error;
    }
    
    if ((i / batchSize) % 50 === 0) {
      const progress = ((i / rows.length) * 100).toFixed(1);
      console.log(`  Progress: ${i.toLocaleString()}/${rows.length.toLocaleString()} (${progress}%)`);
    }
  }
  console.log(`  ✓ salesperson_records (${rows.length.toLocaleString()} total rows)`);
}

async function main() {
  console.log('Starting Supabase data upload...\n');

  try {
    // Small tables already uploaded via MCP, skip them
    // await uploadMetadata();
    // await uploadTransactionsByYear();
    // await uploadSalespersonsByYear();
    // await uploadTransactionTypeByYear();
    // await uploadPropertyTypeByYear();
    
    // Upload large files only
    await uploadSalespersonInfo();
    await uploadSalespersonMonthly();
    await uploadSalespersonRecords();

    console.log('\n✅ All data uploaded successfully!');
  } catch (error) {
    console.error('\n❌ Upload failed:', error);
    process.exit(1);
  }
}

main();

