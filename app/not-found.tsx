import { Button, Container, Text, Title } from "@mantine/core";
import Link from "next/link";

export default function NotFound() {
  return (
    <Container size="md" h="700px" p="xl" style={{ textAlign: "center" }}>
      <Title order={1}>404 - Page Not Found</Title>
      <Text size="xl" mt="xl" pb="xl">
        Oops! The page you are looking for does not exist.
      </Text>
      <Button
        variant="filled"
        size="xl"
        radius="lg"
        component={Link}
        href="/"
      >
        Go to Home
      </Button>
    </Container>
  );
}
