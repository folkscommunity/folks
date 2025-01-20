import argon2 from "argon2";
import { Router } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "@folks/db";
import { schemas } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { redis } from "@/lib/redis";
import { sendVerifyEmail } from "@/lib/send_email";

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

    if (user.suspended) {
      return res.status(400).json({ error: "account_suspended" });
    }

    res.json({
      ok: true,
      data: {
        id: user.id.toString(),
        email: user.email,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        occupation: user.occupation,
        location: user.location,
        pronouns: user.pronouns,
        website: user.website,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

// POST @/api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, username, display_name } = req.body;

    if (!email || !password || !username || !display_name) {
      return res.status(400).json({ error: "invalid_request" });
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

    const whitelist = await prisma.whitelistRequest.findUnique({
      where: {
        email: email,
        accepted_at: {
          not: null
        }
      }
    });

    if (!whitelist) {
      return res.status(400).json({
        error: "not_whitelisted",
        msg: "Your email has not been invited yet, we are slowly onboarding new users."
      });
    }

    const existing_username = await prisma.user.findUnique({
      where: {
        username
      }
    });

    if (existing_username) {
      return res.status(400).json({
        error: "username_taken",
        msg: "An account using this username already exists."
      });
    }

    try {
      await schemas.emailSchema.parseAsync(email);
      await schemas.usernameSchema.parseAsync(username);
      await schemas.displayNameSchema.parseAsync(display_name);
      await schemas.passwordSchema.parseAsync(password);
    } catch (err) {
      return res.status(400).json({
        error: "invalid_request",
        message: JSON.parse(err.message)[0].message
      });
    }

    const hashed_password = await argon2.hash(password);

    const created_user = await prisma.user.create({
      data: {
        email: email,
        username: username.toLowerCase(),
        display_name: display_name,
        password_hash: hashed_password
      }
    });

    const token = jwt.sign(
      { id: created_user.id.toString() },
      process.env.JWT_SECRET!
    );

    const ip =
      req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"];
    const user_agent = req.headers["user-agent"];

    await redis.set(
      `session:${created_user.id.toString()}:${token}`,
      JSON.stringify({
        user_id: created_user.id.toString(),
        ip: ip,
        user_agent: user_agent,
        created_at: new Date().toISOString()
      }),
      "EX",
      60 * 60 * 24 * 180
    );

    res.cookie("folks_sid", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 180,
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? "folkscommunity.com"
          : ".localhost",
      secure: process.env.NODE_ENV === "production"
    });

    sendVerifyEmail(created_user.id.toString());

    await redis.del(`cache:ribbon`);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

// POST @/api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const ip_address =
      req.headers["x-forwarded-for"] ||
      req.headers["cf-connecting-ip"] ||
      email;

    const rate_limit = await redis.get(`rate_limit:login:${ip_address}`);

    if (Number(rate_limit) > 10) {
      return res.status(429).json({
        error: "rate_limit_exceeded",
        msg: "You have exceeded the rate limit. Please try again in a few minutes. If you continue to experience issues, please contact help@folkscommunity.com."
      });
    } else {
      await redis.set(
        `rate_limit:login:${ip_address}`,
        Number(rate_limit) + 1,
        "EX",
        300
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email
      }
    });

    if (!user) {
      return res.status(400).json({
        error: "invalid_credentials",
        msg: "The email or password you entered is incorrect."
      });
    }

    const ip =
      req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"];
    const user_agent = req.headers["user-agent"];

    const isValid = await argon2.verify(user.password_hash, password);

    if (!isValid) {
      return res.status(400).json({
        error: "invalid_credentials",
        msg: "The email or password you entered is incorrect."
      });
    }

    const token = jwt.sign({ id: user.id.toString() }, process.env.JWT_SECRET!);

    await redis.set(
      `session:${user.id.toString()}:${token}`,
      JSON.stringify({
        user_id: user.id.toString(),
        ip: ip,
        user_agent: user_agent,
        created_at: new Date().toISOString()
      }),
      "EX",
      60 * 60 * 24 * 180
    );

    res.cookie("folks_sid", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 180,
      sameSite: "lax",
      domain:
        process.env.NODE_ENV === "production"
          ? "folkscommunity.com"
          : ".localhost",
      secure: process.env.NODE_ENV === "production"
    });

    await redis.del(`rate_limit:login:${ip_address}`);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/logout", async (req, res) => {
  try {
    const token = req.cookies.folks_sid;

    if (!token) {
      return res.status(400).json({ error: "invalid_credentials" });
    }

    const jwt_object = jwt.decode(token) as {
      id: string;
    };

    await redis.del(`session:${jwt_object.id}:${token}`);

    res.clearCookie("folks_sid");

    res.redirect("/");
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        email_token: token
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
        email_token: null,
        email_verified: true
      }
    });

    res.redirect("/");
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

export default router;
