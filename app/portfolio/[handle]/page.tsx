import {
    Container,
    Text,
    Title,
  } from "@mantine/core";
  import { createClient } from "@/utils/supabase/server";
  import { notFound } from "next/navigation";
  import PortfolioComponent from "../../../components/Portfolio/PortfolioComponent";
  
  export default async function UserPortfolioPage({ params }: { params: { handle: string } }) {
    const supabase = createClient();
  
    // Fetch the user based on the handle
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id, points, handle")
      .eq("handle", params.handle)
      .single();
  
    if (userError || !userData) {
      notFound();
    }
  
    // Fetch all bets for the specified user
    const { data: bets, error } = await supabase
      .from("bets")
      .select("*")
      .eq("user_id", userData.id)
      .order("created_at", { ascending: false });
  
    if (error) {
      console.error("Error fetching bets:", error);
      return (
        <Container size="lg" p="xl">
          <Title>Error loading portfolio</Title>
          <Text>
            There was an error loading the bets. Please try again later.
          </Text>
        </Container>
      );
    }
  
    return <PortfolioComponent handle={userData.handle} points={userData.points} bets={bets || []} />;
  }
