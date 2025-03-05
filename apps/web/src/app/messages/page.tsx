import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Messages } from "./messages";

export const metadata: Metadata = {
  title: "Folks – Messages"
};

export default async function Page() {
  const user = await ServerSession();

  if (!user) {
    return notFound();
  }

  return (
    <MainContainer>
      <Messages user={user} />
    </MainContainer>
  );
}
