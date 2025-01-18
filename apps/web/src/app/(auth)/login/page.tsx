import { Metadata } from "next";
import { redirect } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Login } from "./login";

export const metadata: Metadata = {
  title: "Folks - Login"
};

export default async function Page() {
  const user = await ServerSession();

  if (user) {
    return redirect("/");
  }

  return (
    <MainContainer>
      <Login />
    </MainContainer>
  );
}
