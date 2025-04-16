import { Metadata } from "next";

import { prisma, RoadmapItemStatus } from "@folks/db";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { Roadmap } from "./roadmap";

export const metadata: Metadata = {
  title: "Folks – Roadmap"
};

export default async function Page() {
  const user = await ServerSession();

  const roadmapItems = await prisma.roadmapItem.findMany({
    where: {
      status: {
        in: [
          RoadmapItemStatus.SUGGESTED,
          RoadmapItemStatus.PLANNED,
          RoadmapItemStatus.IN_PROGRESS
        ]
      }
    },
    orderBy: {
      created_at: "desc"
    }
  });

  return (
    <MainContainer hideAbout={true}>
      <Roadmap
        user={{
          id: user ? user.id : null,
          super_admin: user ? user.super_admin : false
        }}
        items={roadmapItems}
      />
    </MainContainer>
  );
}
