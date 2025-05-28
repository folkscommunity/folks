import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ghost } from "@/lib/ghost_cms";

import { Guidelines } from "./guidelines";

export const metadata: Metadata = {
  title: "Folks – Guidelines"
};

export default async function Page() {
  const guidelines_page = await ghost.pages.read({ slug: "guidelines" });

  if (!guidelines_page) {
    return notFound();
  }

  return (
    <MainContainer hideAbout={true}>
      <Guidelines
        content={guidelines_page.html}
        title={guidelines_page.title}
      />
    </MainContainer>
  );
}
