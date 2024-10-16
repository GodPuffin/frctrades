import { Button, Container, Text, Title } from "@mantine/core";
import Link from "next/link";

export default function ErrorPage() {
  return (
    <Container size="md" h="700px" p="xl" style={{ textAlign: "center" }}>
      <Title order={1}>Oops! Something went wrong.</Title>
      <Text size="xl" mt="xl" pb="xl">
        We couldn't process your request. Please try again later.
      </Text>
      <Button
        variant="filled"
        size="xl"
        radius="lg"
        component={Link}
        href="/"
      >
        Go Back to Home
      </Button>
    </Container>
  );
}
