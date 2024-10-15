import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const TBA_API_KEY = process.env.TBA_API_KEY!;

interface Event {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
}

interface Match {
  key: string;
  comp_level: string;
  set_number: number;
  match_number: number;
  alliances: {
    red: {
      score: number;
      team_keys: string[];
    };
    blue: {
      score: number;
      team_keys: string[];
    };
  };
  winning_alliance: string | null;
  event_key: string;
  time: number;
  actual_time: number;
  predicted_time: number;
  score_breakdown: any | null;
}

async function fetchUpcomingMatches(): Promise<Match[]> {
  try {
    const response = await fetch(
      "https://www.thebluealliance.com/api/v3/events/2024",
      {
        headers: {
          "X-TBA-Auth-Key": TBA_API_KEY!,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const events = await response.json() as Event[];

    if (!Array.isArray(events)) {
      console.error("Unexpected response format:", events);
      return [];
    }

    const currentDate = new Date();
    const upcomingEvents = events
      .filter((event) => new Date(event.end_date) >= currentDate)
      .sort((a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      )
      .slice(0, 5);

    let allMatches: Match[] = [];

    for (const event of upcomingEvents) {
      console.log(`Fetching matches for event: ${event.name} (${event.key})`);
      try {
        const matchesResponse = await fetch(
          `https://www.thebluealliance.com/api/v3/event/${event.key}/matches`,
          {
            headers: {
              "X-TBA-Auth-Key": TBA_API_KEY!,
            },
          },
        );

        if (!matchesResponse.ok) {
          throw new Error(`Failed to fetch matches: ${matchesResponse.status}`);
        }

        const matches = await matchesResponse.json() as Match[];
        allMatches = allMatches.concat(matches);
        console.log(`Fetched ${matches.length} matches for event ${event.key}`);
      } catch (error) {
        console.error(`Error fetching matches for event ${event.key}:`, error);
      }
    }

    console.log(`Total matches fetched: ${allMatches.length}`);
    return allMatches;
  } catch (error) {
    console.error("Error fetching matches:", error);
    return [];
  }
}

async function insertMatches(matches: Match[]) {
  const { data, error } = await supabase
    .from("matches")
    .insert(matches.map((match) => ({
      id: parseInt(match.key.split("_")[1].substring(2)),
      match_key: match.key,
      match_number: match.match_number,
      match_time: new Date(
        (match.predicted_time || match.time || match.actual_time || 0) * 1000,
      ).toISOString(),
      red_alliance: match.alliances.red.team_keys,
      blue_alliance: match.alliances.blue.team_keys,
      winner: match.winning_alliance || null,
      comp_level: match.comp_level,
      event_key: match.event_key,
      red_score: match.alliances.red.score,
      blue_score: match.alliances.blue.score,
      score_breakdown: match.score_breakdown || null,
      updated_at: new Date().toISOString(),
    })))
    .select();

  if (error) {
    console.error("Error inserting matches:", error);
  } else {
    console.log(`Successfully inserted ${data?.length ?? 0} matches`);
  }
}

async function main() {
  const matches = await fetchUpcomingMatches();
  await insertMatches(matches);
}

main().catch(console.error);
