"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { Avatar, Menu, useMantineColorScheme } from "@mantine/core";
import {
  IconAddressBook,
  IconCalculator,
  IconLogin,
  IconLogout,
  IconMoonStars,
  IconSun,
  IconTrafficCone,
  IconUserScan,
} from "@tabler/icons-react";
import Link from "next/link";
import { notifications } from "@mantine/notifications";

export function AvatarMenu({ user }: { user: User | null }) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const supabase = createClient();

  return (
    <Menu shadow="md" width={200} radius="md">
      <Menu.Target>
        <Avatar
          style={{ cursor: "pointer" }}
          src={user?.user_metadata?.avatar_url}
        >
          {!user && <IconLogin />}
        </Avatar>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>User</Menu.Label>
        <Menu.Item
          rightSection={<IconUserScan />}
          component={Link}
          href={user
            ? (user.user_metadata.handle
              ? `/user/${user.user_metadata.handle}`
              : "/profile")
            : "/login"}
        >
          {user ? user.user_metadata?.full_name || "Public Profile" : "Sign In"}
        </Menu.Item>
        {user && user.user_metadata.handle && (
          <Menu.Item
            rightSection={<IconAddressBook />}
            component={Link}
            href={"/profile"}
          >
            Update Profile
          </Menu.Item>
        )}
        <Menu.Label>Settings</Menu.Label>
        <Menu.Item
          rightSection={colorScheme === "dark"
            ? <IconSun />
            : <IconMoonStars />}
          onClick={() => toggleColorScheme()}
        >
          {colorScheme === "dark" ? "Light Mode" : "Dark Mode"}
        </Menu.Item>
        <Menu.Label>Other</Menu.Label>
        <Menu.Item
          rightSection={<IconTrafficCone />}
          component={Link}
          href="/how-to-play"
        >
          How to Play
        </Menu.Item>
        {/* <Menu.Item rightSection={<IconCalculator />} component={Link} href="/calculator">Calculator</Menu.Item> */}
        <Menu.Item
          rightSection={<IconLogout />}
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
        >
          Sign Out
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
