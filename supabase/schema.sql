-- CEA Analytics Database Schema for Supabase

-- Metadata table (single row)
CREATE TABLE IF NOT EXISTS metadata (
  id INTEGER PRIMARY KEY DEFAULT 1,
  last_sync TIMESTAMPTZ NOT NULL,
  total_records INTEGER NOT NULL,
  unique_salespersons INTEGER NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

-- Transactions by year
CREATE TABLE IF NOT EXISTS transactions_by_year (
  year TEXT PRIMARY KEY,
  count INTEGER NOT NULL
);

-- Salespersons by year (unique active salespersons)
CREATE TABLE IF NOT EXISTS salespersons_by_year (
  year TEXT PRIMARY KEY,
  count INTEGER NOT NULL
);

-- Transaction type breakdown by year
CREATE TABLE IF NOT EXISTS transaction_type_by_year (
  year TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (year, transaction_type)
);

-- Property type breakdown by year
CREATE TABLE IF NOT EXISTS property_type_by_year (
  year TEXT NOT NULL,
  property_type TEXT NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (year, property_type)
);

-- Salesperson info (from CEASalespersonInformation.csv)
CREATE TABLE IF NOT EXISTS salesperson_info (
  reg_num TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  registration_start_date DATE,
  registration_end_date DATE,
  estate_agent_name TEXT,
  estate_agent_license_no TEXT
);

-- Salesperson monthly aggregates (for leaderboard)
CREATE TABLE IF NOT EXISTS salesperson_monthly (
  reg_num TEXT NOT NULL,
  name TEXT NOT NULL,
  month_year TEXT NOT NULL, -- "2024-01" format
  count INTEGER NOT NULL,
  PRIMARY KEY (reg_num, month_year)
);

-- Create index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_salesperson_monthly_month ON salesperson_monthly(month_year);
CREATE INDEX IF NOT EXISTS idx_salesperson_monthly_count ON salesperson_monthly(count DESC);

-- Salesperson transaction records (the main data)
CREATE TABLE IF NOT EXISTS salesperson_records (
  id SERIAL PRIMARY KEY,
  reg_num TEXT NOT NULL,
  name TEXT NOT NULL,
  transaction_date TEXT NOT NULL, -- "OCT-2024" format
  property_type TEXT,
  transaction_type TEXT,
  represented TEXT,
  town TEXT,
  district TEXT,
  general_location TEXT
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_records_reg_num ON salesperson_records(reg_num);
CREATE INDEX IF NOT EXISTS idx_records_date ON salesperson_records(transaction_date);

-- Enable Row Level Security (RLS) for public read access
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions_by_year ENABLE ROW LEVEL SECURITY;
ALTER TABLE salespersons_by_year ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_type_by_year ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_type_by_year ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesperson_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesperson_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesperson_records ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public read access" ON metadata FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transactions_by_year FOR SELECT USING (true);
CREATE POLICY "Public read access" ON salespersons_by_year FOR SELECT USING (true);
CREATE POLICY "Public read access" ON transaction_type_by_year FOR SELECT USING (true);
CREATE POLICY "Public read access" ON property_type_by_year FOR SELECT USING (true);
CREATE POLICY "Public read access" ON salesperson_info FOR SELECT USING (true);
CREATE POLICY "Public read access" ON salesperson_monthly FOR SELECT USING (true);
CREATE POLICY "Public read access" ON salesperson_records FOR SELECT USING (true);

