"use client";

import { useEffect, useRef, useState } from "react";
import {
  Center,
  Container,
  Loader,
  SimpleGrid,
  TagsInput,
  Title,
} from "@mantine/core";
import { useIntersection } from "@mantine/hooks";
import MatchCard from "@/components/UI/MatchCard";
import { Match } from "@/types/Match";

const MATCHES_PER_PAGE = 15;

export default function MarketPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const lastMatchRef = useRef<HTMLDivElement>(null);
  const { ref, entry } = useIntersection({
    root: null,
    threshold: 1,
  });

  async function loadMore(reset = false) {
    if (loading || (!hasMore && !reset)) return;
    setLoading(true);

    const teamQuery =
      selectedTeams.length > 0 ? `&teams=${selectedTeams.join(",")}` : "";
    const eventQuery =
      selectedEvents.length > 0 ? `&events=${selectedEvents.join(",")}` : "";

    const response = await fetch(
      `/api/matches?limit=${MATCHES_PER_PAGE}&offset=${
        reset ? 0 : offset
      }${teamQuery}${eventQuery}`
    );
    const newMatches = await response.json();
    if (newMatches.length < MATCHES_PER_PAGE) {
      setHasMore(false);
    }
    setMatches((prev) => (reset ? newMatches : [...prev, ...newMatches]));
    setOffset((prev) => (reset ? MATCHES_PER_PAGE : prev + MATCHES_PER_PAGE));
    setLoading(false);
  }

  useEffect(() => {
    loadMore(true);
  }, [selectedTeams, selectedEvents]);

  useEffect(() => {
    if (entry?.isIntersecting) {
      loadMore();
    }
  }, [entry]);

  return (
    <Container size="lg" p="xl">
      <Title mb="lg">Market</Title>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md" mb="lg">
        <TagsInput
          label="Filter by teams"
          placeholder="Team numbers"
          clearable
          mt="sm"
          comboboxProps={{
            transitionProps: { transition: "pop", duration: 200 },
          }}
          limit={5}
          value={selectedTeams}
          onChange={(value) => {
            const numericValues = value
              .map((val) => val.replace(/\D/g, ""))
              .filter((val) => val !== "");
            setSelectedTeams(numericValues);
          }}
        />
        <TagsInput
          label="Filter by events"
          placeholder="Event keys"
          clearable
          mt="sm"
          comboboxProps={{
            transitionProps: { transition: "pop", duration: 200 },
          }}
          limit={5}
          value={selectedEvents}
          onChange={(value) => setSelectedEvents(value)}
        />
      </SimpleGrid>
      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
        {matches.map((match, index) => (
          <div
            key={match.id}
            ref={index === matches.length - 1 ? ref : undefined}
          >
            <MatchCard match={match} />
          </div>
        ))}
      </SimpleGrid>
      {loading && (
        <Center mt="xl">
          <Loader />
        </Center>
      )}
      {!hasMore && matches.length > 0 && (
        <Center mt="xl">
          <Title order={3}>No more matches to load</Title>
        </Center>
      )}
    </Container>
  );
}
