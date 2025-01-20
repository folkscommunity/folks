import { Router } from "express";

import { prisma } from "@folks/db";

import { RequestWithUser } from "@/lib/auth_middleware";

const router = Router();

router.post("/", async (req: RequestWithUser, res) => {
  try {
    const { email, name, posts_cv_url } = req.body;

    console.log(req.body);

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

    res.json({ ok: true });
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

export default router;
