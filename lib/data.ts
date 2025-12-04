import { supabase, isSupabaseConfigured } from './supabase';

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

function checkSupabase() {
  if (!isSupabaseConfigured() || !supabase) {
    throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  }
  return supabase;
}

export async function getMetadata(): Promise<Metadata> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('metadata')
    .select('*')
    .single();

  if (error) throw error;
  return {
    last_sync: data.last_sync,
    total_records: data.total_records,
    unique_salespersons: data.unique_salespersons,
  };
}

export async function getTransactionsByYear(): Promise<TransactionsByYear> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('transactions_by_year')
    .select('*');

  if (error) throw error;
  
  const result: TransactionsByYear = {};
  for (const row of data) {
    result[row.year] = row.count;
  }
  return result;
}

export async function getSalespersonsByYear(): Promise<SalespersonsByYear> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('salespersons_by_year')
    .select('*');

  if (error) throw error;
  
  const result: SalespersonsByYear = {};
  for (const row of data) {
    result[row.year] = row.count;
  }
  return result;
}

export async function getTransactionTypeByYear(): Promise<TypeBreakdownByYear> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('transaction_type_by_year')
    .select('*');

  if (error) throw error;
  
  const result: TypeBreakdownByYear = {};
  for (const row of data) {
    if (!result[row.year]) result[row.year] = {};
    result[row.year][row.transaction_type] = row.count;
  }
  return result;
}

export async function getPropertyTypeByYear(): Promise<TypeBreakdownByYear> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('property_type_by_year')
    .select('*');

  if (error) throw error;
  
  const result: TypeBreakdownByYear = {};
  for (const row of data) {
    if (!result[row.year]) result[row.year] = {};
    result[row.year][row.property_type] = row.count;
  }
  return result;
}

export async function getSalespersonMonthly(): Promise<SalespersonMonthly[]> {
  const client = checkSupabase();
  
  // Fetch all rows with pagination (Supabase default limit is 1000)
  const allData: { reg_num: string; name: string; month_year: string; count: number }[] = [];
  const pageSize = 1000;
  let page = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await client
      .from('salesperson_monthly')
      .select('*')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) throw error;
    
    if (data && data.length > 0) {
      allData.push(...data);
      hasMore = data.length === pageSize;
      page++;
    } else {
      hasMore = false;
    }
  }

  // Group by reg_num
  const grouped: { [regNum: string]: { name: string; monthly: { [monthYear: string]: number } } } = {};
  
  for (const row of allData) {
    if (!grouped[row.reg_num]) {
      grouped[row.reg_num] = { name: row.name, monthly: {} };
    }
    grouped[row.reg_num].monthly[row.month_year] = row.count;
  }

  // Convert to array with totals
  const result: SalespersonMonthly[] = Object.entries(grouped).map(([regNum, data]) => ({
    name: data.name,
    reg_num: regNum,
    monthly: data.monthly,
    total: Object.values(data.monthly).reduce((sum, count) => sum + count, 0),
  }));

  // Sort by total descending
  result.sort((a, b) => b.total - a.total);
  
  return result;
}

export async function getSalespersonInfo(): Promise<{ [regNum: string]: SalespersonInfo }> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('salesperson_info')
    .select('*');

  if (error) throw error;

  const result: { [regNum: string]: SalespersonInfo } = {};
  for (const row of data) {
    result[row.reg_num] = {
      name: row.name,
      reg_num: row.reg_num,
      registration_start_date: row.registration_start_date || '-',
      registration_end_date: row.registration_end_date || '-',
      estate_agent_name: row.estate_agent_name || '-',
      estate_agent_license_no: row.estate_agent_license_no || '-',
    };
  }
  return result;
}

export async function getSalespersonRecordsByRegNum(regNum: string): Promise<SalespersonRecord[] | null> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('salesperson_records')
    .select('*')
    .eq('reg_num', regNum);

  if (error) throw error;
  if (!data || data.length === 0) return null;

  return data.map((row) => ({
    name: row.name,
    reg_num: row.reg_num,
    transaction_date: row.transaction_date,
    property_type: row.property_type || '-',
    transaction_type: row.transaction_type || '-',
    represented: row.represented || '-',
    town: row.town || '-',
    district: row.district || '-',
    general_location: row.general_location || '-',
  }));
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

