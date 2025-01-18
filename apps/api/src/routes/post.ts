import { Router } from "express";

import { prisma } from "@folks/db";
import { schemas } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";

const router = Router();

router.post("/", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const { body } = req.body;

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
      await schemas.postBodySchema.parseAsync(body);
    } catch (err) {
      return res.status(400).json({
        error: "invalid_request",
        message: JSON.parse(err.message)[0].message
      });
    }

    const post = await prisma.post.create({
      data: {
        body,
        author_id: BigInt(req.user.id)
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
