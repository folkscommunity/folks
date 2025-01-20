import { Metadata } from "next";

import { MainContainer } from "@/components/main-container";

import { ReleaseNotes } from "./release-notes";

export const metadata: Metadata = {
  title: "Folks - Release Notes"
};

export default async function Page() {
  return (
    <MainContainer>
      <ReleaseNotes />
    </MainContainer>
  );
}
