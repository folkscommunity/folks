import { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@folks/db";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Board } from "./board";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const user = await ServerSession();
  const { id } = await params;

  const board = await prisma.board.findUnique({
    where: {
      id: id,
      OR: user
        ? [
            {
              public: true
            },
            {
              user_id: BigInt(user.id)
            }
          ]
        : [
            {
              public: true
            }
          ]
    },
    include: {
      user: {
        select: {
          username: true,
          display_name: true,
          avatar_url: true,
          id: true
        }
      }
    }
  });

  return {
    title: board ? `${board.name} by ${board.user.display_name}` : "Folks"
  };
}

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await ServerSession();
  const { id } = await params;

  const board = await prisma.board.findUnique({
    where: {
      id: id,
      OR: user
        ? [
            {
              public: true
            },
            {
              user_id: BigInt(user.id)
            }
          ]
        : [
            {
              public: true
            }
          ]
    },
    include: {
      items: {
        select: {
          id: true,
          type: true,
          url: true,
          width: true,
          height: true,
          created_at: true
        },
        orderBy: {
          created_at: "desc"
        }
      },
      user: {
        select: {
          username: true,
          display_name: true,
          avatar_url: true,
          id: true
        }
      }
    }
  });

  if (!board) {
    return notFound();
  }

  return (
    <MainContainer hideAbout={true} hideFooter={true} hideBottomRibbon={true}>
      <Board
        id={id}
        board={board}
        isUser={user && user.id === board.user_id}
        loaded_items={board.items.map((d) => {
          return {
            id: d.id,
            type: d.type,
            url: d.url,
            width: d.width,
            height: d.height,
            created_at: d.created_at
          };
        })}
      />
    </MainContainer>
  );
}
