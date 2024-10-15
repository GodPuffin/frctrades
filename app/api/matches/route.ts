import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { Match } from "@/types/Match";

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");

  // Existing team filtering
  const teams = searchParams.get("teams")?.split(",") || [];

  // New event keys filtering
  const eventKeys = searchParams.get("events")?.split(",") || [];

  let query = supabase
    .from("matches")
    .select("*")
    .order("match_time", { ascending: true })
    .range(offset, offset + limit - 1);

  // Existing team filter logic
  if (teams.length > 0) {
    query = query.or(
      `red1.in.(${teams.join(",")}),red2.in.(${
        teams.join(
          ",",
        )
      }),red3.in.(${
        teams.join(
          ",",
        )
      }),blue1.in.(${
        teams.join(
          ",",
        )
      }),blue2.in.(${teams.join(",")}),blue3.in.(${teams.join(",")})`,
    );
  }

  // New event keys filter logic
  if (eventKeys.length > 0) {
    query = query.in("event_key", eventKeys);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Match[]);
}

export async function POST(request: Request) {
  const supabase = createClient();
  const body = await request.json();

  const { data, error } = await supabase
    .from("matches")
    .insert(body)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data as Match[]);
}
