"use server";

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface Movement {
  id: number;
  detected_at: string;
  reg_num: string;
  salesperson_name: string;
  old_estate_agent_name: string | null;
  new_estate_agent_name: string | null;
  old_estate_agent_license_no: string | null;
  new_estate_agent_license_no: string | null;
}

export interface MovementsResponse {
  movements: Movement[];
  totalCount: number;
  hasMore: boolean;
}

export async function fetchMovements(
  search: string = "",
  page: number = 1,
  pageSize: number = 20
): Promise<MovementsResponse> {
  if (!isSupabaseConfigured() || !supabase) {
    console.warn("Supabase not configured, returning empty movements");
    return { movements: [], totalCount: 0, hasMore: false };
  }

  const offset = (page - 1) * pageSize;

  try {
    // Build the query
    let query = supabase
      .from("salesperson_movements")
      .select("*", { count: "exact" })
      .order("detected_at", { ascending: false });

    // Apply search filter if provided
    if (search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      query = query.or(
        `salesperson_name.ilike.${searchTerm},reg_num.ilike.${searchTerm}`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching movements:", error);
      return { movements: [], totalCount: 0, hasMore: false };
    }

    const totalCount = count || 0;
    const hasMore = offset + pageSize < totalCount;

    return {
      movements: data || [],
      totalCount,
      hasMore,
    };
  } catch (error) {
    console.error("Error fetching movements:", error);
    return { movements: [], totalCount: 0, hasMore: false };
  }
}

export async function getMovementsCount(): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from("salesperson_movements")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error getting movements count:", error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error("Error getting movements count:", error);
    return 0;
  }
}



