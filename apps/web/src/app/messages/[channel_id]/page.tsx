import { Metadata } from "next";
import { notFound } from "next/navigation";

import { prisma } from "@folks/db";

import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { MessagesChannel } from "./messages_channel";

export async function generateMetadata({
  params
}: {
  params: Promise<{ channel_id: string }>;
}): Promise<Metadata> {
  const channel_id = (await params).channel_id;
  const user = await ServerSession();

  if (!user) {
    return {
      title: "Folks"
    };
  }

  const channel = await prisma.messageChannel.findUnique({
    where: {
      id: channel_id,
      members: {
        some: {
          user_id: BigInt(user.id)
        }
      }
    },
    include: {
      members: {
        where: {
          NOT: {
            user_id: BigInt(user.id)
          }
        },
        select: {
          user: {
            select: {
              username: true,
              display_name: true,
              avatar_url: true
            }
          }
        },
        take: 1
      }
    }
  });

  const title = channel
    ? `DMs with ${channel.name || channel.members[0].user.display_name}`
    : "Folks";

  return {
    title: title
  };
}

export default async function Page({
  params
}: {
  params: Promise<{ channel_id: string }>;
}) {
  const channel_id = (await params).channel_id;

  const user = await ServerSession();

  if (!user) {
    return notFound();
  }

  const channel = await prisma.messageChannel.findUnique({
    where: {
      id: channel_id,
      members: {
        some: {
          user_id: BigInt(user.id)
        }
      }
    },
    include: {
      members: {
        where: {
          NOT: {
            user_id: BigInt(user.id)
          }
        },
        select: {
          user: {
            select: {
              username: true,
              display_name: true,
              avatar_url: true
            }
          }
        }
      },
      _count: {
        select: {
          messages: true
        }
      }
    }
  });

  if (!channel) {
    return notFound();
  }

  const member = await prisma.messageChannelMember.findFirst({
    where: {
      channel_id: channel.id,
      user_id: user.id
    }
  });

  return (
    <MainContainer
      hideFooter={true}
      hideTopRibbon={false}
      hideBottomRibbon={true}
      hideTopSeparator={true}
      wide={true}
    >
      <MessagesChannel channel={channel} user={user} member={member} />
    </MainContainer>
  );
}
