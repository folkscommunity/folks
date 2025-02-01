import { Metadata } from "next";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Support } from "./support";

export const metadata: Metadata = {
  title: "Folks - Support"
};

export default async function Page() {
  const user = await ServerSession();
  const email = user ? user.email : null;

  return (
    <MainContainer>
      <Support email={email} />
    </MainContainer>
  );
}
