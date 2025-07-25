import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ghost } from "@/lib/ghost_cms";

import { PrivacyPolicy } from "./privacy-policy";

export const metadata: Metadata = {
  title: "Folks – Privacy Policy"
};

export default async function Page() {
  const guidelines_page = await ghost.pages.read({ slug: "privacy-policy" });

  if (!guidelines_page) {
    return notFound();
  }

  return (
    <MainContainer hideAbout={true}>
      <PrivacyPolicy
        content={guidelines_page.html}
        title={guidelines_page.title}
      />
    </MainContainer>
  );
}
