import { prisma } from "@folks/db";

import NotFound from "@/app/not-found";
import { MainContainer } from "@/components/main-container";
import { ServerSession } from "@/lib/server-session";

import { SinglePost } from "./single-post";

export default async function Page({
  params
}: {
  params: Promise<{ post_id: string }>;
}) {
  const post_id = (await params).post_id;

  if (!post_id) {
    return <NotFound />;
  }

  try {
    BigInt(post_id);
  } catch (e) {
    return <NotFound />;
  }

  const user = await ServerSession();

  const post = await prisma.post.findUnique({
    where: {
      id: BigInt(post_id),
      deleted_at: null
    },
    select: {
      id: true,
      body: true,
      reply_to: {
        select: {
          id: true,
          body: true,
          author: {
            select: {
              id: true,
              username: true,
              display_name: true,
              avatar_url: true
            }
          }
        }
      },
      replies: {
        where: {
          deleted_at: null
        },
        orderBy: {
          created_at: "asc"
        },
        select: {
          id: true,
          created_at: true,
          body: true,
          reply_to: {
            select: {
              id: true,
              author: {
                select: {
                  username: true,
                  display_name: true
                }
              }
            }
          },
          attachments: {
            select: {
              id: true,
              url: true,
              type: true,
              height: true,
              width: true
            }
          },
          likes:
            user && user.id
              ? { where: { user_id: BigInt(user.id) } }
              : undefined,
          author: {
            select: {
              id: true,
              avatar_url: true,
              display_name: true,
              username: true
            }
          },
          _count: {
            select: {
              replies: {
                where: {
                  deleted_at: null
                }
              },
              likes: true
            }
          }
        }
      },
      attachments: {
        select: {
          id: true,
          url: true,
          type: true,
          height: true,
          width: true
        }
      },
      author: {
        select: {
          id: true,
          avatar_url: true,
          display_name: true,
          username: true
        }
      },
      created_at: true,
      likes:
        user && user.id ? { where: { user_id: BigInt(user.id) } } : undefined,
      _count: {
        select: {
          replies: {
            where: {
              deleted_at: null
            }
          },
          likes: true
        }
      }
    }
  });

  if (!post) {
    return <NotFound />;
  }

  return (
    <MainContainer>
      <SinglePost
        post={{
          ...post,
          id: post.id.toString(),
          author: {
            ...post.author,
            id: post.author.id.toString()
          },
          reply_to: post.reply_to
            ? {
                ...post.reply_to,
                id: post.reply_to.id.toString(),
                author: {
                  ...post.reply_to.author,
                  id: post.reply_to.author.id.toString()
                }
              }
            : {},
          replies: post.replies.map((reply) => ({
            ...reply,
            id: reply.id.toString(),
            author: {
              ...reply.author,
              id: reply.author.id.toString()
            },
            reply_to: {
              ...reply.reply_to,
              id: reply.reply_to?.id.toString()
            },
            count: {
              replies: reply._count.replies,
              likes: reply._count.likes
            }
          })),
          likes: post.likes.map((like) => ({
            id: like.id.toString(),
            user_id: like.user_id.toString(),
            post_id: like.post_id.toString()
          })),
          count: {
            replies: post._count.replies,
            likes: post._count.likes
          }
        }}
        user={user}
      />
    </MainContainer>
  );
}
