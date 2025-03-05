import { Metadata } from "next";
import { redirect } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Register } from "./register";

export const metadata: Metadata = {
  title: "Folks – Register"
};

export default async function Page() {
  const user = await ServerSession();

  if (user) {
    return redirect("/");
  }

  return (
    <MainContainer hideAbout={true}>
      <Register />
    </MainContainer>
  );
}
