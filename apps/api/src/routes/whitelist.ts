import { Router } from "express";

import { prisma } from "@folks/db";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { sendDiscordNotification } from "@/lib/send_discord_notification";
import { sendInviteEmail } from "@/lib/send_email";

const router = Router();

router.post("/", async (req: RequestWithUser, res) => {
  try {
    const { email, name, posts_cv_url } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Invalid request. Missing email or name."
      });
    }

    const existing_user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (existing_user) {
      return res.status(400).json({
        error: "email_already_exists",
        msg: "An account using this email already exists."
      });
    }

    const existing_whitelist = await prisma.whitelistRequest.findUnique({
      where: {
        email
      }
    });

    if (existing_whitelist && existing_whitelist.accepted_at) {
      return res.status(400).json({
        error: "already_whitelisted",
        msg: "You've already been invited. Check your email."
      });
    }

    if (existing_whitelist) {
      return res.status(400).json({
        error: "already_whitelisted",
        msg: "This email has already requested to join."
      });
    }

    await prisma.whitelistRequest.create({
      data: {
        email: email,
        name: name,
        posts_cv_url: posts_cv_url || undefined,
        created_at: new Date()
      }
    });

    await sendDiscordNotification(
      `${email} (${name}) just requested to join Folks!`
    );

    res.json({ ok: true });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

// admin only
router.get("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        super_admin: true
      }
    });

    if (!user) {
      return res.status(403).json({
        error: "invalid_request",
        msg: "Denied. You're not an admin."
      });
    }

    const whitelist = await prisma.whitelistRequest.findMany({});

    res.json({
      ok: true,
      data: {
        count: whitelist.length,
        whitelist: whitelist
          ? whitelist.map((wl) => {
              return {
                id: wl.id.toString(),
                email: wl.email,
                name: wl.name,
                posts_cv_url: wl.posts_cv_url,
                accepted_at: wl.accepted_at?.toISOString(),
                created_at: wl.created_at.toISOString(),
                updated_at: wl.updated_at.toISOString()
              };
            })
          : []
      }
    });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

// admin only
router.post("/accept", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Invalid request. Missing email."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        super_admin: true
      }
    });

    if (!user) {
      return res.status(403).json({
        error: "invalid_request",
        msg: "Denied. You're not an admin."
      });
    }

    sendInviteEmail(email);
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

export default router;
