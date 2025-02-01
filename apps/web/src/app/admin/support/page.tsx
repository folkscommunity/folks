import { prisma } from "@folks/db";

import NotFound from "@/app/not-found";
import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { SupportAdmin } from "./support-admin";

export default async function Page() {
  const user = await ServerSession();

  if (!user || !user.super_admin) {
    return <NotFound />;
  }

  return (
    <MainContainer>
      <SupportAdmin />
    </MainContainer>
  );
}
