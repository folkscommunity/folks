import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ghost } from "@/lib/ghost_cms";
import { ServerSession } from "@/lib/server-session";

import { Manifesto } from "./manifesto";

export const metadata: Metadata = {
  title: "Folks – Manifesto"
};

export default async function Page() {
  const user = await ServerSession();

  const guidelines_page = await ghost.pages.read({ slug: "manifesto" });

  if (!guidelines_page) {
    return notFound();
  }

  return (
    <MainContainer hideAbout={true}>
      <Manifesto
        user={user}
        content={guidelines_page.html}
        title={guidelines_page.title}
      />
    </MainContainer>
  );
}
