import { Router } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "@folks/db";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { redis } from "@/lib/redis";

const router = Router();

router.get("/everything", async (req, res) => {
  try {
    const { cursor, limit } = req.query;

    const folks_sid = req.cookies.folks_sid;

    let user_id = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;
      }
    }

    const feed = await prisma.post.findMany({
      where: {
        deleted_at: null,
        reply_to_id: null
      },
      cursor: cursor
        ? {
            id: BigInt(cursor as any) - 1n
          }
        : undefined,
      take: limit ? Number(limit) : 20,
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
        highlighted: true,
        created_at: true,
        likes: user_id ? { where: { user_id: BigInt(user_id) } } : false,
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

    res.json({
      ok: true,
      feed: feed.map((post) => ({
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
          }
        })),
        likes:
          post.likes &&
          post.likes.map((like) => ({
            id: like.id.toString(),
            user_id: like.user_id.toString(),
            post_id: like.post_id.toString()
          })),
        highlighted: post.highlighted,
        count: {
          replies: post._count.replies,
          likes: post._count.likes
        }
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

router.get("/highlighted", async (req, res) => {
  try {
    const { cursor, limit } = req.query;

    const folks_sid = req.cookies.folks_sid;

    let user_id = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;
      }
    }

    const feed = await prisma.post.findMany({
      where: {
        deleted_at: null,
        highlighted: true
      },
      cursor: cursor
        ? {
            id: BigInt(cursor as any) - 1n
          }
        : undefined,
      take: limit ? Number(limit) : 20,
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
        highlighted: true,
        created_at: true,
        likes: user_id ? { where: { user_id: BigInt(user_id) } } : false,
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

    res.json({
      ok: true,
      feed: feed.map((post) => ({
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
          }
        })),
        likes:
          post.likes &&
          post.likes.map((like) => ({
            id: like.id.toString(),
            user_id: like.user_id.toString(),
            post_id: like.post_id.toString()
          })),
        highlighted: post.highlighted,
        count: {
          replies: post._count.replies,
          likes: post._count.likes
        }
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

router.get("/following", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { cursor, limit } = req.query;

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(400).json({
        error: "invalid_request",
        message: "User not found."
      });
    }

    const following = await prisma.following.findMany({
      where: {
        user_id: BigInt(req.user.id)
      },
      include: {
        target: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true
          }
        }
      },
      take: limit ? Number(limit) : 20
    });

    const feed = await prisma.post.findMany({
      where: {
        author_id: {
          in: following.map((following) => following.target_id)
        },
        deleted_at: null
      },
      cursor: cursor
        ? {
            id: BigInt(cursor as any) - 1n
          }
        : undefined,
      take: limit ? Number(limit) : 20,
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
        highlighted: true,
        created_at: true,
        likes: user.id ? { where: { user_id: BigInt(user.id) } } : false,
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

    res.json({
      ok: true,
      feed: feed.map((post) => ({
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
          }
        })),
        highlighted: post.highlighted,
        likes:
          post.likes &&
          post.likes.map((like) => ({
            id: like.id.toString(),
            user_id: like.user_id.toString(),
            post_id: like.post_id.toString()
          })),
        count: {
          replies: post._count.replies,
          likes: post._count.likes
        }
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

    const folks_sid = req.cookies.folks_sid;

    let user_id = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;
      }
    }

    const feed = await prisma.post.findMany({
      where: {
        author_id: BigInt(req.params.author_id),
        deleted_at: null,
        reply_to_id: null
      },
      cursor: cursor
        ? {
            id: BigInt(cursor as any) - 1n
          }
        : undefined,
      take: limit ? Number(limit) : 20,
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
        highlighted: true,
        created_at: true,
        likes: user_id ? { where: { user_id: BigInt(user_id) } } : false,
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

    res.json({
      ok: true,
      feed: feed.map((post) => ({
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
          }
        })),
        likes:
          post.likes &&
          post.likes.map((like) => ({
            id: like.id.toString(),
            user_id: like.user_id.toString(),
            post_id: like.post_id.toString()
          })),
        highlighted: post.highlighted,
        count: {
          replies: post._count.replies,
          likes: post._count.likes
        }
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
