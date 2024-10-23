import {
    Badge,
    Container,
    Group,
    Paper,
    Stack,
    Text,
    Title,
  } from "@mantine/core";
  import { IconCoins } from "@tabler/icons-react";
  import Link from "next/link";
  
  interface MatchInfo {
    match_name: string;
    event: string;
  }
  
  interface EventInfo {
    name: string;
  }
  
  interface Bet {
    id: string;
    match_key: string;
    alliance: string;
    status: string;
    amount: number;
    payout_multiplier: number;
    created_at: string;
  }
  
  interface PortfolioComponentProps {
    handle?: string;
    points: number;
    bets: Bet[];
  }
  
  export default async function PortfolioComponent({ handle, points, bets }: PortfolioComponentProps) {
    // Fetch match and event info for all bets
    const matchInfoPromises = bets.map(async (bet) => {
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
    });
  
    const matchInfos = await Promise.all(matchInfoPromises);
    const matchInfoMap = Object.fromEntries(
      matchInfos.map((info) => [info.match_key, info]),
    );
  
    return (
      <Container size="lg" p="xl">
        <Title mb="xl">{handle ? `@${handle}'s Portfolio` : 'Portfolio'}</Title>
        <Title order={2} ta="center" mb="xl">
          Balance -
          <IconCoins size={32} style={{ marginLeft: "10px" }} />
          {points}
        </Title>
        {bets.length > 0 ? (
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
                      <Text size="xl">
                        <IconCoins size={16} style={{ display: "inline" }} />
                        {bet.amount}
                      </Text>
                      <Text
                        color={bet.alliance === "red" ? "red" : "blue"}
                        fw={700}
                        size="xl"
                      >
                        x {bet.payout_multiplier}
                      </Text>
                      <Text
                        c={bet.status === "won" ? undefined : "dimmed"}
                        style={bet.status === "lost"
                          ? { textDecoration: "line-through" }
                          : undefined}
                        size="xl"
                      >
                        <IconCoins size={16} style={{ display: "inline" }} />
                        {(bet.amount * bet.payout_multiplier).toFixed(0)}
                      </Text>
                    </Group>
                  </Group>
                  <Text size="xs" c="dimmed" mt="xs">
                    Placed on: {new Date(bet.created_at).toLocaleString()}
                  </Text>
                </Paper>
              </Link>
            ))}
          </Stack>
        ) : (
          <Text>{handle ? "This user hasn't" : "You haven't"} placed any bets yet.</Text>
        )}
      </Container>
    );
  }