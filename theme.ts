"use client";

import { createTheme, MantineColorsTuple } from "@mantine/core";

const myColor: MantineColorsTuple = [
  "#f1f4fe",
  "#e4e6ed",
  "#c8cad3",
  "#a9adb9",
  "#9094a3",
  "#7f8496",
  "#777c91",
  "#656a7e",
  "#595e72",
  "#4a5167"
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
    from: "red",
    to: "blue",
  },
  white: "#f5f5f5",
  black: "#0B1215",
  defaultRadius: "lg",
});

export default theme;
