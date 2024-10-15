"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
    Badge,
    Button,
    Card,
    Container,
    Flex,
    Grid,
    Group,
    Modal,
    NumberInput,
    Paper,
    SimpleGrid,
    Skeleton,
    Slider,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import Link from "next/link";
import {
    IconChevronLeft,
    IconChevronRight,
    IconCoins,
    IconGripVertical,
} from "@tabler/icons-react";
import { clamp, useMediaQuery } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";

interface MatchStats {
    key: string;
    event: string;
    match_name: string;
    time: number;
    pred: {
        red_win_prob: number;
        red_score: number;
        blue_score: number;
    };
    result?: {
        red_score: number;
        blue_score: number;
    };
    alliances: {
        red: { team_keys: string[] };
        blue: { team_keys: string[] };
    };
}

interface TeamInfo {
    team: number;
    name: string;
    norm_epa: {
        current: number;
    };
}

interface EventInfo {
    name: string;
    video: string;
}

export default function MatchPage(
    { params }: { params: { match_key: string } },
) {
    const [matchStats, setMatchStats] = useState<MatchStats | null>(null);
    const [teamInfo, setTeamInfo] = useState<Record<string, TeamInfo>>({});
    const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [betValue, setBetValue] = useState(1);
    const [userBalance, setUserBalance] = useState(0);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedAlliance, setSelectedAlliance] = useState<
        "red" | "blue" | null
    >(null);
    const supabase = createClient();
    const router = useRouter();

    const isMobile = useMediaQuery("(max-width: 768px)");
    const labelFloating = betValue < 0.2 || betValue > 0.8;

    useEffect(() => {
        const fetchMatchStats = async () => {
            try {
                const response = await fetch(
                    `https://api.statbotics.io/v3/match/${params.match_key}`,
                );
                if (!response.ok) {
                    throw new Error("Network response was not ok");
                }
                const data = await response.json();
                setMatchStats(data);

                const eventResponse = await fetch(
                    `https://api.statbotics.io/v3/event/${data.event}`,
                );
                if (!eventResponse.ok) {
                    throw new Error("Network response was not ok");
                }
                const eventData = await eventResponse.json();
                setEventInfo(eventData);

                const allTeams = [
                    ...data.alliances.red.team_keys,
                    ...data.alliances.blue.team_keys,
                ];
                const teamPromises = allTeams.map((team) =>
                    fetch(`https://api.statbotics.io/v3/team/${team}`).then(
                        (res) => res.json(),
                    )
                );
                const teamData = await Promise.all(teamPromises);
                const teamInfoMap = teamData.reduce(
                    (acc: Record<string, TeamInfo>, team: TeamInfo) => {
                        acc[team.team.toString()] = team;
                        return acc;
                    },
                    {},
                );
                setTeamInfo(teamInfoMap);
            } catch (error) {
                console.error("Error fetching match stats:", error);
            } finally {
                setLoading(false);
            }
        };

        const fetchUserBalance = async () => {
            const { data: { session }, error: sessionError } = await supabase
                .auth.getSession();
            if (sessionError) {
                console.error("Error fetching session:", sessionError);
                return;
            }

            if (!session) {
                console.warn("No active session");
                router.push("/login");
                return;
            }

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
        };

        fetchMatchStats();
        fetchUserBalance();
    }, [params.match_key, supabase, router]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    const calculatePayout = (winProbability: number) => {
        return parseFloat((1 / winProbability).toFixed(2));
    };

    const handleBetChange = (value: number) => {
        const newBetValue = clamp(value, 1, userBalance);
        setBetValue(Math.round(newBetValue));
    };

    const handleBetClick = (alliance: "red" | "blue") => {
        setSelectedAlliance(alliance);
        setConfirmModalOpen(true);
    };

    const handleConfirmBet = () => {
        if (selectedAlliance) {
            console.log(
                `Bet placed on ${selectedAlliance.toUpperCase()} alliance for ${betValue}`,
            );
            showNotification({
                title: "Bet Placed",
                message: (
                    <>
                        You have placed a bet of{" "}
                        <IconCoins
                            size={16}
                            style={{ marginLeft: "2px" }}
                        />
                        {betValue} on the {selectedAlliance.toUpperCase()}{" "}
                        alliance.
                    </>
                ),
                color: "green",
            });
        }
        setConfirmModalOpen(false);
        setSelectedAlliance(null);
    };

    const isBettingAllowed = matchStats &&
        (matchStats.time * 1000 - currentTime > 5 * 60 * 1000);

    if (loading) {
        return (
            <Container size="lg" p={isMobile ? "xs" : "xl"}>
                <Paper p={isMobile ? "sm" : "xl"} withBorder={false}>
                    <Flex align="center" justify="space-between" mb="lg">
                        <Skeleton height={24} width={24} circle />
                        <Skeleton height={32} width="60%" />
                        <Skeleton height={24} width={24} circle />
                    </Flex>
                    <Skeleton height={24} width="40%" mb="md" mx="auto" />

                    <Flex justify="space-around" align="center" mb="xl">
                        <Stack align="center" gap="xs">
                            <Skeleton height={32} width={100} />
                            <Skeleton height={16} width={80} />
                        </Stack>

                        <Stack align="center" gap="xs">
                            <Skeleton height={32} width={50} />
                            <Skeleton height={16} width={80} />
                        </Stack>

                        <Stack align="center" gap="xs">
                            <Skeleton height={32} width={100} />
                            <Skeleton height={16} width={80} />
                        </Stack>
                    </Flex>

                    <Flex justify="space-around" align="center" mb="xl">
                        <Skeleton height={16} width={150} />
                        <Skeleton height={16} width={200} />
                        <Skeleton height={16} width={150} />
                    </Flex>

                    <Group mb="xl" justify="center">
                        <Skeleton height={24} width={120} />
                        <Skeleton height={24} width={120} />
                        <Skeleton height={24} width={120} />
                    </Group>

                    <Stack align="center" mb="xl">
                        <Skeleton height={24} width={200} />
                        <Group>
                            <Skeleton height={36} width={120} />
                            <Skeleton height={36} width={60} />
                            <Skeleton height={36} width={60} />
                            <Skeleton height={36} width={60} />
                        </Group>
                        <Skeleton height={16} width="80%" radius="xl" />
                    </Stack>

                    <SimpleGrid cols={isMobile ? 1 : 2} m="xl">
                        <Skeleton height={48} radius="md" />
                        <Skeleton height={48} radius="md" />
                    </SimpleGrid>

                    <Grid>
                        <Grid.Col span={isMobile ? 12 : 6}>
                            <Skeleton height={24} width="40%" mb="md" />
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} height={120} radius="md" mb="md" />
                            ))}
                        </Grid.Col>
                        <Grid.Col span={isMobile ? 12 : 6}>
                            <Skeleton height={24} width="40%" mb="md" />
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} height={120} radius="md" mb="md" />
                            ))}
                        </Grid.Col>
                    </Grid>
                </Paper>
            </Container>
        );
    }

    if (!matchStats) {
        return (
            <Container size="lg" p="xl">
                <Text>Failed to load match data.</Text>
            </Container>
        );
    }

    const blueWinProb = 1 - matchStats.pred.red_win_prob;

    return (
        <Container size="lg" p={isMobile ? "xs" : "xl"}>
            <Paper p={isMobile ? "sm" : "xl"} withBorder={false}>
                <Flex align="center" justify="space-between" mb="lg">
                    <IconChevronLeft
                        size={24}
                        style={{ visibility: "hidden" }}
                    />
                    <Title order={2} ta="center">
                        {matchStats.match_name} -{" "}
                        {eventInfo ? eventInfo.name : matchStats.event}
                    </Title>
                    <IconChevronRight
                        size={24}
                        style={{ visibility: "hidden" }}
                    />
                </Flex>

                <Title order={3} ta="center" mb="md">Summary</Title>

                <Flex 
                    direction={isMobile ? "column" : "row"} 
                    justify="space-around" 
                    align="center" 
                    mb="xl"
                    gap={isMobile ? "md" : "xs"}
                >
                    <Stack align="center" gap="xs">
                        <Text size="xl" fw={700}>
                            <span style={{ color: "var(--mantine-color-red-filled)" }}>
                                {matchStats.pred.red_score.toFixed(0)}
                            </span>
                            {" - "}
                            <span style={{ color: "var(--mantine-color-blue-filled)" }}>
                                {matchStats.pred.blue_score.toFixed(0)}
                            </span>
                        </Text>
                        <Text size="sm">Projected Score</Text>
                    </Stack>

                    <Stack align="center" gap="xs">
                        <Text
                            size="xl"
                            fw={700}
                            color={blueWinProb > matchStats.pred.red_win_prob ? "blue" : "red"}
                        >
                            {blueWinProb > matchStats.pred.red_win_prob
                                ? `${(blueWinProb * 100).toFixed(0)}%`
                                : `${(matchStats.pred.red_win_prob * 100).toFixed(0)}%`}
                        </Text>
                        <Text size="sm">Win Probability</Text>
                    </Stack>

                    {matchStats.result && (
                        <Stack align="center" gap="xs">
                            <Text size="xl" fw={700}>
                                <span style={{ color: "var(--mantine-color-red-filled)" }}>
                                    {matchStats.result.red_score}
                                </span>
                                {" - "}
                                <span style={{ color: "var(--mantine-color-blue-filled)" }}>
                                    {matchStats.result.blue_score}
                                </span>
                            </Text>
                            <Text size="sm">Actual Score</Text>
                        </Stack>
                    )}
                </Flex>

                <Flex 
                    direction={isMobile ? "column" : "row"} 
                    justify="space-around" 
                    align="center" 
                    mb="xl"
                    gap={isMobile ? "md" : "xs"}
                >
                    <Stack align="center" gap="xs">
                        <Text fw={500} ta="center">
                            Projected Winner:{" "}
                            <span style={{
                                color: matchStats.pred.blue_score > matchStats.pred.red_score
                                    ? "var(--mantine-color-blue-filled)"
                                    : "var(--mantine-color-red-filled)",
                            }}>
                                {matchStats.pred.blue_score > matchStats.pred.red_score ? "BLUE" : "RED"}
                            </span>
                        </Text>
                    </Stack>

                    <Stack align="center" gap="xs">
                        <Text fw={500} ta="center">
                            Payout:{" "}
                            <span style={{ color: "var(--mantine-color-red-filled)" }}>
                                Red {calculatePayout(matchStats.pred.red_win_prob)}x
                            </span>
                            {" | "}
                            <span style={{ color: "var(--mantine-color-blue-filled)" }}>
                                Blue {calculatePayout(blueWinProb)}x
                            </span>
                        </Text>
                    </Stack>

                    {matchStats.result && (
                        <Stack align="center" gap="xs">
                            <Text fw={500} ta="center">
                                Actual Winner:{" "}
                                <span style={{
                                    color: matchStats.result.red_score > matchStats.result.blue_score
                                        ? "var(--mantine-color-red-filled)"
                                        : "var(--mantine-color-blue-filled)",
                                }}>
                                    {matchStats.result.red_score > matchStats.result.blue_score ? "RED" : "BLUE"}
                                </span>
                            </Text>
                        </Stack>
                    )}
                </Flex>

                <Group mb="xl" justify="center">
                    <Link
                        href={`https://www.statbotics.io/match/${params.match_key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Badge color="gray" variant="light">
                            View on Statbotics
                        </Badge>
                    </Link>
                    <Link
                        href={`https://www.thebluealliance.com/match/${params.match_key}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Badge color="gray" variant="light">View on TBA</Badge>
                    </Link>
                    {eventInfo && eventInfo.video && (
                        <Link
                            href={eventInfo.video}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Badge color="gray" variant="light">
                                Watch Video
                            </Badge>
                        </Link>
                    )}
                </Group>

                {isBettingAllowed
                    ? (
                        <>
                            <Container>
                                <Text fw={700} mb="md" ta="center">
                                    Balance:{" "}
                                    <IconCoins
                                        size={16}
                                        style={{ marginRight: 4, marginLeft: 4 }}
                                    />
                                    {userBalance}
                                </Text>
                                <Group justify="center">
                                    <NumberInput
                                        value={betValue}
                                        onChange={(value) =>
                                            setBetValue(
                                                clamp(
                                                    Number(value),
                                                    1,
                                                    userBalance,
                                                ),
                                            )}
                                        min={1}
                                        max={userBalance}
                                        step={1}
                                        allowNegative={false}
                                        allowDecimal={false}
                                        thousandSeparator=" "
                                        leftSection={<IconCoins size={16} />}
                                    />
                                    <Button
                                        variant="outline"
                                        color="gray"
                                        onClick={() =>
                                            setBetValue(
                                                Math.min(
                                                    betValue * 2,
                                                    userBalance,
                                                ),
                                            )}
                                    >
                                        2x
                                    </Button>
                                    <Button
                                        variant="outline"
                                        color="gray"
                                        onClick={() =>
                                            setBetValue(
                                                Math.max(
                                                    Math.floor(betValue * 0.5),
                                                    1,
                                                ),
                                            )}
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
                                <Slider
                                    value={betValue}
                                    onChange={handleBetChange}
                                    min={1}
                                    max={userBalance}
                                    step={1}
                                    color="gray"
                                    m="sm"
                                />
                            </Container>

                            <SimpleGrid cols={isMobile ? 1 : 2} m="xl">
                                <Button
                                    size="lg"
                                    color="red"
                                    w="100%"
                                    onClick={() => handleBetClick("red")}
                                >
                                    Bet Red
                                </Button>
                                <Button
                                    size="lg"
                                    color="blue"
                                    w="100%"
                                    onClick={() => handleBetClick("blue")}
                                >
                                    Bet Blue
                                </Button>
                            </SimpleGrid>

                            <Modal
                                opened={confirmModalOpen}
                                onClose={() => setConfirmModalOpen(false)}
                                title="Confirm Bet"
                            >
                                {selectedAlliance && (
                                    <>
                                        <Text>
                                            Are you sure you want to place a bet
                                            of{" "}
                                            <IconCoins
                                                size={16}
                                                style={{ marginRight: 4, marginLeft: 4 }}
                                            />
                                            {betValue} on the{" "}
                                            <span style={{ color: `var(--mantine-color-${selectedAlliance}-filled)` }}>
                                                {selectedAlliance.toUpperCase()}
                                            </span>
                                            {" "}
                                            alliance?
                                        </Text>
                                        <Text mt="md">
                                            Potential payout:{" "}
                                            <IconCoins
                                                size={16}
                                                style={{ marginRight: 4, marginLeft: 4 }}
                                            />
                                            {(calculatePayout(
                                                selectedAlliance === "red"
                                                    ? matchStats.pred
                                                        .red_win_prob
                                                    : blueWinProb,
                                            ) * betValue).toFixed(0)}
                                        </Text>
                                        <Group mt="xl">
                                            <Button
                                                variant="outline"
                                                color="gray"
                                                onClick={() =>
                                                    setConfirmModalOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                color={selectedAlliance}
                                                onClick={handleConfirmBet}
                                            >
                                                Confirm Bet
                                            </Button>
                                        </Group>
                                    </>
                                )}
                            </Modal>
                        </>
                    )
                    : (
                        <Text ta="center" fw={700} mt="xl" mb="xl">
                            Betting is closed for this match
                        </Text>
                    )}

                {/* Alliances Display */}
                <Grid>
                    <Grid.Col span={isMobile ? 12 : 6}>
                        <Title order={3}>Red Alliance</Title>
                        {matchStats.alliances.red.team_keys.map((team) => (
                            <Card
                                key={team}
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                withBorder
                                mt="md"
                            >
                                <Title order={4}>
                                    <Link
                                        href={`/team/${team}`}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Badge
                                            color="red"
                                            variant="light"
                                            size="lg"
                                            mb="md"
                                        >
                                            Team {team} - {teamInfo[team]?.name}
                                        </Badge>
                                    </Link>
                                </Title>
                                {teamInfo[team] && (
                                    <>
                                        <Text>
                                            Current EPA:{" "}
                                            {teamInfo[team].norm_epa.current
                                                .toFixed(0)}
                                        </Text>
                                    </>
                                )}
                            </Card>
                        ))}
                    </Grid.Col>
                    <Grid.Col span={isMobile ? 12 : 6}>
                        <Title order={3}>Blue Alliance</Title>
                        {matchStats.alliances.blue.team_keys.map((team) => (
                            <Card
                                key={team}
                                shadow="sm"
                                padding="lg"
                                radius="md"
                                withBorder
                                mt="md"
                            >
                                <Title order={4}>
                                    <Link
                                        href={`/team/${team}`}
                                        style={{ textDecoration: "none" }}
                                    >
                                        <Badge
                                            color="blue"
                                            variant="light"
                                            size="lg"
                                            mb="md"
                                        >
                                            Team {team} - {teamInfo[team]?.name}
                                        </Badge>
                                    </Link>
                                </Title>
                                {teamInfo[team] && (
                                    <>
                                        <Text>
                                            Current EPA:{" "}
                                            {teamInfo[team].norm_epa.current
                                                .toFixed(0)}
                                        </Text>
                                    </>
                                )}
                            </Card>
                        ))}
                    </Grid.Col>
                </Grid>
            </Paper>
        </Container>
    );
}
