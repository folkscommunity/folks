import { Metadata } from "next";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import NotFound from "../not-found";
import { Notifications } from "./notifications";

export const metadata: Metadata = {
  title: "Folks –Notifications"
};

export default async function Page() {
  const user = await ServerSession();

  if (!user) {
    return <NotFound />;
  }

  return (
    <MainContainer>
      <Notifications user={user} />
    </MainContainer>
  );
}
