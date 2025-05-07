import { randomUUID } from "crypto";
import argon2 from "argon2";
import { Router } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "@folks/db";
import { JSONtoString, restricted_usernames, schemas } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { posthog } from "@/lib/posthog";
import { redis } from "@/lib/redis";
import { sendDiscordNotification } from "@/lib/send_discord_notification";
import {
  sendPasswordResetConfirmation,
  sendPasswordResetRequest,
  sendVerifyEmail
} from "@/lib/send_email";

const router = Router();

const WHITELIST_NEEDED = false;

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

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
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
          created_at: user.created_at,
          email_verified: user.email_verified,
          notifications_last_read_at: user.notifications_last_read_at,
          marketing_emails: user.marketing_emails,
          ...(user.super_admin && {
            super_admin: true
          })
        }
      })
    );
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

// POST @/api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { email, password, username, display_name, mobile } = req.body;

    if (!email || !password || !username || !display_name) {
      return res.status(400).json({ error: "invalid_request" });
    }

    if (restricted_usernames.includes(username.toLowerCase())) {
      return res.status(400).json({ error: "username_taken" });
    }

    const ip =
      req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"];
    const user_agent = req.headers["user-agent"];

    const rate_limit_24h = await redis.get(`rate_limit:register:${ip}:24h`);

    if (Number(rate_limit_24h) > 15) {
      return res.status(429).json({
        error: "rate_limit_exceeded_24h",
        msg: "You have exceeded the upper rate limit. Please contact help@folkscommunity.com."
      });
    }

    const rate_limit_5m = await redis.get(`rate_limit:register:${ip}:5m`);

    if (Number(rate_limit_5m) > 5) {
      return res.status(429).json({
        error: "rate_limit_exceeded_5m",
        msg: "You have exceeded the rate limit. Please try again in 10 minutes. If you continue to experience issues, please contact help@folkscommunity.com."
      });
    }

    await redis.set(
      `rate_limit:register:${ip}:24h`,
      Number(rate_limit_24h) + 1,
      "EX",
      60 * 60 * 24
    );

    await redis.set(
      `rate_limit:register:${ip}:5m`,
      Number(rate_limit_5m) + 1,
      "EX",
      60 * 5
    );

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

    if (WHITELIST_NEEDED) {
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

    if (!mobile) {
      res.cookie("folks_sid", token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 180,
        sameSite: "strict",
        domain:
          process.env.NODE_ENV === "production"
            ? "folkscommunity.com"
            : undefined,
        secure: process.env.NODE_ENV === "production"
      });
    }

    sendVerifyEmail(created_user.id.toString());

    await redis.del(`cache:ribbon`);

    await sendDiscordNotification(
      `${created_user.display_name} (@${created_user.username}) just registered their account!`
    );

    await posthog.capture({
      distinctId: created_user.id.toString(),
      event: "register",
      properties: {
        ip_address: ip,
        user_agent: user_agent,
        mobile: mobile
      }
    });

    await redis.del(`rate_limit:register:${ip}:5m`);

    res.setHeader("Content-Type", "application/json");
    if (mobile) {
      res.send(JSONtoString({ ok: true, token: token }));
    } else {
      res.send(JSONtoString({ ok: true }));
    }
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

// POST @/api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, mobile } = req.body;

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

    if (!mobile) {
      res.cookie("folks_sid", token, {
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 180,
        sameSite: "strict",
        domain:
          process.env.NODE_ENV === "production"
            ? "folkscommunity.com"
            : undefined,
        secure: process.env.NODE_ENV === "production"
      });
    }

    await redis.del(`rate_limit:login:${ip_address}`);

    await posthog.capture({
      distinctId: user.id.toString(),
      event: "login",
      properties: {
        ip_address: ip_address,
        user_agent: user_agent,
        mobile: mobile
      }
    });

    res.setHeader("Content-Type", "application/json");
    if (mobile) {
      res.send(JSONtoString({ ok: true, token: token }));
    } else {
      res.send(JSONtoString({ ok: true }));
    }
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/logout", async (req, res) => {
  try {
    const token =
      req.cookies.folks_sid ||
      req.headers.authorization ||
      req.headers.Authorization;

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

    await posthog.capture({
      distinctId: user.id.toString(),
      event: "email_verified"
    });

    res.redirect("/");
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.post("/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        email_token: token
      }
    });

    if (!user) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Invalid verification token, please try again."
      });
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

    await posthog.capture({
      distinctId: user.id.toString(),
      event: "email_verified"
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
  "/resend-email",
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

      if (user.email_verified) {
        return res.status(400).json({ error: "email_already_verified" });
      }

      const rate_24h = await redis.get(`rate_limit:verify:${user.email}:24h`);

      if (Number(rate_24h) > 10) {
        return res.status(429).json({
          error: "rate_limit_exceeded_24h",
          msg: "You have exceeded the upper rate limit. Please contact help@folkscommunity.com."
        });
      }

      const rate_5m = await redis.get(`rate_limit:verify:${user.email}:5m`);

      if (Number(rate_5m) > 5) {
        return res.status(429).json({
          error: "rate_limit_exceeded_5m",
          msg: "You have exceeded the rate limit. Please try again in 10 minutes. If you continue to experience issues, please contact help@folkscommunity.com."
        });
      }

      const last_sent = await redis.get(
        `rate_limit:verify:${user.email}:last_sent`
      );

      if (last_sent) {
        return res.status(429).json({
          error: "rate_limit_exceeded_60s",
          msg: "Please wait for 60 seconds before trying again, and check your spam folder if you haven't received the email yet."
        });
      }

      sendVerifyEmail(user.id.toString());

      await posthog.capture({
        distinctId: user.id.toString(),
        event: "resend_verification_email"
      });

      await redis.set(
        `rate_limit:verify:${user.email}:24h`,
        Number(rate_24h) + 1,
        "EX",
        60 * 60 * 24
      );

      await redis.set(
        `rate_limit:verify:${user.email}:5m`,
        Number(rate_5m) + 1,
        "EX",
        60 * 5
      );

      await redis.set(
        `rate_limit:verify:${user.email}:last_sent`,
        new Date().toISOString(),
        "EX",
        60
      );

      res.setHeader("Content-Type", "application/json");
      res.send(JSONtoString({ ok: true }));
    } catch (err) {
      console.error(err);

      res.status(500).json({ error: "server_error" });
    }
  }
);

