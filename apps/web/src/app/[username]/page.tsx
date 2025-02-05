import { prisma } from "@folks/db";

import NotFound from "@/app/not-found";
import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import Profile from "./profile";

export async function generateMetadata({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const username = (await params).username;

  const user = await prisma.user.findUnique({
    where: {
      username: username
    },
    select: {
      display_name: true,
      occupation: true,
      location: true,
      pronouns: true,
      website: true
    }
  });

  return {
    title: user ? `${user.display_name}` : "Folks"
  };
}

export default async function Page({
  params
}: {
  params: Promise<{ username: string }>;
}) {
  const username = (await params).username;

  const user = await ServerSession();

  const selectedUser = await prisma.user.findUnique({
    where: {
      username: username
    },
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
      _count: {
        select: {
          following: true,
          followers: true
        }
      }
    }
  });

  if (!selectedUser) {
    return <NotFound />;
  }

  let isUser = false;

  if (user) {
    isUser = selectedUser.id === user?.id;
  }

  return (
    <MainContainer>
      <Profile
        profile={{
          id: selectedUser.id,
          username: selectedUser.username,
          display_name: selectedUser.display_name,
          occupation: selectedUser.occupation || undefined,
          avatar_url: selectedUser.avatar_url || undefined,
          location: selectedUser.location || undefined,
          pronouns: selectedUser.pronouns || undefined,
          website: selectedUser.website || undefined,
          super_admin: selectedUser.super_admin,
          suspended: selectedUser.suspended,
          created_at: selectedUser.created_at,
          updated_at: selectedUser.updated_at,
          count: {
            following: selectedUser._count.following || undefined,
            followers: selectedUser._count.followers || undefined
          }
        }}
        user={user}
        isUser={isUser}
      />
    </MainContainer>
  );
}
