import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Notifications } from "./notifications";

export const metadata: Metadata = {
  title: "Folks – Notifications"
};

export default async function Page() {
  const user = await ServerSession();

  if (!user) {
    return notFound();
  }

  return (
    <MainContainer>
      <Notifications user={user} />
    </MainContainer>
  );
}
