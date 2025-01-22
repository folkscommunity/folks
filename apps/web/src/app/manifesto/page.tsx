import { Metadata } from "next";

import { MainContainer } from "@/components/main-container";

import { Manifesto } from "./manifesto";

export const metadata: Metadata = {
  title: "Folks - Manifesto"
};

export default async function Page() {
  return (
    <MainContainer hideAbout={true}>
      <Manifesto />
    </MainContainer>
  );
}
