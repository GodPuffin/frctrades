import "./global.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/charts/styles.css";
import React from "react";
import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import theme from "../theme";
import { Navbar } from "../components/UI/Navbar";
import { Notifications } from "@mantine/notifications";
import { createClient } from "@/utils/supabase/server";

export const metadata = {
  title: "FRC Trades",
  description: "FRC Predicions Game",
};

export default async function RootLayout({ children }: { children: any }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <Notifications autoClose={2000} limit={3} />
          <Navbar user={user}>
            {children}
          </Navbar>
        </MantineProvider>
      </body>
    </html>
  );
}
