import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const DATA_GOV_API_URL =
  "https://data.gov.sg/api/action/datastore_search?resource_id=d_07c63be0f37e6e59c07a4ddc2fd87fcb";

interface DataGovRecord {
  salesperson_name: string;
  registration_no: string;
  registration_start_date: string;
  registration_end_date: string;
  estate_agent_name: string;
  estate_agent_license_no: string;
}

interface DataGovResponse {
  success: boolean;
  result: {
    records: DataGovRecord[];
    total: number;
    limit: number;
    offset: number;
  };
}

interface ExistingSalesperson {
  reg_num: string;
  name: string;
  estate_agent_name: string | null;
  estate_agent_license_no: string | null;
}

interface Movement {
  reg_num: string;
  salesperson_name: string;
  old_estate_agent_name: string | null;
  new_estate_agent_name: string | null;
  old_estate_agent_license_no: string | null;
  new_estate_agent_license_no: string | null;
}

// Fetch all records from data.gov.sg API with pagination
async function fetchAllSalespersons(): Promise<DataGovRecord[]> {
  const allRecords: DataGovRecord[] = [];
  const limit = 5000;
  let offset = 0;
  let total = Infinity;

  console.log("Fetching salesperson data from data.gov.sg...");

  while (offset < total) {
    const url = `${DATA_GOV_API_URL}&limit=${limit}&offset=${offset}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data: DataGovResponse = await response.json();

    if (!data.success) {
      throw new Error("API returned unsuccessful response");
    }

    allRecords.push(...data.result.records);
    total = data.result.total;
    offset += limit;

    console.log(`  Fetched ${allRecords.length}/${total} records...`);
  }

  console.log(`Total records fetched: ${allRecords.length}`);
  return allRecords;
}

// Compare and detect movements
function detectMovements(
  newRecords: DataGovRecord[],
  existingMap: Map<string, ExistingSalesperson>
): Movement[] {
  const movements: Movement[] = [];

  for (const record of newRecords) {
    const regNum = record.registration_no;
    const existing = existingMap.get(regNum);

    if (existing) {
      // Check if estate agent has changed
      const oldAgent = existing.estate_agent_name || null;
      const newAgent = record.estate_agent_name || null;

      // Normalize for comparison (trim and handle nulls)
      const oldAgentNorm = oldAgent?.trim() || null;
      const newAgentNorm = newAgent?.trim() || null;

      if (oldAgentNorm !== newAgentNorm) {
        movements.push({
          reg_num: regNum,
          salesperson_name: record.salesperson_name,
          old_estate_agent_name: oldAgentNorm,
          new_estate_agent_name: newAgentNorm,
          old_estate_agent_license_no: existing.estate_agent_license_no || null,
          new_estate_agent_license_no: record.estate_agent_license_no || null,
        });
      }
    }
    // Note: We don't track new salespersons as "movements" - only changes
  }

  return movements;
}

export async function POST(request: NextRequest) {
  // Verify API key
  const apiKey = request.headers.get("x-api-key");
  const expectedKey = process.env.SYNC_API_KEY;

  if (!expectedKey || apiKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: "Server configuration error: Missing Supabase credentials" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const startTime = Date.now();

    // Step 1: Fetch all salesperson data from data.gov.sg
    const newRecords = await fetchAllSalespersons();

    // Step 2: Fetch existing salesperson_info from Supabase
    console.log("Fetching existing salesperson data from Supabase...");
    const { data: existingData, error: fetchError } = await supabase
      .from("salesperson_info")
      .select("reg_num, name, estate_agent_name, estate_agent_license_no");

    if (fetchError) {
      throw new Error(`Failed to fetch existing data: ${fetchError.message}`);
    }

    // Build a map for quick lookup
    const existingMap = new Map<string, ExistingSalesperson>();
    for (const record of existingData || []) {
      existingMap.set(record.reg_num, record);
    }
    console.log(`Existing salespersons in database: ${existingMap.size}`);

    // Step 3: Detect movements
    const movements = detectMovements(newRecords, existingMap);
    console.log(`Detected ${movements.length} movements`);

    // Step 4: Insert movements into salesperson_movements table
    if (movements.length > 0) {
      const { error: insertError } = await supabase
        .from("salesperson_movements")
        .insert(movements);

      if (insertError) {
        throw new Error(`Failed to insert movements: ${insertError.message}`);
      }
      console.log(`Inserted ${movements.length} movement records`);
    }

    // Step 5: Update salesperson_info with latest data
    console.log("Updating salesperson_info table...");
    const updateRows = newRecords.map((record) => ({
      reg_num: record.registration_no,
      name: record.salesperson_name,
      registration_start_date: record.registration_start_date || null,
      registration_end_date: record.registration_end_date || null,
      estate_agent_name: record.estate_agent_name || null,
      estate_agent_license_no: record.estate_agent_license_no || null,
    }));

    // Upsert in batches of 1000
    const batchSize = 1000;
    for (let i = 0; i < updateRows.length; i += batchSize) {
      const batch = updateRows.slice(i, i + batchSize);
      const { error: upsertError } = await supabase
        .from("salesperson_info")
        .upsert(batch, { onConflict: "reg_num" });

      if (upsertError) {
        throw new Error(
          `Failed to upsert salesperson_info batch: ${upsertError.message}`
        );
      }
    }
    console.log(`Updated ${updateRows.length} salesperson records`);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return NextResponse.json({
      success: true,
      message: `Sync completed successfully`,
      stats: {
        totalRecordsFetched: newRecords.length,
        existingSalespersons: existingMap.size,
        movementsDetected: movements.length,
        salespersonsUpdated: updateRows.length,
        durationSeconds: parseFloat(duration),
      },
      movements: movements.slice(0, 10), // Return first 10 movements as sample
    });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy testing (still requires API key)
export async function GET(request: NextRequest) {
  return POST(request);
}

