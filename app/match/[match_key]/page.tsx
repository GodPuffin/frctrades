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
    Paper,
    Progress,
    SimpleGrid,
    Skeleton,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import Link from "next/link";
import {
    IconCheck,
    IconChevronLeft,
    IconChevronRight,
    IconCoins,
    IconGripVertical,
} from "@tabler/icons-react";
import { clamp, useMediaQuery, useMove } from "@mantine/hooks";
import { showNotification } from "@mantine/notifications";
import classes from "../slider.module.css";

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
    const [betValue, setBetValue] = useState(0.1);
    const [userBalance, setUserBalance] = useState(0);
    const [betAmount, setBetAmount] = useState(10);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const supabase = createClient();
    const router = useRouter();

    const { ref } = useMove(({ x }) => handleBetChange(x));
    const isMobile = useMediaQuery("(max-width: 768px)");
    const labelFloating = betValue < 0.2 || betValue > 0.8;

    const redAnimating = useRef(false);
    const redAnimationFrame = useRef<number | null>(null);
    const redStartTime = useRef<number | null>(null);

    const blueAnimating = useRef(false);
    const blueAnimationFrame = useRef<number | null>(null);
    const blueStartTime = useRef<number | null>(null);

    const [redHoldProgress, setRedHoldProgress] = useState(0);
    const [blueHoldProgress, setBlueHoldProgress] = useState(0);
    const [redBetPlaced, setRedBetPlaced] = useState(false);
    const [blueBetPlaced, setBlueBetPlaced] = useState(false);

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

    const handleBetChange = (x: number) => {
        const newBetValue = clamp(x, 0.1, 0.9);
        setBetValue(newBetValue);
        const newBetAmount = Math.round(
            ((newBetValue - 0.1) * (100 - 10)) / (0.9 - 0.1) + 10,
        );
        setBetAmount(newBetAmount);
    };

    const handleBetHoldStart = useCallback((alliance: "red" | "blue") => {
        if (alliance === "red") {
            if (redAnimating.current) return;
            redAnimating.current = true;
            redStartTime.current = performance.now();

            const animate = (timestamp: number) => {
                if (!redStartTime.current) redStartTime.current = timestamp;
                const elapsed = timestamp - redStartTime.current;
                redStartTime.current = timestamp;
                const delta = (elapsed / 3000) * 100;

                setRedHoldProgress((prevProgress) => {
                    const newProgress = clamp(prevProgress + delta, 0, 100);
                    if (newProgress >= 100) {
                        redAnimating.current = false;
                        setRedBetPlaced(true);
                        setTimeout(() => {
                            setRedHoldProgress(0);
                            setRedBetPlaced(false);
                        }, 500);

                        console.log(
                            `Bet placed on RED alliance for ${betAmount}`,
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
                                    {betAmount} on the RED alliance.
                                </>
                            ),
                            color: "green",
                        });
                        return 0;
                    }
                    return newProgress;
                });

                if (redAnimating.current) {
                    redAnimationFrame.current = requestAnimationFrame(animate);
                }
            };

            redAnimationFrame.current = requestAnimationFrame(animate);
        } else if (alliance === "blue") {
            if (blueAnimating.current) return;
            blueAnimating.current = true;
            blueStartTime.current = performance.now();

            const animate = (timestamp: number) => {
                if (!blueStartTime.current) blueStartTime.current = timestamp;
                const elapsed = timestamp - blueStartTime.current;
                blueStartTime.current = timestamp;
                const delta = (elapsed / 3000) * 100;

                setBlueHoldProgress((prevProgress) => {
                    const newProgress = clamp(prevProgress + delta, 0, 100);
                    if (newProgress >= 100) {
                        blueAnimating.current = false;
                        setBlueBetPlaced(true);
                        setTimeout(() => {
                            setBlueHoldProgress(0);
                            setBlueBetPlaced(false);
                        }, 500);

                        console.log(
                            `Bet placed on BLUE alliance for ${betAmount}`,
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
                                    {betAmount} on the BLUE alliance.
                                </>
                            ),
                            color: "green",
                        });
                        return 0;
                    }
                    return newProgress;
                });

                if (blueAnimating.current) {
                    blueAnimationFrame.current = requestAnimationFrame(animate);
                }
            };

            blueAnimationFrame.current = requestAnimationFrame(animate);
        }
    }, [betAmount]);

    const handleBetHoldEnd = useCallback((alliance: "red" | "blue") => {
        if (alliance === "red") {
            if (!redAnimating.current) return;
            redAnimating.current = false;
            if (redAnimationFrame.current) {
                cancelAnimationFrame(redAnimationFrame.current);
            }

            const animateReverse = (timestamp: number) => {
                if (!redStartTime.current) redStartTime.current = timestamp;
                const elapsed = timestamp - redStartTime.current;
                redStartTime.current = timestamp;
                const delta = (elapsed / 3000) * 100;

                setRedHoldProgress((prevProgress) => {
                    const newProgress = clamp(prevProgress - delta, 0, 100);
                    if (newProgress > 0) {
                        redAnimationFrame.current = requestAnimationFrame(
                            animateReverse,
                        );
                    }
                    return newProgress;
                });
            };

            redAnimationFrame.current = requestAnimationFrame(animateReverse);
        } else if (alliance === "blue") {
            if (!blueAnimating.current) return;
            blueAnimating.current = false;
            if (blueAnimationFrame.current) {
                cancelAnimationFrame(blueAnimationFrame.current);
            }

            const animateReverse = (timestamp: number) => {
                if (!blueStartTime.current) blueStartTime.current = timestamp;
                const elapsed = timestamp - blueStartTime.current;
                blueStartTime.current = timestamp;
                const delta = (elapsed / 3000) * 100;

                setBlueHoldProgress((prevProgress) => {
                    const newProgress = clamp(prevProgress - delta, 0, 100);
                    if (newProgress > 0) {
                        blueAnimationFrame.current = requestAnimationFrame(
                            animateReverse,
                        );
                    }
                    return newProgress;
                });
            };

            blueAnimationFrame.current = requestAnimationFrame(animateReverse);
        }
    }, []);

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
                    <Flex align="center" justify="center">
                        <Skeleton height={24} width="40%" mb="md" />
                    </Flex>

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
                        <Stack align="center" gap="xs">
                            <Skeleton height={16} width={150} />
                        </Stack>

                        <Stack align="center" gap="xs">
                            <Skeleton height={16} width={200} />
                        </Stack>

                        <Stack align="center" gap="xs">
                            <Skeleton height={16} width={150} />
                        </Stack>
                    </Flex>

                    <Group mb="xl" justify="center">
                        <Skeleton height={24} width={150} />
                        <Skeleton height={24} width={150} />
                    </Group>

                    {/* New skeleton for betting slider */}
                    <Skeleton height={40} radius="xl" mb="xl" />

                    {/* New skeleton for betting buttons */}
                    <SimpleGrid cols={isMobile ? 1 : 2} m="xl">
                        <Skeleton height={40} radius="md" />
                        <Skeleton height={40} radius="md" />
                    </SimpleGrid>

                    <Grid>
                        <Grid.Col span={isMobile ? 12 : 6}>
                            <Skeleton height={24} width="40%" mb="md" />
                            <Skeleton height={150} radius="md" mb="md" />
                            <Skeleton height={150} radius="md" />
                        </Grid.Col>
                        <Grid.Col span={isMobile ? 12 : 6}>
                            <Skeleton height={24} width="40%" mb="md" />
                            <Skeleton height={150} radius="md" mb="md" />
                            <Skeleton height={150} radius="md" />
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

                <Flex justify="space-around" align="center" mb="xl">
                    <Stack align="center" gap="xs">
                        <Text size="xl" fw={700}>
                            <span
                                style={{
                                    color: "var(--mantine-color-red-filled)",
                                }}
                            >
                                {matchStats.pred.red_score.toFixed(0)}
                            </span>
                            {" - "}
                            <span
                                style={{
                                    color: "var(--mantine-color-blue-filled)",
                                }}
                            >
                                {matchStats.pred.blue_score.toFixed(0)}
                            </span>
                        </Text>
                        <Text size="sm">Projected Score</Text>
                    </Stack>

                    <Stack align="center" gap="xs">
                        <Text
                            size="xl"
                            fw={700}
                            color={blueWinProb > matchStats.pred.red_win_prob
                                ? "blue"
                                : "red"}
                        >
                            {blueWinProb > matchStats.pred.red_win_prob
                                ? `${(blueWinProb * 100).toFixed(0)}%`
                                : `${
                                    (matchStats.pred.red_win_prob * 100)
                                        .toFixed(0)
                                }%`}
                        </Text>
                        <Text size="sm">Win Probability</Text>
                    </Stack>

                    {matchStats.result && (
                        <Stack align="center" gap="xs">
                            <Text size="xl" fw={700}>
                                <span
                                    style={{
                                        color:
                                            "var(--mantine-color-red-filled)",
                                    }}
                                >
                                    {matchStats.result.red_score}
                                </span>
                                {" - "}
                                <span
                                    style={{
                                        color:
                                            "var(--mantine-color-blue-filled)",
                                    }}
                                >
                                    {matchStats.result.blue_score}
                                </span>
                            </Text>
                            <Text size="sm">Actual Score</Text>
                        </Stack>
                    )}
                </Flex>

                <Flex justify="space-around" align="center" mb="xl">
                    <Stack align="center" gap="xs">
                        <Text fw={500}>
                            Projected Winner:{" "}
                            <span
                                style={{
                                    color: matchStats.pred.blue_score >
                                            matchStats.pred.red_score
                                        ? "var(--mantine-color-blue-filled)"
                                        : "var(--mantine-color-red-filled)",
                                }}
                            >
                                {matchStats.pred.blue_score >
                                        matchStats.pred.red_score
                                    ? "BLUE"
                                    : "RED"}
                            </span>
                        </Text>
                    </Stack>

                    <Stack align="center" gap="xs">
                        <Text fw={500}>
                            Payout:{" "}
                            <span
                                style={{
                                    color: "var(--mantine-color-red-filled)",
                                }}
                            >
                                Red{" "}
                                {calculatePayout(matchStats.pred.red_win_prob)}x
                            </span>{" "}
                            |{" "}
                            <span
                                style={{
                                    color: "var(--mantine-color-blue-filled)",
                                }}
                            >
                                Blue {calculatePayout(blueWinProb)}x
                            </span>
                        </Text>
                    </Stack>

                    {matchStats.result && (
                        <Stack align="center" gap="xs">
                            <Text fw={500}>
                                Actual Winner:{" "}
                                <span
                                    style={{
                                        color: matchStats.result.red_score >
                                                matchStats.result.blue_score
                                            ? "var(--mantine-color-red-filled)"
                                            : "var(--mantine-color-blue-filled)",
                                    }}
                                >
                                    {matchStats.result.red_score >
                                            matchStats.result.blue_score
                                        ? "RED"
                                        : "BLUE"}
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

                {!isBettingAllowed
                    ? (
                        <>
                            <div className={classes.root}>
                                <div className={classes.track} ref={ref}>
                                    <div
                                        className={classes.filled}
                                        style={{
                                            width: `calc(${
                                                betValue * 100
                                            }% - var(--thumb-width) / 2 - var(--thumb-offset) / 2)`,
                                        }}
                                    >
                                        <span
                                            className={classes.label}
                                            data-floating={labelFloating ||
                                                undefined}
                                            data-filled
                                        >
                                            <span className={classes.nowrap}>
                                                <IconCoins
                                                    size={16}
                                                    style={{ marginRight: 4 }}
                                                />
                                                {betAmount}
                                            </span>
                                        </span>
                                    </div>

                                    <div
                                        className={classes.empty}
                                        style={{
                                            width: `calc(${
                                                (1 - betValue) * 100
                                            }% - var(--thumb-width) / 2 - var(--thumb-offset) / 2)`,
                                        }}
                                    >
                                        <span
                                            className={classes.label}
                                            data-floating={labelFloating ||
                                                undefined}
                                        >
                                            <span className={classes.nowrap}>
                                                <IconCoins
                                                    size={16}
                                                    style={{ marginRight: 4 }}
                                                />
                                                {userBalance - betAmount}
                                            </span>
                                        </span>
                                    </div>

                                    <div
                                        className={classes.thumb}
                                        style={{
                                            left: `calc(${
                                                betValue * 100
                                            }% - var(--thumb-width) / 2)`,
                                        }}
                                    >
                                        <IconGripVertical stroke={1.5} />
                                    </div>
                                </div>
                            </div>

                            <SimpleGrid cols={isMobile ? 1 : 2} m="xl">
                                <Stack>
                                    <Button
                                        size="lg"
                                        color={redBetPlaced ? "green" : "red"}
                                        w="100%"
                                        onMouseDown={() =>
                                            handleBetHoldStart("red")}
                                        onMouseUp={() =>
                                            handleBetHoldEnd("red")}
                                        onMouseLeave={() =>
                                            handleBetHoldEnd("red")}
                                        onTouchStart={() =>
                                            handleBetHoldStart("red")}
                                        onTouchEnd={() =>
                                            handleBetHoldEnd("red")}
                                        style={{
                                            transition:
                                                "background-color 0.3s, color 0.3s",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {redBetPlaced
                                            ? <IconCheck size={24} />
                                            : redHoldProgress > 0
                                            ? (
                                                <>
                                                    <IconCoins size={24} />
                                                    <span>{betAmount}</span>
                                                    <IconChevronRight
                                                        size={24}
                                                    />
                                                    <IconCoins size={24} />
                                                    <span>
                                                        {(calculatePayout(
                                                            matchStats.pred
                                                                .red_win_prob,
                                                        ) * betAmount).toFixed(
                                                            0,
                                                        )}
                                                    </span>
                                                </>
                                            )
                                            : (
                                                "Bet Red"
                                            )}
                                    </Button>
                                    <Progress
                                        value={redHoldProgress}
                                        color="red"
                                        size="sm"
                                    />
                                </Stack>
                                <Stack>
                                    <Button
                                        size="lg"
                                        color={blueBetPlaced ? "green" : "blue"}
                                        w="100%"
                                        onMouseDown={() =>
                                            handleBetHoldStart("blue")}
                                        onMouseUp={() =>
                                            handleBetHoldEnd("blue")}
                                        onMouseLeave={() =>
                                            handleBetHoldEnd("blue")}
                                        onTouchStart={() =>
                                            handleBetHoldStart("blue")}
                                        onTouchEnd={() =>
                                            handleBetHoldEnd("blue")}
                                        style={{
                                            transition:
                                                "background-color 0.3s, color 0.3s",
                                            position: "relative",
                                            overflow: "hidden",
                                        }}
                                    >
                                        {blueBetPlaced
                                            ? <IconCheck size={24} />
                                            : blueHoldProgress > 0
                                            ? (
                                                <>
                                                    <IconCoins size={24} />
                                                    <span>{betAmount}</span>
                                                    <IconChevronRight
                                                        size={24}
                                                    />
                                                    <IconCoins size={24} />
                                                    <span>
                                                        {(calculatePayout(
                                                            blueWinProb,
                                                        ) * betAmount).toFixed(
                                                            0,
                                                        )}
                                                    </span>
                                                </>
                                            )
                                            : (
                                                "Bet Blue"
                                            )}
                                    </Button>
                                    <Progress
                                        value={blueHoldProgress}
                                        color="blue"
                                        size="sm"
                                    />
                                </Stack>
                            </SimpleGrid>
                        </>
                    )
                    : (
                        <Text ta="center" fw={700} mt="xl" mb="xl">
                            Betting is closed for this match
                        </Text>
                    )}

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
                                                .toFixed(2)}
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
                                                .toFixed(2)}
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