// Lightweight salesperson index for search dropdown
export interface SalespersonIndexItem {
  name: string;
  reg_num: string;
}

export async function getSalespersonIndex(): Promise<SalespersonIndexItem[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('salesperson_index')
    .select('*');

  if (error) throw error;
  return data.map((row) => ({
    name: row.name,
    reg_num: row.reg_num,
  }));
}

// Pre-aggregated leaderboard totals for fast loading
export interface SalespersonTotal {
  name: string;
  reg_num: string;
  total_transactions: number;
}

export async function getSalespersonTotals(limit: number = 100): Promise<SalespersonTotal[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('salesperson_totals')
    .select('*')
    .order('total_transactions', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.map((row) => ({
    name: row.name,
    reg_num: row.reg_num,
    total_transactions: row.total_transactions,
  }));
}

// Get leaderboard for a specific date range (calculated server-side)
export async function getLeaderboardByDateRange(
  startDate: string, // "2024-01" format
  endDate: string,   // "2024-12" format
  limit: number = 100
): Promise<SalespersonTotal[]> {
  const client = checkSupabase();
  
  const { data, error } = await client
    .rpc('get_leaderboard_by_date_range', {
      start_date: startDate,
      end_date: endDate,
      result_limit: limit
    });

  if (error) {
    // Fallback if RPC doesn't exist yet - use direct query
    const { data: fallbackData, error: fallbackError } = await client
      .from('salesperson_monthly')
      .select('reg_num, name, count')
      .gte('month_year', startDate)
      .lte('month_year', endDate);
    
    if (fallbackError) throw fallbackError;
    
    // Aggregate in JS
    const totals: { [key: string]: { name: string; total: number } } = {};
    for (const row of fallbackData || []) {
      if (!totals[row.reg_num]) {
        totals[row.reg_num] = { name: row.name, total: 0 };
      }
      totals[row.reg_num].total += row.count;
    }
    
    return Object.entries(totals)
      .map(([reg_num, data]) => ({
        reg_num,
        name: data.name,
        total_transactions: data.total,
      }))
      .sort((a, b) => b.total_transactions - a.total_transactions)
      .slice(0, limit);
  }
  
  return data;
}

// Get available years from metadata
export async function getAvailableYears(): Promise<string[]> {
  const client = checkSupabase();
  const { data, error } = await client
    .from('transactions_by_year')
    .select('year')
    .order('year');

  if (error) throw error;
  return data.map((row) => row.year);
}

// Estate agent breakdown for donut chart
export interface EstateAgentBreakdown {
  name: string;
  count: number;
}

export async function getEstateAgentBreakdown(minThreshold: number = 100): Promise<EstateAgentBreakdown[]> {
  const client = checkSupabase();
  
  // Fetch all salesperson info with estate agent names
  const { data, error } = await client
    .from('salesperson_info')
    .select('estate_agent_name');

  if (error) throw error;

  // Count salespersons per estate agent
  const agentCounts: { [name: string]: number } = {};
  for (const row of data) {
    const agentName = row.estate_agent_name || 'Unknown';
    agentCounts[agentName] = (agentCounts[agentName] || 0) + 1;
  }

  // Separate into major agents (>=threshold) and others (<threshold)
  const result: EstateAgentBreakdown[] = [];
  let othersCount = 0;

  for (const [name, count] of Object.entries(agentCounts)) {
    if (count >= minThreshold) {
      result.push({ name, count });
    } else {
      othersCount += count;
    }
  }

  // Add "Others" category if there are any
  if (othersCount > 0) {
    result.push({ name: 'Others', count: othersCount });
  }

  // Sort by count descending (but keep Others at the end)
  result.sort((a, b) => {
    if (a.name === 'Others') return 1;
    if (b.name === 'Others') return -1;
    return b.count - a.count;
  });

  return result;
}
