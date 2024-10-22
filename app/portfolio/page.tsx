import {
  Badge,
  Card,
  Container,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import PortfolioComponent from "../../components/Portfolio/PortfolioComponent";

export default async function PortfolioPage() {
  const supabase = createClient();

  // Fetch the user's session
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's balance
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("points")
    .eq("id", user.id)
    .single();

  if (userError) {
    console.error("Error fetching user balance:", userError);
    return (
      <Container size="lg" p="xl">
        <Title>Error loading user data</Title>
        <Text>
          There was an error loading your balance. Please try again later.
        </Text>
      </Container>
    );
  }

  // Fetch all bets for the current user
  const { data: bets, error } = await supabase
    .from("bets")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching bets:", error);
    return (
      <Container size="lg" p="xl">
        <Title>Error loading portfolio</Title>
        <Text>
          There was an error loading your bets. Please try again later.
        </Text>
      </Container>
    );
  }

  return <PortfolioComponent points={userData.points} bets={bets || []} />;
}
