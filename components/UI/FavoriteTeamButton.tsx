import { useEffect, useState } from "react";
import { ActionIcon } from "@mantine/core";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import { createClient } from "@/utils/supabase/client";
import { notifications } from "@mantine/notifications";

interface FavoriteTeamButtonProps {
  teamNumber: number;
}

export default function FavoriteTeamButton(
  { teamNumber }: FavoriteTeamButtonProps,
) {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkFavorite = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth
          .getUser();
        if (userError) throw userError;

        if (user) {
          const { data, error } = await supabase
            .from("users")
            .select("favorite_teams")
            .eq("id", user.id)
            .single();

          if (error) throw error;

          const teamNumberAsNumber = Number(teamNumber);
          const isTeamFavorite = data.favorite_teams?.some(
            (team: number) => team === teamNumberAsNumber,
          ) || false;
          setIsFavorite(isTeamFavorite);
        } else {
          console.warn("No user found");
        }
      } catch (error) {
        console.error("Error checking favorite status:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkFavorite();
  }, [teamNumber, supabase]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      notifications.show({
        title: "Error",
        message: "You must be logged in to favorite teams",
        color: "red",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("users")
        .select("favorite_teams")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      let favoriteTeams = data.favorite_teams || [];

      if (isFavorite) {
        favoriteTeams = favoriteTeams.filter((team: number) =>
          team !== teamNumber
        );
      } else {
        favoriteTeams.push(teamNumber);
      }

      const { error: updateError } = await supabase
        .from("users")
        .update({ favorite_teams: favoriteTeams })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setIsFavorite(!isFavorite);
      notifications.show({
        title: "Success",
        message: isFavorite
          ? "Team removed from favorites"
          : "Team added to favorites",
        color: "green",
      });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      notifications.show({
        title: "Error",
        message: "Failed to update favorite status",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ActionIcon
      variant="subtle"
      color={isFavorite ? "yellow" : "gray"}
      onClick={toggleFavorite}
      aria-label={isFavorite ? "Unfavorite team" : "Favorite team"}
      disabled={isLoading}
    >
      {isFavorite
        ? <IconStarFilled size="1.1rem" />
        : <IconStar size="1.1rem" />}
    </ActionIcon>
  );
}
