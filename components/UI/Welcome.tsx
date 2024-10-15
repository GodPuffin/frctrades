import { Button, Container, Image, Text, Title } from "@mantine/core";
import Link from "next/link";

export function Welcome() {
  return (
    <>
      <Container size="md" h="700px" p="xl">
        <Title>FRC trades, A FRC betting game.</Title>
        <Text size="xl" mt="xl" pb="xl">
          Predict the performance of FRC teams in their matches, putting your
          virtual points on the line.
        </Text>

        <Button
          variant="gradient"
          size="xl"
          radius="lg"
          mb="xl"
          component={Link}
          href="/login"
        >
          Get started
        </Button>
        <Image
          src="https://placehold.co/600x400"
          alt="Placeholder Image"
          p="xs"
          mb="1000px"
          radius="xl"
        />
        <Text size="xl" mt="xl" pb="xl">
          Made by{" "}
          <Text
            component="a"
            inherit
            variant="gradient"
            href="https://github.com/GodPuffin"
            target="_blank"
            size="sm"
          >
            Marcus Lee
          </Text>
          .
        </Text>
      </Container>
    </>
  );
}
