import { title } from "process";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@folks/db";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Boards } from "./boards";

export const metadata: Metadata = {
  title: "Folks – Boards"
};

export default async function BoardsPage() {
  const user = await ServerSession();

  if (!user) {
    return notFound();
  }

  const boards = await prisma.board.findMany({
    where: {
      user_id: BigInt(user.id)
    },
    include: {
      _count: {
        select: {
          items: true
        }
      },
      items: {
        where: {
          type: "Image"
        },
        select: {
          id: true,
          url: true,
          width: true,
          height: true
        },
        orderBy: {
          created_at: "desc"
        },
        take: 4
      }
    },
    orderBy: {
      created_at: "asc"
    }
  });

  return (
    <MainContainer>
      <Boards
        aBoards={boards.map((d) => {
          return {
            id: d.id,
            name: d.name,
            public: d.public,
            items: d.items,
            count: {
              items: d._count.items ?? 0
            }
          };
        })}
      />
    </MainContainer>
  );
}
