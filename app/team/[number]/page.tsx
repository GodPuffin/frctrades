"use client";

import { notFound } from "next/navigation";
import {
  Avatar,
  Badge,
  Center,
  Container,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { useEffect, useState } from "react";
import FavoriteTeamButton from "@/components/UI/FavoriteTeamButton";
import MatchCard from "@/components/UI/MatchCard";
import { Match } from "@/types/Match";

async function getTeamInfo(teamNumber: string) {
  const response = await fetch(
    `https://api.statbotics.io/v3/team/${teamNumber}`,
    { next: { revalidate: 3600 } },
  );
  if (!response.ok) {
    return null;
  }
  return await response.json();
}

async function getUpcomingMatches(teamNumber: string) {
  const response = await fetch(
    `/api/matches?teams=${teamNumber}&limit=5&upcoming=true`,
    { next: { revalidate: 3600 } }
  );
  if (!response.ok) {
    return [];
  }
  return await response.json();
}

export default function TeamPage({ params }: { params: { number: string } }) {
  const [teamInfo, setTeamInfo] = useState<any>(null);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);

  useEffect(() => {
    getTeamInfo(params.number).then(setTeamInfo);
    getUpcomingMatches(params.number).then(setUpcomingMatches);
  }, [params.number]);

  if (!teamInfo) {
    return (
      <Center p="xl">
        <Loader />
      </Center>
    );
  }

  return (
    <Container size="md" p="xl">
      <Paper radius="md" p="xl">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group>
              <Title order={1}>{teamInfo.team} - {teamInfo.name}</Title>
              <FavoriteTeamButton teamNumber={Number(teamInfo.team)} />
            </Group>
            <Text size="lg" c="dimmed">
              {teamInfo.city ? teamInfo.city + ", " : ""}
              {teamInfo.state ? teamInfo.state + ", " : ""}
              {teamInfo.country ?? ""}
            </Text>
          </div>
          <Avatar
            src={`https://api.frc-colors.com/internal/team/${teamInfo.team}/avatar.png`}
            alt={`Team ${teamInfo.team} icon`}
            radius="md"
            size="lg"
          />
        </Group>

        <Group mt="md">
          <Badge color="blue">Rookie Year: {teamInfo.rookie_year}</Badge>
          <Badge color={teamInfo.active ? "green" : "red"}>
            {teamInfo.active ? "Active" : "Inactive"}
          </Badge>
          {teamInfo.district && (
            <Badge color="orange">District: {teamInfo.district}</Badge>
          )}
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
          <Stack>
            <Title order={3} mt="xl">Season Record</Title>
            <Text>
              Wins: {teamInfo.record.season.wins}, Losses:{" "}
              {teamInfo.record.season.losses}, Ties:{" "}
              {teamInfo.record.season.ties}
            </Text>
            <Text>
              Winrate: {(teamInfo.record.season.winrate * 100).toFixed(2)}%
            </Text>
          </Stack>
          <Stack>
            <Title order={3} mt="xl">All-Time Record</Title>
            <Text>
              Wins: {teamInfo.record.full.wins}, Losses:{" "}
              {teamInfo.record.full.losses}, Ties: {teamInfo.record.full.ties}
            </Text>
            <Text>
              Winrate: {(teamInfo.record.full.winrate * 100).toFixed(2)}%
            </Text>
          </Stack>
          <Stack>
            <Title order={3} mt="xl">EPA</Title>
            <Text>Current: {teamInfo.norm_epa.current.toFixed(2)}</Text>
            <Text>Recent: {teamInfo.norm_epa.recent.toFixed(2)}</Text>
            <Text>Mean: {teamInfo.norm_epa.mean.toFixed(2)}</Text>
            <Text>Max: {teamInfo.norm_epa.max.toFixed(2)}</Text>
          </Stack>
        </SimpleGrid>
      </Paper>
      <Title order={2} mt="xl">Upcoming Matches</Title>
      {upcomingMatches.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mt="md">
          {upcomingMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </SimpleGrid>
      ) : (
        <Text mt="md">No upcoming matches found.</Text>
      )}
    </Container>
  );
}
