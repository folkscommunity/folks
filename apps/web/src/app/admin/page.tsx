import { Metadata } from "next";
import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { redis } from "@/lib/redis";
import { ServerSession } from "@/lib/server-session";

import { Admin } from "./admin";

export const metadata: Metadata = {
  title: "Folks – Admin"
};

export default async function Page() {
  const user = await ServerSession();

  if (!user || !user.super_admin) {
    return notFound();
  }

  const announcement = await redis.get("announcement");

  return (
    <MainContainer>
      <Admin announcement={announcement} />
    </MainContainer>
  );
}
