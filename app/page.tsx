"use client";

import { Welcome } from "../components/UI/Welcome";
import { Field } from "../components/FRCMatch/Field";
import { useWindowScroll } from "@mantine/hooks";

export default function HomePage() {
  const [scroll] = useWindowScroll();
  const blurAmount = scroll.y > 500
    ? Math.max(0, 10 - (scroll.y - 500) / 10)
    : 10;

  return (
    <>
      <Field blurAmount={blurAmount} />
      <Welcome />
    </>
  );
}
