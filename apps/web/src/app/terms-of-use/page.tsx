import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";

import { TermsOfUse } from "./terms-of-use";

export const metadata: Metadata = {
  title: "Folks – Terms of Use"
};

export default async function Page() {
  return (
    <MainContainer hideAbout={true}>
      <TermsOfUse />
    </MainContainer>
  );
}
