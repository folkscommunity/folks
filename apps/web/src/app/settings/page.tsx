import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Settings } from "./settings";

export const metadata: Metadata = {
  title: "Folks –Settings"
};

export default async function Page() {
  const user = await ServerSession();

  if (!user) {
    return notFound();
  }

  return (
    <MainContainer>
      <Settings user={user} />
    </MainContainer>
  );
}
