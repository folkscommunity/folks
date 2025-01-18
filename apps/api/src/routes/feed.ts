import { Router } from "express";

import { prisma } from "@folks/db";

const router = Router();

router.get("/everything", async (req, res) => {
  try {
    const { cursor, limit } = req.query;

    const feed = await prisma.post.findMany({
      cursor: cursor
        ? {
            id: BigInt(cursor as any)
          }
        : undefined,
      take: limit ? Number(limit) : 50,
      orderBy: {
        created_at: "desc"
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
          select: {
            id: true,
            created_at: true,
            body: true,
            author: {
              select: {
                id: true,
                avatar_url: true,
                display_name: true,
                username: true
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
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    res.json({
      ok: true,
      feed: feed.map((post) => ({
        ...post,
        id: post.id.toString(),
        author: {
          ...post.author,
          id: post.author.id.toString()
        },
        replies: post.replies.map((reply) => ({
          ...reply,
          id: reply.id.toString(),
          author: {
            ...reply.author,
            id: reply.author.id.toString()
          }
        }))
      })),
      nextCursor:
        feed && feed.length > 0
          ? feed[feed.length - 1].id.toString()
          : undefined
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.get("/user/:author_id", async (req, res) => {
  try {
    const { cursor, limit } = req.query;

    const feed = await prisma.post.findMany({
      where: {
        author_id: BigInt(req.params.author_id)
      },
      cursor: cursor
        ? {
            id: BigInt(cursor as any)
          }
        : undefined,
      take: limit ? Number(limit) : 50,
      orderBy: {
        created_at: "desc"
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
          select: {
            id: true,
            created_at: true,
            body: true,
            author: {
              select: {
                id: true,
                avatar_url: true,
                display_name: true,
                username: true
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
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    res.json({
      ok: true,
      feed: feed.map((post) => ({
        ...post,
        id: post.id.toString(),
        author: {
          ...post.author,
          id: post.author.id.toString()
        },
        replies: post.replies.map((reply) => ({
          ...reply,
          id: reply.id.toString(),
          author: {
            ...reply.author,
            id: reply.author.id.toString()
          }
        }))
      })),
      nextCursor:
        feed && feed.length > 0
          ? feed[feed.length - 1].id.toString()
          : undefined
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

export default router;
