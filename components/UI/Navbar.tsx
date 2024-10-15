"use client";

import {
  ActionIcon,
  AppShell,
  Avatar,
  Burger,
  Button,
  Divider,
  Group,
  NavLink,
  SimpleGrid,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { AvatarMenu } from "../UI/AvatarMenu";
import {
  IconBriefcase2,
  IconBuildingStore,
  IconCalculator,
  IconChartDots2,
  IconHome,
  IconLogin,
  IconLogout,
  IconSunMoon,
  IconTrafficCone,
  IconTrophy,
} from "@tabler/icons-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { notifications } from "@mantine/notifications";

export function Navbar(
  { children, user }: { children: any; user: User | null },
) {
  const [opened, { toggle }] = useDisclosure(false);
  const { toggleColorScheme } = useMantineColorScheme();
  const supabase = createClient();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { desktop: true, mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
          <Group justify="space-between" flex="1">
            <ActionIcon
              variant="subtle"
              radius="lg"
              size="xl"
              component={Link}
              href="/"
            >
              <IconChartDots2 />
            </ActionIcon>
            <Group ml="xl" gap="sm" visibleFrom="sm">
              {/* <Button variant="subtle" radius="lg" component={Link} href="/home" leftSection={<IconHome />}>Home</Button> */}
              <Button
                variant="subtle"
                radius="lg"
                component={Link}
                href="/portfolio"
                leftSection={<IconBriefcase2 />}
              >
                Portfolio
              </Button>
              <Button
                variant="subtle"
                radius="lg"
                component={Link}
                href="/market"
                leftSection={<IconBuildingStore />}
              >
                Market
              </Button>
              <Button
                variant="subtle"
                radius="lg"
                component={Link}
                href="/leaderboard"
                leftSection={<IconTrophy />}
              >
                Leaderboard
              </Button>
              <AvatarMenu user={user} />
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar py="md" px={4} onMouseLeave={() => toggle()}>
        <Divider my="sm" size="sm" label="User Info" />
        <SimpleGrid cols={2}>
          <NavLink
            label={user
              ? user.user_metadata?.full_name || "User Profile"
              : "Sign In"}
            leftSection={
              <Avatar
                style={{ cursor: "pointer" }}
                src={user?.user_metadata?.avatar_url}
              >
                {!user && <IconLogin />}
              </Avatar>
            }
            variant="subtle"
            component={Link}
            href={user
              ? (user.user_metadata.handle
                ? `/user/${user.user_metadata.handle}`
                : "/profile")
              : "/login"}
            onClick={() => toggle()}
          />
          {user && (
            <NavLink
              label="Sign Out"
              leftSection={<IconLogout size="1rem" stroke={1.5} />}
              variant="subtle"
              onClick={async () => {
                const { error } = await supabase.auth.signOut();
                if (error) {
                  notifications.show({
                    title: "Error",
                    message: "Error signing out",
                    color: "red",
                  });
                } else {
                  notifications.show({
                    title: "Success",
                    message: "You are now logged out",
                    color: "green",
                  });
                  window.location.href = "/";
                }
              }}
            />
          )}
        </SimpleGrid>
        <Divider my="sm" size="sm" label="Navigation" />
        {
          /* <NavLink
          href="/home"
          label="Home"
          leftSection={<IconHome size="1rem" stroke={1.5} />}
          variant="subtle"
          component={Link}
          onClick={() => toggle()}
        /> */
        }
        <NavLink
          href="/portfolio"
          label="Portfolio"
          leftSection={<IconBriefcase2 size="1rem" />}
          variant="subtle"
          component={Link}
          onClick={() => toggle()}
        />
        <NavLink
          href="/market"
          label="Market"
          leftSection={<IconBuildingStore size="1rem" />}
          variant="subtle"
          component={Link}
          onClick={() => toggle()}
        />
        <NavLink
          href="/leaderboard"
          label="Leaderboard"
          leftSection={<IconTrophy size="1rem" />}
          variant="subtle"
          component={Link}
          onClick={() => toggle()}
        />
        <Divider my="sm" size="sm" label="Other" />
        <NavLink
          label="Toggle Color Scheme"
          leftSection={<IconSunMoon size="1rem" />}
          variant="subtle"
          onClick={() => toggleColorScheme()}
        />
        <NavLink
          href="/how-to-play"
          label="How to Play"
          leftSection={<IconTrafficCone size="1rem" />}
          variant="subtle"
          component={Link}
          onClick={() => toggle()}
        />
        {
          /* <NavLink
          href="/calculator"
          label="Calculator"
          leftSection={<IconCalculator size="1rem" />}
          variant="subtle"
          component={Link}
          onClick={() => toggle()}
        /> */
        }
      </AppShell.Navbar>

      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  );
}
