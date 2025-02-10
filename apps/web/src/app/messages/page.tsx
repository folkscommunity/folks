import { Metadata } from "next";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import NotFound from "../not-found";
import { Messages } from "./messages";

export const metadata: Metadata = {
  title: "Folks - Messages"
};

export default async function Page() {
  const user = await ServerSession();

  if (!user) {
    return <NotFound />;
  }

  return (
    <MainContainer>
      <Messages user={user} />
    </MainContainer>
  );
}
