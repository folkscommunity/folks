import { notFound } from "next/navigation";

import { prisma } from "@folks/db";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Articles } from "./articles";

export default async function Page() {
  const user = await ServerSession();

  if (!user) {
    return notFound();
  }

  const articles = await prisma.article.findMany({
    where: {
      author: {
        id: user.id
      },
      deleted_at: null
    },
    orderBy: {
      created_at: "desc"
    }
  });

  return (
    <MainContainer>
      <Articles articles={articles} />
    </MainContainer>
  );
}
