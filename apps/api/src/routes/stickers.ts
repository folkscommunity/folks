import { Router } from "express";

import { prisma } from "@folks/db";
import { JSONtoString } from "@folks/utils";

import { Sentry } from "@/instrument";
import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";
import { posthog } from "@/lib/posthog";

const router = Router();

router.get("/list", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      res.status(400).json({ error: "invalid_user" });
      return;
    }

    const available_stickers = await prisma.availableSticker.findMany();

    res.setHeader("Content-Type", "application/json");
    return res.send(
      JSONtoString({
        ok: true,
        stickers: available_stickers || []
      })
    );
  } catch (e) {
    console.error(e);

    Sentry.captureException(e, {
      tags: {
        source: "stickers.list"
      },
      level: "error"
    });

    res.status(500).json({ error: "server_error" });
  }
});

router.post("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { post_id, sticker_id, side, x, y, angle } = req.body;

    if (x < 0 || y < 0 || x > 100 || y > 100000) {
      return res.status(400).json({
        error: "invalid_sticker_position",
        msg: "Sticker position is out of bounds."
      });
    }

    if (angle < -20 || angle > 20) {
      return res.status(400).json({
        error: "invalid_sticker_angle",
        msg: "Sticker angle is out of bounds."
      });
    }

    if (side !== "left" && side !== "right") {
      return res.status(400).json({
        error: "invalid_sticker_side",
        msg: "Sticker side is invalid."
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_user" });
    }

    if (user.suspended) {
      return res.status(400).json({ error: "user_suspended" });
    }

    const available_sticker = await prisma.availableSticker.findFirst({
      where: {
        id: sticker_id,
        restricted: false
      }
    });

    if (!available_sticker) {
      return res.status(400).json({ error: "invalid_sticker" });
    }

    const existing_sticker = await prisma.sticker.findFirst({
      where: {
        post_id: BigInt(post_id),
        posted_by_id: user.id
      }
    });

    if (existing_sticker) {
      await prisma.sticker.update({
        where: {
          id: existing_sticker?.id || null
        },
        data: {
          available_sticker_id: available_sticker.id,
          x: parseFloat(parseFloat(x).toPrecision(4)),
          y: Number(y),
          angle: Number(angle),
          side: side
        }
      });
    } else {
      await prisma.sticker.create({
        data: {
          post_id: BigInt(post_id),
          available_sticker_id: available_sticker.id,
          side: side,
          x: parseFloat(parseFloat(x).toPrecision(4)),
          y: Number(y),
          angle: Number(angle),
          posted_by_id: user.id
        }
      });
    }

    await posthog.capture({
      distinctId: user.id.toString(),
      event: "stickers.add",
      properties: {
        post_id: post_id,
        sticker_id: available_sticker.id,
        sticker_url: available_sticker.url,
        side: side,
        x: x,
        y: y,
        angle: angle
      }
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);

    Sentry.captureException(e, {
      tags: {
        source: "stickers.add"
      },
      user: {
        id: req.user.id
      },
      level: "error"
    });

    res.status(500).json({ error: "server_error" });
  }
});

router.post("/create", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { name, url } = req.body;

    if (!name || !url) {
      return res.status(400).json({ error: "missing_data" });
    }

    if (name.length < 1 || name.length > 40 || url.length > 255) {
      return res.status(400).json({ error: "invalid_data" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user || !user.super_admin) {
      return res.status(400).json({ error: "invalid_user" });
    }

    const available_sticker = await prisma.availableSticker.create({
      data: {
        name: name,
        url: url,
        restricted: false
      }
    });

    return res.json({ ok: true, sticker: available_sticker });
  } catch (e) {
    console.error(e);

    Sentry.captureException(e, {
      tags: {
        source: "stickers.create"
      },
      level: "error"
    });

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/s/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const available_sticker = await prisma.availableSticker.findFirst({
      where: {
        id: id
      }
    });

    if (!available_sticker) {
      return res.status(400).json({ error: "invalid_sticker" });
    }

    res.setHeader("Content-Type", "application/json");
    return res.send(JSONtoString({ ok: true, sticker: available_sticker }));
  } catch (e) {
    console.error(e);

    Sentry.captureException(e, {
      tags: {
        source: "stickers.show"
      },
      level: "error"
    });

    res.status(500).json({ error: "server_error" });
  }
});

router.get("/:post_id", async (req, res) => {
  try {
    const { post_id } = req.params;

    const stickers = await prisma.sticker.findMany({
      where: {
        post_id: BigInt(post_id)
      },
      include: {
        available_sticker: {
          select: {
            id: true,
            name: true,
            url: true
          }
        },
        posted_by: {
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
    return res.send(JSONtoString({ ok: true, stickers: stickers || [] }));
  } catch (e) {
    console.error(e);

    Sentry.captureException(e, {
      tags: {
        source: "stickers.show"
      },
      level: "error"
    });

    res.status(500).json({ error: "server_error" });
  }
});

router.delete("/:id", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id)
      }
    });

    if (!user) {
      return res.status(400).json({ error: "invalid_user" });
    }

    const sticker = await prisma.sticker.findFirst({
      where: {
        id: id,
        posted_by_id: user.id
      }
    });

    if (!sticker) {
      return res.status(400).json({ error: "invalid_sticker" });
    }

    await prisma.sticker.delete({
      where: {
        id: id
      }
    });

    await posthog.capture({
      distinctId: user.id.toString(),
      event: "stickers.delete",
      properties: {
        sticker_id: id
      }
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error(e);

    Sentry.captureException(e, {
      tags: {
        source: "stickers.delete"
      },
      level: "error"
    });

    res.status(500).json({ error: "server_error" });
  }
});

export default router;
