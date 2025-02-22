import { notFound } from "next/navigation";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { CreateArticle } from "./create-article";

export default async function Page() {
  const user = await ServerSession();

  if (!user) {
    return notFound();
  }

  return (
    <MainContainer>
      <CreateArticle user={user} />
    </MainContainer>
  );
}
