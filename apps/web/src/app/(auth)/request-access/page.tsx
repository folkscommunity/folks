import { Metadata } from "next";
import { redirect } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { RequestAccess } from "./request-access";

export const metadata: Metadata = {
  title: "Folks –Request Access"
};

export default async function Page() {
  const user = await ServerSession();

  if (user) {
    return redirect("/");
  }

  return redirect("/register");

  return (
    <MainContainer>
      <RequestAccess />
    </MainContainer>
  );
}
