import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ghost } from "@/lib/ghost_cms";

import { TermsOfUse } from "./terms-of-use";

export const metadata: Metadata = {
  title: "Folks – Terms of Use"
};

export default async function Page() {
  const guidelines_page = await ghost.pages.read({ slug: "terms-of-use" });

  if (!guidelines_page) {
    return notFound();
  }

  return (
    <MainContainer hideAbout={true}>
      <TermsOfUse
        content={guidelines_page.html}
        title={guidelines_page.title}
      />
    </MainContainer>
  );
}
