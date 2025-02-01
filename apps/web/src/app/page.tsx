import { Suspense } from "react";

import { Feeds } from "@/components/feeds";
import { MainContainer } from "@/components/main-container";
import { redis } from "@/lib/redis";
import { ServerSession } from "@/lib/server-session";

export default async function Home() {
  const user = await ServerSession();

  const highlighted_pinned_post =
    (await redis.get("pinned_post:highlighted")) || null;

  return (
    <MainContainer>
      <Feeds
        is_authed={Boolean(user)}
        user={user}
        highlighted_pinned_post={highlighted_pinned_post}
      />
    </MainContainer>
  );
}
