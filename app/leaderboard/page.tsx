import { createClient } from "@/utils/supabase/server";
import {
  Avatar,
  Center,
  Container,
  Group,
  Paper,
  SimpleGrid,
  Text,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { IconCoins, IconCrown } from "@tabler/icons-react";
import Link from "next/link";

async function getLeaderboardData() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, handle, avatar_url, points")
    .order("points", { ascending: false })
    .limit(7);

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    return [];
  }

  return data.map((user, index) => ({
    rank: index + 1,
    name: user.full_name,
    handle: user.handle,
    points: user.points,
    avatar: user.avatar_url,
  }));
}

export default async function LeaderboardPage() {
  const leaderboardData = await getLeaderboardData();

  return (
    <Container size="lg" p="xl">
      <Title mb="lg">Leaderboard</Title>
      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
        {leaderboardData.slice(0, 3).map((user) => (
          <Link href={`/user/${user.handle}`} key={user.rank} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Paper withBorder radius="md" p="md" style={{ cursor: 'pointer' }}>
              <Center mb="md">
                <ThemeIcon
                  size="xl"
                  radius="md"
                  variant="gradient"
                  gradient={{
                    from: user.rank === 1 ? '#fcba03' : user.rank === 2 ? 'silver' : '#cb7e35',
                    to: user.rank === 1 ? '#ffd700' : user.rank === 2 ? '#e8e8e8' : '#e0ac69',
                    deg: 45
                  }}
                >
                  <IconCrown size={28} />
                </ThemeIcon>
              </Center>
              <Center mb="md">
                <Avatar src={user.avatar} size="xl" />
              </Center>
              <Text ta="center" size="lg" fw={500}>{user.name}</Text>
              <Text ta="center" size="sm" c="dimmed">
                <IconCoins size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {user.points.toLocaleString()}
              </Text>
              <Text ta="center" size="xl" fw={700}>#{user.rank}</Text>
            </Paper>
          </Link>
        ))}
      </SimpleGrid>
      <Paper withBorder radius="md" p="md" mt="lg">
        {leaderboardData.slice(3).map((user) => (
          <Link href={`/user/${user.handle}`} key={user.rank} style={{ textDecoration: 'none', color: 'inherit' }}>
            <Group justify="space-between" mb="sm" style={{ cursor: 'pointer' }}>
              <Group>
                <Avatar src={user.avatar} size="md" />
                <Text size="md" fw={500}>{user.name}</Text>
                {/* {user.isStar && <Text size="sm" c="yellow">⭐</Text>} */}
              </Group>
              <Text size="md">
                <IconCoins size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {user.points.toLocaleString()}
              </Text>
            </Group>
          </Link>
        ))}
      </Paper>
    </Container>
  );
}
