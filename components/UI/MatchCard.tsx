import {
  Badge,
  Button,
  Card,
  Flex,
  Group,
  Loader,
  Modal,
  NumberInput,
  Progress,
  Slider,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { Match } from "@/types/Match";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconCoins } from "@tabler/icons-react";
import { createClient } from "@/utils/supabase/client";
import { showNotification } from "@mantine/notifications";
import { useRouter } from "next/navigation";

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
  const [betModalOpen, setBetModalOpen] = useState(false);
  const [selectedAlliance, setSelectedAlliance] = useState<
    "red" | "blue" | null
  >(null);
  const [betValue, setBetValue] = useState(1);
  const [userBalance, setUserBalance] = useState(0);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const supabase = createClient();
  const router = useRouter();

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

  const handleBadgeClick = async (
    e: React.MouseEvent,
    alliance: "red" | "blue",
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setSelectedAlliance(alliance);

    const { data: { session }, error: sessionError } = await supabase.auth
      .getSession();
    if (sessionError) {
      console.error("Error fetching session:", sessionError);
      return;
    }

    if (!session) {
      setIsSignedIn(false);
    } else {
      setIsSignedIn(true);
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("points")
        .eq("id", session.user.id)
        .single();

      if (userError) {
        console.error("Error fetching user data:", userError);
        return;
      }

      if (userData) {
        setUserBalance(userData.points);
        setBetValue(1);
      }
    }

    setBetModalOpen(true);
  };

  const handleConfirmBet = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth
        .getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error("No active session");

      const { data, error } = await supabase
        .from("bets")
        .insert({
          user_id: session.user.id,
          match_key: match.match_key,
          alliance: selectedAlliance,
          amount: betValue,
          payout_multiplier: calculatePayout(
            selectedAlliance === "red"
              ? matchStats!.pred.red_win_prob
              : 1 - matchStats!.pred.red_win_prob,
          ),
        })
        .select()
        .single();

      if (error) throw error;

      // Update user balance
      const { error: updateError } = await supabase
        .from("users")
        .update({ points: userBalance - betValue })
        .eq("id", session.user.id);

      if (updateError) throw updateError;

      setUserBalance(userBalance - betValue);
      setBetValue(1);

      showNotification({
        title: "Bet Placed",
        message: (
          <>
            You have placed a bet of{" "}
            <IconCoins
              size={16}
              style={{ display: "inline-block", verticalAlign: "text-bottom" }}
            />{" "}
            {betValue} on the {selectedAlliance?.toUpperCase()} alliance.
          </>
        ),
        color: "green",
      });
    } catch (error) {
      console.error("Error placing bet:", error);
      showNotification({
        title: "Error",
        message: (
          <>
            Failed to place bet. Please try again.{" "}
            <IconCoins
              size={16}
              style={{ display: "inline-block", verticalAlign: "text-bottom" }}
            />
          </>
        ),
        color: "red",
      });
    }
    setBetModalOpen(false);
  };

  return (
    <>
      <Link
        href={`/match/${match.match_key}`}
        passHref
        style={{ textDecoration: "none" }}
      >
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="xs">
            <Group justify="space-between" align="center">
              <Text fw={500}>
                {matchStats
                  ? matchStats.match_name
                  : `Qual ${match.match_number}`}
              </Text>
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
                          <Badge
                            color="red"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => handleBadgeClick(e, "red")}
                          >
                            {calculatePayout(matchStats.pred.red_win_prob)}x
                          </Badge>
                          <Badge
                            color="blue"
                            style={{ cursor: "pointer" }}
                            onClick={(e) => handleBadgeClick(e, "blue")}
                          >
                            {calculatePayout(1 - matchStats.pred.red_win_prob)}x
                          </Badge>
                        </Flex>
                      </>
                    )}
                  </Stack>
                )
                : (
                  <Text size="sm" c="dimmed" m="md">
                    Failed to load match stats
                  </Text>
                )}

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

      <Modal
        opened={betModalOpen}
        onClose={() => setBetModalOpen(false)}
        title={
          <Text>
            Place Bet on{" "}
            <Text
              component="span"
              c={selectedAlliance === "red" ? "red" : "blue"}
            >
              {selectedAlliance === "red" ? "RED" : "BLUE"} Alliance
            </Text>
            {" "}for match {match.match_key}
          </Text>
        }
      >
        {isSignedIn
          ? (
            <>
              <Text mb="md">
                Your Balance: <IconCoins size={16} /> {userBalance}
              </Text>
              <NumberInput
                value={betValue}
                onChange={(value) =>
                  setBetValue(Math.min(Number(value), userBalance))}
                min={1}
                max={userBalance}
                label="Bet Amount"
                leftSection={<IconCoins size={16} />}
              />
              <Slider
                value={betValue}
                onChange={(value) => setBetValue(value)}
                min={1}
                max={userBalance}
                step={1}
                label={(value) => `${value}`}
                color="gray"
                mt="md"
                mb="md"
              />
              <Group justify="center" mt="md">
                <Button
                  variant="outline"
                  color="gray"
                  onClick={() =>
                    setBetValue(Math.min(betValue * 2, userBalance))}
                >
                  2x
                </Button>
                <Button
                  variant="outline"
                  color="gray"
                  onClick={() =>
                    setBetValue(Math.max(Math.floor(betValue * 0.5), 1))}
                >
                  0.5x
                </Button>
                <Button
                  variant="outline"
                  color="gray"
                  onClick={() => setBetValue(userBalance)}
                >
                  Max
                </Button>
              </Group>
              <Text mt="md">
                Potential Payout: <IconCoins size={16} />
                {(Number(calculatePayout(
                  selectedAlliance === "red"
                    ? matchStats!.pred.red_win_prob
                    : 1 - matchStats!.pred.red_win_prob,
                )) * betValue).toFixed(0)}
              </Text>
              <Group mt="xl">
                <Button
                  variant="outline"
                  onClick={() => setBetModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  color={selectedAlliance || "blue"}
                  onClick={handleConfirmBet}
                >
                  Place Bet
                </Button>
              </Group>
            </>
          )
          : (
            <>
              <Text mb="xl">Please sign in to place a bet.</Text>
              <Button onClick={() => router.push("/login")}>Go to Login</Button>
            </>
          )}
      </Modal>
    </>
  );
}
