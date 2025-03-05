import { notFound } from "next/navigation";

import { prisma } from "@folks/db";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Users } from "./users";

export default async function Page() {
  const user = await ServerSession();

  if (!user || !user.super_admin) {
    return notFound();
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      display_name: true,
      avatar_url: true,
      occupation: true,
      location: true,
      pronouns: true,
      website: true,
      super_admin: true,
      suspended: true,
      created_at: true,
      updated_at: true,
      email: true,
      email_verified: true,
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
          ribbons: true,
          liked_posts: true
        }
      }
    },
    orderBy: {
      created_at: "desc"
    }
  });

  return (
    <MainContainer>
      <Users users={users} />
    </MainContainer>
  );
}
