import NotFound from "@/app/not-found";
import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Whitelist } from "./whitelist";

export default async function Page() {
  const user = await ServerSession();

  if (!user || !user.super_admin) {
    return <NotFound />;
  }

  return (
    <MainContainer>
      <Whitelist />
    </MainContainer>
  );
}
