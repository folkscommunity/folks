import Queue from "bull";
import { Router } from "express";

import { prisma } from "@folks/db";
import { JSONtoString } from "@folks/utils";

import { Sentry } from "@/instrument";
import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { redis } from "@/lib/redis";
import { sendVerifyEmail } from "@/lib/send_email";

const router = Router();

const purge_deleted_posts = new Queue(
  "queue_purge_deleted_posts",
  process.env.REDIS_URL!
);

const delete_s3_object = new Queue(
  "queue_delete_s3_object",
  process.env.REDIS_URL!
);

router.get("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(req.user.id), super_admin: true }
    });

    if (!user) {
      return res.status(403).json({ error: "unauthorized" });
    }

    const users = await prisma.user.count({});
    const posts = await prisma.post.count({});
    const deleted_posts = await prisma.post.count({
      where: { deleted_at: { not: null } }
    });
    const likes = await prisma.postLike.count({});
    const stickers = await prisma.sticker.count({});
    const attachments = await prisma.attachment.count({});
    const messages = await prisma.message.count({});
    const boards = await prisma.board.count({});
    const board_items = await prisma.boardItem.count({});

    const latest_post = await prisma.post.findFirst({
      orderBy: {
        created_at: "desc"
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            display_name: true,
            avatar_url: true
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
        }
      }
    });

    const active_users_count = await prisma.user.count({
      where: {
        last_ping: {
          gt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
        }
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(
      JSONtoString({
        ok: true,
        data: {
          counts: {
            users: users,
            active_users: active_users_count,
            posts: posts,
            deleted_posts: deleted_posts,
            likes: likes,
            stickers: stickers,
            attachments: attachments,
            messages: messages,
            boards: boards,
            board_items: board_items
          },
          latest_post: latest_post && {
            id: latest_post?.id,
            body: latest_post?.body,

            author: {
              id: latest_post?.author?.id,
              username: latest_post?.author?.username,
              display_name: latest_post?.author?.display_name,
              avatar_url: latest_post?.author?.avatar_url
            },
            attachments: latest_post?.attachments?.map((attachment) => ({
              id: attachment?.id,
              url: attachment?.url,
              type: attachment?.type,
              height: attachment?.height,
              width: attachment?.width
            }))
          }
        }
      })
    );
  } catch (err) {
    console.error(err);
    Sentry.captureException(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.post(
  "/jobs/delete-posts",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: BigInt(req.user.id), super_admin: true }
      });

      if (!user) {
        return res.status(403).json({ error: "unauthorized" });
      }

      await purge_deleted_posts.add({});

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);

      res.status(500).json({ error: "server_error" });
    }
  }
);

router.post(
  "/jobs/delete-s3-object",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: BigInt(req.user.id), super_admin: true }
      });

      if (!user) {
        return res.status(403).json({ error: "unauthorized" });
      }

      const { key } = req.body;

      if (!key) {
        return res.status(400).json({ error: "invalid_request" });
      }

      await delete_s3_object.add({
        key: key
      });

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);

      res.status(500).json({ error: "server_error" });
    }
  }
);

router.get("/jobs", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: BigInt(req.user.id), super_admin: true }
    });

    if (!user) {
      return res.status(403).json({ error: "unauthorized" });
    }

    const purge_jobs = await purge_deleted_posts.getActive();
    const delete_s3_objects_jobs = await delete_s3_object.getActive();

    res.json({
      ok: true,
      data: {
        purge_deleted_posts: purge_jobs,
        delete_s3_objects: delete_s3_objects_jobs
      }
    });
  } catch (err) {
    console.error(err);
    Sentry.captureException(err);

    res.status(500).json({ error: "server_error" });
  }
});

router.post(
  "/resend-verify-email",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: BigInt(req.user.id), super_admin: true }
      });
      if (!user) {
        return res.status(403).json({ error: "unauthorized" });
      }

      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: "invalid_request" });
      }

      const user_to_resend_verify_email = await prisma.user.findUnique({
        where: {
          id: BigInt(id)
        }
      });

      if (!user_to_resend_verify_email) {
        return res.status(400).json({ error: "user_not_found" });
      }

      if (user_to_resend_verify_email.email_verified) {
        return res.status(400).json({ error: "email_already_verified" });
      }

      await sendVerifyEmail(user_to_resend_verify_email.id.toString());

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);

      res.status(500).json({ error: "server_error" });
    }
  }
);

router.patch(
  "/announcement",
  authMiddleware,
  async (req: RequestWithUser, res) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: BigInt(req.user.id), super_admin: true }
      });

      if (!user) {
        return res.status(403).json({ error: "unauthorized" });
      }

      const { announcement } = req.body;

      if (!announcement) {
        await redis.del("announcement");
      }

      await redis.set("announcement", announcement);

      res.json({ ok: true });
    } catch (err) {
      console.error(err);
      Sentry.captureException(err);

      res.status(500).json({ error: "server_error" });
    }
  }
);

export default router;
