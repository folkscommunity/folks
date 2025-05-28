import { Router } from "express";

import { prisma } from "@folks/db";
import { JSONtoString } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import {
  sendMobileNotification,
  sendNotification
} from "@/lib/notification_utils";
import { posthog } from "@/lib/posthog";

const router = Router();

router.post("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { target_id } = req.body;

    if (!target_id) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        deleted_at: null
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_request" });
    }

    if (user.id === BigInt(target_id)) {
      return res.status(400).json({ error: "cannot_follow_self" });
    }

    const target = await prisma.user.findUnique({
      where: {
        id: target_id,
        deleted_at: null
      }
    });

    if (!target) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const following = await prisma.following.findFirst({
      where: {
        user_id: user.id,
        target_id: target.id
      }
    });

    if (following) {
      return res.status(400).json({ error: "already_following" });
    }

    await prisma.following.create({
      data: {
        user_id: user.id,
        target_id: target.id
      }
    });

    await posthog.capture({
      distinctId: req.user.id.toString(),
      event: "follow",
      properties: {
        target_id: target.id.toString()
      }
    });

    const blocked_users = await prisma.userBlocked.findMany({
      where: {
        target_id: user.id
      }
    });

    console.log(blocked_users);

    if (
      target.notifications_push_followed &&
      !blocked_users.map((u) => u.target_id).includes(user.id)
    ) {
      await sendNotification({
        user_id: target.id,
        title: "Folks",
        body: `${user.display_name} followed you.`,
        url: `/${user.username}`
      });

      await sendMobileNotification({
        user_id: target.id,
        title: `${user.display_name})`,
        body: `followed you.`,
        url: `/user/${user.username}`
      });
    }

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.delete("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { target_id } = req.body;

    if (!target_id) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        deleted_at: null
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_request" });
    }

    if (user.id === BigInt(target_id)) {
      return res.status(400).json({ error: "cannot_follow_self" });
    }

    const target = await prisma.user.findUnique({
      where: {
        id: target_id
      }
    });

    if (!target) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const following = await prisma.following.findFirst({
      where: {
        user_id: user.id,
        target_id: target.id
      }
    });

    if (!following) {
      return res.status(400).json({ error: "not_following" });
    }

    await prisma.following.delete({
      where: {
        id: following.id
      }
    });

    await posthog.capture({
      distinctId: req.user.id.toString(),
      event: "unfollow",
      properties: {
        target_id: target.id.toString()
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/following", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        deleted_at: null
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const following = await prisma.following.findMany({
      where: {
        user_id: user.id
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
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: {
          count: following.length,
          following:
            following && following.length > 0
              ? following.map((f) => {
                  return {
                    id: f.id.toString(),
                    username: f.target.username,
                    display_name: f.target.display_name,
                    avatar_url: f.target.avatar_url
                  };
                })
              : []
        }
      })
    );
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/followers", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        deleted_at: null
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const followers = await prisma.following.findMany({
      where: {
        target_id: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true
          }
        }
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: {
          count: followers.length,
          followers:
            followers && followers.length > 0
              ? followers.map((f) => {
                  return {
                    id: f.id.toString(),
                    username: f.user.username,
                    display_name: f.user.display_name,
                    avatar_url: f.user.avatar_url
                  };
                })
              : []
        }
      })
    );
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/:target_id", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { target_id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const target = await prisma.user.findUnique({
      where: {
        id: BigInt(target_id),
        deleted_at: null
      }
    });

    if (!target) {
      return res.status(400).json({ error: "user_not_found" });
    }

    const following = await prisma.following.findFirst({
      where: {
        user_id: user.id,
        target_id: target.id
      }
    });

    if (!following) {
      return res.status(200).json({
        ok: true,
        data: {
          following: false
        }
      });
    }

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: {
          following: true
        }
      })
    );
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

export default router;
