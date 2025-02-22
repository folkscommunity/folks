"use server";

import { notFound } from "next/navigation";

import { prisma } from "@folks/db";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { EditArticle } from "./edit-article";

export default async function Page({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await ServerSession();

  if (!user) {
    return notFound();
  }

  const { id } = await params;

  try {
    await BigInt(id);
  } catch (err) {
    return notFound();
  }

  const article = await prisma.article.findUnique({
    where: {
      id: BigInt(id),
      author: {
        id: BigInt(user.id)
      }
    }
  });

  if (!article) {
    return notFound();
  }

  return (
    <MainContainer>
      <EditArticle
        article_id={article.id}
        user={user}
        content={article.body}
        slug={article.slug}
        title={article.title}
        published={article.published}
        published_at={article.published_at}
      />
    </MainContainer>
  );
}
