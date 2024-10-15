"use client";

import { login, signup } from "./actions";
import { Button, Container, Group, TextInput, Title } from "@mantine/core";
import GitHubSignInButton from "@/components/Auth/GitHubSignInButton";
import { notifications } from "@mantine/notifications";

export default function LoginPage() {
  const handleSignup = async (formData: FormData) => {
    const result = await signup(formData);
    if (result?.success) {
      notifications.show({
        message: "Check your email for verification.",
        color: "yellow",
      });
    }
  };

  return (
    <Container size="xs" p="md">
      <Title order={2} mb="lg" style={{ textAlign: "center" }}>Login</Title>
      <form>
        <TextInput
          label="Email"
          id="email"
          name="email"
          type="email"
          required
          mb="md"
        />
        <TextInput
          label="Password"
          id="password"
          name="password"
          type="password"
          required
          mb="md"
        />
        <Group justify="center" mt="md">
          <Button type="submit" formAction={login}>Log in</Button>
          <Button type="submit" formAction={handleSignup}>Sign up</Button>
          <GitHubSignInButton />
        </Group>
      </form>
    </Container>
  );
}