router.post("/reset/request", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Invalid request."
      });
    }

    const rate_limit_24h = await redis.get(
      `rate_limit:reset_request:${email}:24h`
    );

    if (rate_limit_24h && Number(rate_limit_24h) > 4) {
      return res.status(429).json({
        error: "rate_limit",
        msg: "Too many requests. Please try again later or contact help@folkscommunity.com for assistance."
      });
    }

    const rate_limit = await redis.get(`rate_limit:reset_request:${email}`);

    if (rate_limit) {
      return res.status(429).json({
        error: "rate_limit",
        msg: "Too many requests. Please try again in 5 minutes."
      });
    }
    const ip =
      req.headers["x-forwarded-for"] || req.headers["cf-connecting-ip"];

    const ip_rate_limit = await redis.get(`rate_limit:reset_request:${ip}:ip`);

    if (ip_rate_limit && Number(ip_rate_limit) > 5) {
      return res.status(429).json({
        error: "rate_limit",
        msg: "Too many requests. Please try again later or contact help@folkscommunity.com for assistance."
      });
    }

    await redis.set(
      `rate_limit:reset_request:${ip}:ip`,
      Number(ip_rate_limit) + 1,
      "EX",
      60 * 30
    );

    const user = await prisma.user.findUnique({
      where: {
        email: email
      }
    });

    if (!user) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "User not found."
      });
    }

    const expires = new Date(Date.now() + 1000 * 60 * 20);
    const generate_reset_password_token = (
      randomUUID() + randomUUID()
    ).replaceAll("-", "");

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        reset_password_token: generate_reset_password_token,
        reset_password_expires: expires
      }
    });

    await redis.set(
      `rate_limit:reset_password:${user.id}`,
      Number(rate_limit) + 1,
      "EX",
      300
    );

    await redis.set(
      `rate_limit:reset_password:${user.id}:24h`,
      Number(rate_limit_24h) + 1,
      "EX",
      60 * 60 * 24
    );

    await sendPasswordResetRequest(
      user.email,
      user.display_name,
      `reset-password/${generate_reset_password_token}`
    );

    await posthog.capture({
      distinctId: user.id.toString(),
      event: "password_reset_requested"
    });

    return res.status(200).json({
      ok: true,
      msg: "Your password reset request has been sent."
    });
  } catch (e) {
    console.error(e);

    return res.status(500).json({
      ok: false,
      error: "An error occurred while resetting your password."
    });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Invalid request."
      });
    }

    try {
      await schemas.passwordSchema.parseAsync(password);
    } catch (err) {
      return res.status(400).json({
        error: "invalid_request",
        msg: JSON.parse(err.message)[0].message
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        reset_password_token: token
      }
    });

    if (!user) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Invalid reset token, please try again."
      });
    }

    if (
      user.reset_password_expires &&
      user.reset_password_expires < new Date()
    ) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Invalid reset token, please try again."
      });
    }

    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password_hash: await argon2.hash(password),
        reset_password_token: null,
        reset_password_expires: null
      }
    });

    const keys = await redis.keys(`session:${user.id.toString()}:*`);

    for await (const key of keys) {
      await redis.del(key);
    }

    await sendPasswordResetConfirmation(user.email, user.display_name);

    await posthog.capture({
      distinctId: user.id.toString(),
      event: "password_reset"
    });

    res.json({ ok: true });
  } catch (err) {
    console.error(err);

    res.status(500).json({ error: "server_error" });
  }
});
export default router;
