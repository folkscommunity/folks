import { Metadata } from "next";

import { MainContainer } from "@/components/main-container";

import { Guidelines } from "./guidelines";

export const metadata: Metadata = {
  title: "Folks - Guidelines"
};

export default async function Page() {
  return (
    <MainContainer hideAbout={true}>
      <Guidelines />
    </MainContainer>
  );
}
