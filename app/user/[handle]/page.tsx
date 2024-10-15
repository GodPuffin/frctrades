import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import {
  Avatar,
  Box,
  Button,
  Center,
  Container,
  Group,
  Paper,
  Text,
  Title,
} from "@mantine/core";
import Link from "next/link";
import { IconCoins, IconCrown, IconTrophy } from "@tabler/icons-react";

interface UserRankResult {
  rank: number;
}

interface ProfileUser {
  id: string;
  full_name: string;
  avatar_url: string;
  handle: string;
  team_number: number | null;
  points: number;
}

async function getTeamInfo(teamNumber: number) {
  const response = await fetch(
    `https://api.statbotics.io/v3/team/${teamNumber}`,
  );
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  return data;
}

async function getUserRank(
  supabase: SupabaseClient,
  userId: string,
): Promise<number | null> {
  const { data, error } = await supabase
    .from("users")
    .select("id, points")
    .order("points", { ascending: false });

  if (error) {
    console.error("Error fetching user ranks:", error);
    return null;
  }

  const userIndex = data.findIndex((user) => user.id === userId);

  if (userIndex !== -1) {
    const rank = userIndex + 1;

    return rank;
  } else {
    return null;
  }
}

export default async function PublicProfilePage(
  { params }: { params: { handle: string } },
) {
  const supabase = createClient();

  const { data: profileUser, error } = await supabase
    .from("users")
    .select("id, full_name, avatar_url, handle, team_number, points")
    .eq("handle", params.handle)
    .single<ProfileUser>();

  if (error || !profileUser) {
    notFound();
  }

  // Fetch user rank based on points
  const userRank = await getUserRank(supabase, profileUser.id);

  // Get the current logged-in user
  const { data: { user: currentUser } } = await supabase.auth.getUser();

  // Check if the current user is viewing their own profile
  const isOwnProfile = currentUser?.id === profileUser.id;

  // Fetch team info if team number is available
  let teamInfo = null;
  if (profileUser.team_number) {
    teamInfo = await getTeamInfo(profileUser.team_number);
  }

  return (
    <Container size="sm" p="xl">
      <Avatar
        src={profileUser.avatar_url}
        size="xl"
        radius="xl"
        mb="md"
      />
      <Group justify="space-between" mb="xl">
        <Box>
          <Title order={2} mb={0}>{profileUser.full_name}</Title>
          <Text c="dimmed" size="lg">@{profileUser.handle}</Text>
        </Box>
        {teamInfo && (
          <div
            style={{
              display: "inline-block",
              padding: "2px",
              borderRadius: "5px",
              background:
                `linear-gradient(135deg, ${teamInfo.colors.primary}, ${teamInfo.colors.secondary})`,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--mantine-color-body)",
                borderRadius: "3px",
                padding: "4px",
              }}
            >
              <Text size="sm">
                {teamInfo.team} - {teamInfo.name}
              </Text>
            </div>
          </div>
        )}
      </Group>
      <Group justify="center" align="center">
        <Paper p="md" radius="md" withBorder shadow="xs">
          <Title order={2}>
            <IconCoins size={28} />
            {profileUser.points}
          </Title>
        </Paper>
        <Paper p="md" radius="md" withBorder shadow="xs">
          <Title order={2}>
            <IconCrown size={28} style={{ transform: "translateY(4px)" }} />
            {userRank ? ` #${userRank}` : "N/A"}
          </Title>
        </Paper>
      </Group>
      {isOwnProfile && (
        <Group justify="right" mt="xl">
          <Button component={Link} href="/profile">
            Update Profile
          </Button>
        </Group>
      )}
    </Container>
  );
}
