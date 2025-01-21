import { Router } from "express";
import sanitizeHtml from "sanitize-html";

import { prisma } from "@folks/db";
import { schemas } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { posthog } from "@/lib/posthog";
import { redis } from "@/lib/redis";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const ribbon_cache = await redis.get("cache:ribbon");

    if (ribbon_cache) {
      res.json({
        ok: true,
        ribbon: ribbon_cache
      });
      return;
    }

    const ribbon_messages = await prisma.ribbon.findMany({
      include: {
        user: {
          select: {
            display_name: true
          }
        }
      },
      orderBy: {
        updated_at: "desc"
      }
    });

    const users = await prisma.user.findMany({
      select: {
        id: true
      }
    });

    const posts = await prisma.post.findMany({
      select: {
        id: true
      }
    });

    const ribbon_messages_string =
      ribbon_messages
        .map((ribbon_message) => {
          return `${ribbon_message.body} — ${ribbon_message.user.display_name}`;
        })
        .join(" · ") || "";

    const ribbon_string = `${users.length} People · ${posts.length} Posts · ${ribbon_messages.length} Ribbon Messages · ${ribbon_messages_string} · `;

    await redis.set("cache:ribbon", ribbon_string, "EX", 60 * 5);

    res.json({
      ok: true,
      ribbon: sanitizeHtml(ribbon_string)
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

router.post("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Message is required."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(401).json({
        error: "unauthorized"
      });
    }

    if (user.suspended) {
      return res.status(401).json({
        error: "suspended",
        msg: "Your account is suspended."
      });
    }

    try {
      await schemas.ribbonBodySchema.parseAsync(message);
    } catch (err) {
      return res.status(400).json({
        error: "invalid_request",
        msg: JSON.parse(err.message)[0].message
      });
    }

    const existing_ribbon = await prisma.ribbon.findFirst({
      where: {
        user_id: user.id
      }
    });

    if (existing_ribbon) {
      await prisma.ribbon.update({
        where: {
          id: existing_ribbon.id
        },
        data: {
          body: message
        }
      });
    } else {
      await prisma.ribbon.create({
        data: {
          user_id: user.id,
          body: message
        }
      });
    }

    await redis.del("cache:ribbon");

    await posthog.capture({
      distinctId: user.id.toString(),
      event: "ribbon_message",
      properties: {
        message: message
      }
    });

    res.json({ ok: true });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      msg: "Something went wrong."
    });
  }
});

export default router;
