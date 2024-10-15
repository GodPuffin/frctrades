import {
    Badge,
    Container,
    Group,
    Paper,
    Stack,
    Text,
    Title,
  } from "@mantine/core";
  import { createClient } from "@/utils/supabase/server";
  import { IconCoins } from "@tabler/icons-react";
  import { notFound } from "next/navigation";
  import Link from "next/link";
  
  interface MatchInfo {
    match_name: string;
    event: string;
  }
  
  interface EventInfo {
    name: string;
  }
  
  export default async function UserPortfolioPage({ params }: { params: { handle: string } }) {
    const supabase = createClient();
  
    // Fetch the user based on the handle
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, points, handle")
      .eq("handle", params.handle)
      .single();
  
    if (userError || !userData) {
      notFound();
    }
  
    // Fetch all bets for the specified user
    const { data: bets, error } = await supabase
      .from("bets")
      .select("*")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false });
  
    if (error) {
      console.error("Error fetching bets:", error);
      return (
        <Container size="lg" p="xl">
          <Title>Error loading portfolio</Title>
          <Text>
            There was an error loading the bets. Please try again later.
          </Text>
        </Container>
      );
    }
  
    // Fetch match and event info for all bets
    const matchInfoPromises = bets?.map(async (bet) => {
      const matchResponse = await fetch(
        `https://api.statbotics.io/v3/match/${bet.match_key}`,
      );
      if (!matchResponse.ok) {
        console.error(`Error fetching match info for ${bet.match_key}`);
        return {
          match_key: bet.match_key,
          match_name: "Unknown Match",
          event_name: "Unknown Event",
        };
      }
      const matchData: MatchInfo = await matchResponse.json();
  
      const eventResponse = await fetch(
        `https://api.statbotics.io/v3/event/${matchData.event}`,
      );
      if (!eventResponse.ok) {
        console.error(`Error fetching event info for ${matchData.event}`);
        return {
          match_key: bet.match_key,
          match_name: matchData.match_name,
          event_name: "Unknown Event",
        };
      }
      const eventData: EventInfo = await eventResponse.json();
  
      return {
        match_key: bet.match_key,
        match_name: matchData.match_name,
        event_name: eventData.name,
      };
    }) || [];
  
    const matchInfos = await Promise.all(matchInfoPromises);
    const matchInfoMap = Object.fromEntries(
      matchInfos.map((info) => [info.match_key, info]),
    );
  
    return (
      <Container size="lg" p="xl">
        <Title mb="xl">@{userData.handle}'s Portfolio</Title>
        <Title order={2} ta="center" mb="xl">
          Balance -
          <IconCoins size={32} style={{ marginLeft: "10px" }} />
          {userData.points}
        </Title>
        {bets && bets.length > 0
          ? (
            <Stack gap="md">
              {bets.map((bet) => (
                <Link
                  href={`/match/${bet.match_key}`}
                  key={bet.id}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <Paper p="md" withBorder style={{ cursor: "pointer" }}>
                    <Group justify="space-between" mb="xs">
                      <Group>
                        <Text fw={500}>
                          {matchInfoMap[bet.match_key].event_name},{" "}
                          {matchInfoMap[bet.match_key].match_name}
                        </Text>
                        <Badge color={bet.alliance === "red" ? "red" : "blue"}>
                          {bet.alliance.toUpperCase()} ALLIANCE
                        </Badge>
                      </Group>
                      <Badge
                        color={bet.status === "pending"
                          ? "yellow"
                          : bet.status === "won"
                          ? "green"
                          : "red"}
                      >
                        {bet.status.toUpperCase()}
                      </Badge>
                    </Group>
                    <Group justify="center" align="center">
                      <Group gap="xs">
                        <Text>
                          <IconCoins size={16} style={{ display: "inline" }} />
                          {bet.amount}
                        </Text>
                        <Text
                          color={bet.alliance === "red" ? "red" : "blue"}
                          fw={700}
                        >
                          x {bet.payout_multiplier}
                        </Text>
                        <Text c={bet.status === "won" ? undefined : "dimmed"}>
                          <IconCoins size={16} style={{ display: "inline" }} />
                          {(bet.amount * bet.payout_multiplier).toFixed(0)}
                        </Text>
                      </Group>
                    </Group>
                    <Text size="xs" color="dimmed" mt="xs">
                      Placed on: {new Date(bet.created_at).toLocaleString()}
                    </Text>
                  </Paper>
                </Link>
              ))}
            </Stack>
          )
          : <Text>This user hasn't placed any bets yet.</Text>}
      </Container>
    );
  }