import { Metadata } from "next";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import NotFound from "../not-found";
import { Settings } from "./settings";

export const metadata: Metadata = {
  title: "Folks - Settings"
};

export default async function Page() {
  const user = await ServerSession();

  if (!user) {
    return <NotFound />;
  }

  return (
    <MainContainer>
      <Settings user={user} />
    </MainContainer>
  );
}
