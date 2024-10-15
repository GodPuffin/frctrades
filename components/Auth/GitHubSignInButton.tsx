"use client";

import { Button } from "@mantine/core";
import { IconBrandGithub } from "@tabler/icons-react";
import { createClient } from "@/utils/supabase/client";
import { notifications } from "@mantine/notifications";

async function signInWithGithub() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: "http://localhost:3000/auth/callback",
    },
  });
  if (error) {
    notifications.show({
      title: "Error",
      message: "Error signing in with GitHub",
      color: "red",
    });
  } else {
    notifications.show({
      title: "Success",
      message: "You are now logged in",
      color: "green",
    });
  }
}

export default function GitHubSignInButton() {
  return (
    <Button
      variant="outline"
      leftSection={<IconBrandGithub />}
      onClick={signInWithGithub}
    >
      Sign in with GitHub
    </Button>
  );
}
