import { Metadata } from "next";

import { MainContainer } from "@/components/main-container";

import { PrivacyPolicy } from "./privacy-policy";

export const metadata: Metadata = {
  title: "Folks - Privacy Policy"
};

export default async function Page() {
  return (
    <MainContainer>
      <PrivacyPolicy />
    </MainContainer>
  );
}
