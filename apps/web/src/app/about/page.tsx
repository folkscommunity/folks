import { Metadata } from "next";

import { MainContainer } from "@/components/main-container";

import { About } from "./about";

export const metadata: Metadata = {
  title: "Folks - About"
};

export default async function Page() {
  return (
    <MainContainer>
      <About />
    </MainContainer>
  );
}
