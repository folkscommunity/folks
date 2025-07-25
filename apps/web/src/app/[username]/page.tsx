import { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@folks/db";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import Profile from "./profile";

export async function generateMetadata({
  params
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  const username = (await params).username;

  const user = await prisma.user.findUnique({
    where: {
      username: username,
      deleted_at: null
    },
    select: {
      display_name: true,
      occupation: true,
      location: true,
      pronouns: true,
      website: true
    }
  });

  const bio = user
    ? `${user.occupation ? `${user.occupation}` : ""}${user.location ? `, ${user.location}` : ""}${user.pronouns ? `, ${user.pronouns}` : ""}`
    : undefined;

  return {
    title: user ? `${user.display_name}` : "Folks",
    description: bio,
    openGraph: {
      title: user ? `${user.display_name}` : "Folks",
      description: bio
    },
    twitter: {
      card: "summary_large_image",
      title: user ? `${user.display_name}` : "Folks",
      description: bio
    }
  };
}

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const username = (await params).username;
  const { tab } = await searchParams;

  const user = await ServerSession();

  const selectedUser = await prisma.user.findUnique({
    where: {
      username: username,
      deleted_at: null
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
          following: user && user.username === username ? true : false,
          followers: user && user.username === username ? true : false,
          articles: true,
          boards: {
            where: {
              public: true
            }
          }
        }
      }
    }
  });

  if (!selectedUser) {
    return notFound();
  }

  let isUser = false;

  if (user) {
    isUser = selectedUser.id === user?.id;
  }

  let blockedByUser = false;

  if (user) {
    const isBlockedByUser = await prisma.userBlocked.findUnique({
      where: {
        user_blocked_unique: {
          user_id: BigInt(user.id),
          target_id: BigInt(selectedUser.id)
        }
      }
    });

    if (isBlockedByUser) {
      blockedByUser = true;
    }
  }

  return (
    <MainContainer hideAbout={true}>
      <Profile
        queryTab={tab ? tab.toString() : undefined}
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
          ...(user && { blocked_by_user: blockedByUser }),
          count: {
            following: selectedUser._count.following || undefined,
            followers: selectedUser._count.followers || undefined,
            articles: selectedUser._count.articles ?? 0,
            boards: selectedUser._count.boards ?? 0
          }
        }}
        user={user}
        isUser={isUser}
      />
    </MainContainer>
  );
}
