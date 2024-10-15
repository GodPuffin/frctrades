"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

const myColor: MantineColorsTuple = [
  "#f2f0ff",
  "#e0dff2",
  "#bfbdde",
  "#9b98ca",
  "#7d79ba",
  "#6a65b0",
  "#605bac",
  "#504c97",
  "#464388",
  "#3b3979"
]

const theme = createTheme({
  colors: {
    myColor,
  },
  autoContrast: true,
  primaryColor: "myColor",
  primaryShade: 6,
  fontFamily: "Sora, sans-serif",
  defaultGradient: {
    from: "grape",
    to: "violet",
  },
  white: "#f5f5f5",
  black: "#0B1215",
  defaultRadius: "lg",
});

export default theme;
