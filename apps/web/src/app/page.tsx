import { Suspense } from "react";

import { Feeds } from "@/components/feeds";
import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

export default async function Home() {
  const user = await ServerSession();

  return (
    <MainContainer>
      <Feeds is_authed={Boolean(user)} />
    </MainContainer>
  );
}
