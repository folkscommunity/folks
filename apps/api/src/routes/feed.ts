import { Router } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "@folks/db";
import { JSONtoString } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { redis } from "@/lib/redis";
import {
  getURLFromText,
  getURLMetadata,
  getURLMetadataFromCache
} from "@/lib/url_metadata";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const { cursor, type, user } = req.query;
    let { limit }: any = req.query;

    if (
      !type ||
      (type !== "everything" &&
        type !== "following" &&
        type !== "highlighted" &&
        type !== "user")
    ) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Invalid type."
      });
    }

    const folks_sid = req.cookies.folks_sid;

    let user_id = null;

    if (folks_sid) {
      const jwt_object: any = jwt.decode(folks_sid);

      const session = await redis.get(`session:${jwt_object.id}:${folks_sid}`);

      if (session) {
        user_id = jwt_object.id;
      }
    }

    if (Number(limit) > 50) {
      limit = 50;
    }

    const cursorId = cursor ? BigInt(cursor as any) : undefined;

    let where: any;

    if (type === "everything") {
      where = {
        deleted_at: null,
        imported: false
      };
    } else if (type === "highlighted") {
      where = {
        deleted_at: null,
        highlighted: true
      };
    } else if (type === "following") {
      if (!user_id) {
        return res.status(401).json({
          error: "unauthorized",
          message: "Not authorized."
        });
      }

      const following = await prisma.following.findMany({
        where: {
          user_id: BigInt(user_id)
        },
        include: {
          target: {
            select: {
              id: true
            }
          }
        }
      });

      where = {
        author_id: {
          in: following.map((following) => following.target_id),
          imported: false
        },
        deleted_at: null
      };
    } else if (type === "user") {
      if (!user) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Invalid user."
        });
      }

      try {
        BigInt(user.toString());
      } catch (e) {
        return res.status(400).json({
          error: "invalid_request",
          message: "Invalid user."
        });
      }

      where = {
        author_id: BigInt(user.toString()),
        reply_to_id: null,
        deleted_at: null
      };
    }

    const feed = await prisma.post.findMany({
      where: where,
      cursor: cursorId ? { id: cursorId } : undefined,
      skip: cursorId ? 1 : 0,
      take: limit ? Number(limit) : 20,
      orderBy: {
        created_at: "desc"
      },
      select: {
        id: true,
        body: true,
        flags: true,
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
            },
            flags: true
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
            },
            flags: true
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

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        feed: await Promise.all(
          feed.map(async (post) => {
            const urls = await getURLFromText(post.body);

            return {
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
              },
              urls: urls
            };
          })
        ),
        nextCursor:
          feed.length > 0 ? feed[feed.length - 1].id.toString() : undefined
      })
    );
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.get("/metadata", async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Invalid URL."
      });
    }

    const url_metadata = await getURLMetadataFromCache(url.toString());

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true, data: url_metadata }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.post(
  "/pin-highlighted",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const { id } = req.body;

      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user || !user.super_admin) {
        return res.status(401).json({
          error: "unauthorized",
          message: "Not authorized."
        });
      }

      if (id && id !== null) {
        await redis.set(`pinned_post:highlighted`, id);
      } else {
        await redis.del(`pinned_post:highlighted`);
      }

      res.setHeader("Content-Type", "application/json");
      res.send(
        JSONtoString({
          ok: true
        })
      );
    } catch (e) {}
  }
);

export default router;
