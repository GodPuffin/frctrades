import {
  Badge,
  Card,
  Flex,
  Group,
  Loader,
  Progress,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Match } from "@/types/Match";
import Link from "next/link";
import { useEffect, useState } from "react";

interface MatchCardProps {
  match: Match;
}

interface MatchStats {
  event: string;
  match_name: string;
  pred: {
    red_win_prob: number;
    red_score: number;
    blue_score: number;
  };
  result?: {
    red_score: number;
    blue_score: number;
  };
}

export default function MatchCard({ match }: MatchCardProps) {
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatchStats = async () => {
      try {
        // const response = await fetch(`https://api.statbotics.io/v3/match/${match.match_key}`);
        const response = await fetch(
          `https://api.statbotics.io/v3/match/2023cc_f1m2`,
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setMatchStats(data);
      } catch (error) {
        console.error("Error fetching match stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatchStats();
  }, [match.match_key]);

  const calculatePayout = (winProbability: number) => {
    return (1 / winProbability).toFixed(2);
  };

  return (
    <Link
      href={`/match/${match.match_key}`}
      passHref
      style={{ textDecoration: "none" }}
    >
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fw={500}>{matchStats ? matchStats.match_name : `Qual ${match.match_number}`}</Text>
            <Group gap="xs">
              <Badge
                color="gray"
                c="gray"
                variant="light"
                style={{ cursor: "pointer" }}
              >
                {matchStats ? matchStats.event : match.event_key}
              </Badge>
            </Group>
          </Group>

          <Text size="sm" c="dimmed">
            {new Date(match.match_time) < new Date()
              ? "Match Completed"
              : `Time: ${new Date(match.match_time).toLocaleString()}`}
          </Text>

          <Flex justify="space-between" align="flex-start">
            <Stack gap="xs">
              {[match.red1, match.red2, match.red3].map((team, index) => (
                <Link
                  key={index}
                  href={`/team/${team}`}
                  passHref
                  onClick={(e) => e.stopPropagation()}
                >
                  <Badge
                    color="red"
                    c="red"
                    variant="light"
                    size="lg"
                    style={{ cursor: "pointer" }}
                  >
                    {team}
                  </Badge>
                </Link>
              ))}
            </Stack>

            {loading
              ? <Loader size="md" color="gray" />
              : matchStats
              ? (
                <Stack gap="xs" align="center">
                  <Text size="sm" fw={500}>
                    {matchStats.result ? "Final Score" : "Predicted Score"}
                  </Text>
                  <Progress.Root size={40} w={{ base: 100, sm: 150 }}>
                    <Progress.Section
                      value={(matchStats.result?.red_score ||
                        matchStats.pred.red_score) /
                        ((matchStats.result?.red_score ||
                          matchStats.pred.red_score) +
                          (matchStats.result?.blue_score ||
                            matchStats.pred.blue_score)) *
                        100}
                      color="red"
                    >
                      <Progress.Label>
                        {(matchStats.result?.red_score ||
                          matchStats.pred.red_score).toFixed(0)}
                      </Progress.Label>
                    </Progress.Section>

                    <Progress.Section
                      value={(matchStats.result?.blue_score ||
                        matchStats.pred.blue_score) /
                        ((matchStats.result?.red_score ||
                          matchStats.pred.red_score) +
                          (matchStats.result?.blue_score ||
                            matchStats.pred.blue_score)) *
                        100}
                      color="blue"
                    >
                      <Progress.Label>
                        {(matchStats.result?.blue_score ||
                          matchStats.pred.blue_score).toFixed(0)}
                      </Progress.Label>
                    </Progress.Section>
                  </Progress.Root>
                  {!matchStats.result && (
                    <>
                      <Flex gap="xs">
                        <Badge color="red">
                          {calculatePayout(matchStats.pred.red_win_prob)}x
                        </Badge>
                        <Badge color="blue">
                          {calculatePayout(1 - matchStats.pred.red_win_prob)}x
                        </Badge>
                      </Flex>
                    </>
                  )}
                </Stack>
              )
              : <Text size="sm" c="dimmed" m="md">Failed to load match stats</Text>}

            <Stack gap="xs">
              {[match.blue1, match.blue2, match.blue3].map((team, index) => (
                <Link
                  key={index}
                  href={`/team/${team}`}
                  passHref
                  onClick={(e) => e.stopPropagation()}
                >
                  <Badge
                    color="blue"
                    c="blue"
                    variant="light"
                    size="lg"
                    style={{ cursor: "pointer" }}
                  >
                    {team}
                  </Badge>
                </Link>
              ))}
            </Stack>
          </Flex>
        </Stack>
      </Card>
    </Link>
  );
}
