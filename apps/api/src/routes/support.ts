import { Router } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "@folks/db";
import { JSONtoString, schemas } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { redis } from "@/lib/redis";
import { sendDiscordNotification } from "@/lib/send_discord_notification";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { email, body, type } = req.body;

    const ip =
      req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"];

    const rate_limit = await redis.get(`rate_limit:support:${ip}`);

    if (Number(rate_limit) > 5) {
      return res.status(429).json({
        error: "rate_limit_exceeded",
        msg: "You have exceeded the rate limit. Please try again in a few minutes."
      });
    }

    if (!email || !body || !type) {
      return res
        .status(400)
        .json({ error: "invalid_request", msg: "Invalid request." });
    }

    try {
      await schemas.emailSchema.parseAsync(email);
      await schemas.supportRequestBodySchema.parseAsync(body);
    } catch (err) {
      return res.status(400).json({
        error: "invalid_request",
        message: JSON.parse(err.message)[0].message
      });
    }

    if (type.length > 40) {
      return res.status(400).json({
        error: "invalid_request",
        message: "Type must be less than 40 characters."
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

    await prisma.supportRequest.create({
      data: {
        email: email,
        body: body,
        type: type,
        user_id: user_id || undefined
      }
    });

    await sendDiscordNotification(
      `[${type}] **${email}** has sent a support request.\n\n**Body:**\n${body}`
    );

    await redis.set(
      `rate_limit:support:${ip}`,
      Number(rate_limit) + 1,
      "EX",
      60
    );

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user || !user.super_admin) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const support_requests = await prisma.supportRequest.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            display_name: true,
            email: true,
            avatar_url: true
          }
        }
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: support_requests || []
      })
    );
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.post("/:id", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { id } = req.params;

    const { completed } = req.body;

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user || !user.super_admin) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const support_request = await prisma.supportRequest.findUnique({
      where: {
        id: id
      }
    });

    if (!support_request) {
      return res.status(400).json({ error: "invalid_request" });
    }

    await prisma.supportRequest.update({
      where: {
        id: support_request.id
      },
      data: {
        completed_at: completed ? new Date() : null
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

export default router;
