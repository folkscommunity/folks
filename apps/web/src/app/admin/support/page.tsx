import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { SupportAdmin } from "./support-admin";

export default async function Page() {
  const user = await ServerSession();

  if (!user || !user.super_admin) {
    return notFound();
  }

  return (
    <MainContainer>
      <SupportAdmin />
    </MainContainer>
  );
}
