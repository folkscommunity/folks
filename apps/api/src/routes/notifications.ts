import { Router } from "express";

import { NotificationEndpointType, prisma } from "@folks/db";
import { JSONtoString } from "@folks/utils";
import { NotificationType } from "@folks/utils/notification_types";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { posthog } from "@/lib/posthog";

const router = Router();

router.get("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const last_read_at = user.notifications_last_read_at || new Date(0);

    const likes = await prisma.postLike.findMany({
      where: {
        post: {
          author: {
            id: user.id
          }
        },
        user_id: {
          not: user.id
        }
      },
      include: {
        user: {
          select: {
            username: true,
            display_name: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const likes_formated = likes.map((like) => ({
      user_id: like.user_id.toString(),
      post_id: like.post_id.toString(),
      username: like.user.username,
      display_name: like.user.display_name,
      type: NotificationType.Like,
      created_at: like.created_at
    }));

    const follows = await prisma.following.findMany({
      where: {
        target_id: user.id
      },
      include: {
        user: {
          select: {
            username: true,
            display_name: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const follows_formated = follows.map((follow) => ({
      user_id: follow.user_id.toString(),
      username: follow.user.username,
      display_name: follow.user.display_name,
      type: NotificationType.Follow,
      created_at: follow.created_at
    }));

    const replies = await prisma.post.findMany({
      where: {
        reply_to: {
          author: {
            id: user.id
          }
        },
        NOT: {
          author: {
            id: user.id
          }
        },
        deleted_at: null
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            display_name: true
          }
        },
        reply_to: {
          select: {
            id: true
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const replies_formated = replies.map((reply) => ({
      user_id: reply.author.id.toString(),
      post_id: reply.reply_to.id.toString(),
      reply_id: reply.id.toString(),
      username: reply.author.username,
      display_name: reply.author.display_name,
      type: NotificationType.Reply,
      created_at: reply.created_at
    }));

    const post_mentions = await prisma.postMention.findMany({
      where: {
        user_id: user.id
      },
      include: {
        post: {
          select: {
            author_id: true,
            author: {
              select: {
                username: true,
                display_name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    const post_mentions_formated = post_mentions.map((mention) => ({
      user_id: mention.post.author_id.toString(),
      post_id: mention.post_id.toString(),
      username: mention.post.author.username,
      display_name: mention.post.author.display_name,
      type: NotificationType.Mention,
      created_at: mention.created_at
    }));

    const combined = [
      ...likes_formated,
      ...follows_formated,
      ...replies_formated,
      ...post_mentions_formated
    ]
      .sort((a, b) => {
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      })
      .map((d) => ({
        ...d,
        read: user.notifications_last_read_at
          ? d.created_at <= user.notifications_last_read_at
          : false
      }));

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: {
          unread_count: combined.filter((d) => !d.read).length,
          notifications: combined,
          last_read_at: last_read_at
        }
      })
    );
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.post("/read", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_request" });
    }

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        notifications_last_read_at: new Date()
      }
    });

    await posthog.capture({
      distinctId: user.id.toString(),
      event: "mark_all_notifications_as_read"
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true
      })
    );
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.post(
  "/register/web",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: {
          id: BigInt(req.user.id)
        }
      });

      if (!user) {
        return res.status(400).json({ error: "invalid_request" });
      }

      const { sub } = req.body;

      if (
        !sub ||
        !sub.endpoint ||
        !sub.keys ||
        !sub.keys.auth ||
        !sub.keys.p256dh
      ) {
        return res.status(400).json({ error: "invalid_request" });
      }

      const id = sub.keys.auth + sub.keys.p256dh;

      const user_agent = req.headers["user-agent"];

      const existing = await prisma.notificationEndpoint.findFirst({
        where: {
          id: id,
          user_id: user.id
        }
      });

      if (existing) {
        return res.status(400).json({ error: "already_registered" });
      }

      await prisma.notificationEndpoint.create({
        data: {
          id: id,
          user_id: user.id,
          endpoint: sub,
          type: NotificationEndpointType.WEBPUSH,
          user_agent: user_agent
        }
      });

      res.setHeader("Content-Type", "application/json");

      await posthog.capture({
        distinctId: user.id.toString(),
        event: "register_notification_endpoint",
        properties: {
          endpoint_type: "webpush",
          endpoint_id: id
        }
      });

      res.send(
        JSONtoString({
          ok: true
        })
      );
    } catch (err) {
      console.error(err);

      res.status(500).json({ error: "server_error" });
    }
  }
);

export default router;
