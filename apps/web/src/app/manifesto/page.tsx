import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Manifesto } from "./manifesto";

export const metadata: Metadata = {
  title: "Folks – Manifesto"
};

export default async function Page() {
  const user = await ServerSession();

  return (
    <MainContainer hideAbout={true}>
      <Manifesto user={user} />
    </MainContainer>
  );
}
