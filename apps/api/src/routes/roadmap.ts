import { Router } from "express";

import { prisma, RoadmapItemStatus } from "@folks/db";
import { JSONtoString } from "@folks/utils";

import { authMiddleware, RequestWithUser } from "@/lib/auth_middleware";

const app = Router();

app.get("/", async (req, res) => {
  try {
    const roadmapItems = await prisma.roadmapItem.findMany({
      where: {
        status: {
          in: [
            RoadmapItemStatus.SUGGESTED,
            RoadmapItemStatus.PLANNED,
            RoadmapItemStatus.IN_PROGRESS
          ]
        }
      },
      orderBy: {
        created_at: "desc"
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true, data: roadmapItems }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

app.post("/suggest", authMiddleware, async (req: RequestWithUser, res) => {
  try {
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

    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You must provide a title."
      });
    }

    if (title.length > 40) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Title must be less than 40 characters."
      });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Description must be less than 1000 characters."
      });
    }

    await prisma.roadmapItem.create({
      data: {
        title: title,
        description: description,
        status: "SUGGESTED",
        created_by_id: BigInt(req.user.id)
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});

app.patch("/edit/:id", authMiddleware, async (req: RequestWithUser, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: BigInt(req.user.id),
        super_admin: true
      }
    });

    if (!user) {
      return res.status(401).json({
        error: "unauthorized"
      });
    }

    const { id } = req.params;

    const roadmap_item = await prisma.roadmapItem.findUnique({
      where: {
        id: id
      }
    });

    if (!roadmap_item) {
      return res.status(404).json({
        error: "not_found",
        msg: "Roadmap item not found."
      });
    }

    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "You must provide a status."
      });
    }

    if (
      !["SUGGESTED", "PLANNED", "IN_PROGRESS", "COMPLETED"].includes(status)
    ) {
      return res.status(400).json({
        error: "invalid_request",
        msg: "Invalid status."
      });
    }

    await prisma.roadmapItem.update({
      where: {
        id: id
      },
      data: {
        status: status
      }
    });

    res.setHeader("Content-Type", "application/json");
    res.send(JSONtoString({ ok: true }));
  } catch (e) {
    console.error(e);

    res.status(500).json({
      error: "server_error",
      message: "Something went wrong."
    });
  }
});
export default app;
